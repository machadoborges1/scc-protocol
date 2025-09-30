// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "src/LiquidationManager.sol";
import "src/Vault.sol";
import "src/tokens/SCC_USD.sol";
import "src/mocks/MockOracle.sol";
import "src/mocks/MockERC20.sol";

contract LiquidationManagerTest is Test {
    LiquidationManager public manager;
    Vault public vault;
    SCC_USD public sccUsd;
    MockOracle public oracle;
    MockERC20 public weth;

    address public owner = makeAddr("owner");
    address public liquidator = makeAddr("liquidator");
    address public buyer = makeAddr("buyer");

    uint256 public constant INITIAL_WETH_COLLATERAL = 10e18;
    uint256 public constant INITIAL_SCC_DEBT = 15_000e18; // 10 WETH @ $3000/ETH = $30k value. 50% CR is $15k debt.

    function setUp() public {
        // Deploy contracts
        oracle = new MockOracle(); // Default price is $3000
        weth = new MockERC20("Wrapped Ether", "WETH");
        sccUsd = new SCC_USD(owner);
        vault = new Vault(owner, address(weth), address(sccUsd), address(oracle));
        manager = new LiquidationManager(owner, address(oracle), address(sccUsd));

        // --- Perform all setup actions as the 'owner' ---
        vm.startPrank(owner);

        // 1. Mint test funds for owner and buyer
        sccUsd.mint(owner, 1_000_000e18);
        sccUsd.mint(buyer, 50_000e18);

        // 2. Set the manager address in the vault for authorization
        vault.setLiquidationManager(address(manager));

        // 3. Transfer SCC_USD ownership to the Vault so only it can mint going forward
        sccUsd.transferOwnership(address(vault));

        // 4. Fund owner with WETH, approve vault, and deposit collateral
        weth.mint(owner, INITIAL_WETH_COLLATERAL);
        weth.approve(address(vault), INITIAL_WETH_COLLATERAL);
        vault.depositCollateral(INITIAL_WETH_COLLATERAL);

        // 5. Mint some debt to create a position
        vault.mint(INITIAL_SCC_DEBT);

        vm.stopPrank();
    }

    function _makeVaultUnhealthy() internal {
        // Drop oracle price to make vault liquidatable
        // Initial CR = (10 * 3000) / 15000 = 200%
        // New CR = (10 * 2200) / 15000 = 146.6% < 150%
        oracle.setPrice(2200 * 1e18);
    }

    // --- Test startAuction --- //

    function test_startAuction_Success() public {
        _makeVaultUnhealthy();

        uint256 expectedStartPrice = (oracle.getPrice() * manager.START_PRICE_MULTIPLIER()) / 100;

        vm.expectEmit(true, true, true, true);
        emit LiquidationManager.AuctionStarted(1, address(vault), INITIAL_WETH_COLLATERAL, INITIAL_SCC_DEBT, expectedStartPrice);
        
        vm.prank(liquidator);
        manager.startAuction(address(vault));

        (uint256 collateralAmount, uint256 debtToCover, address vaultAddress, uint96 startTime, uint256 startPrice) = manager.auctions(1);
        assertEq(collateralAmount, INITIAL_WETH_COLLATERAL);
        assertEq(debtToCover, INITIAL_SCC_DEBT);
        assertEq(vaultAddress, address(vault));
        assertEq(startPrice, expectedStartPrice);
        assertTrue(startTime > 0);
    }

    function test_fail_startAuction_HealthyVault() public {
        vm.prank(liquidator);
        vm.expectRevert(LiquidationManager.VaultNotLiquidatable.selector);
        manager.startAuction(address(vault));
    }

    function test_fail_startAuction_AlreadyActive() public {
        _makeVaultUnhealthy();
        vm.prank(liquidator);
        manager.startAuction(address(vault));

        vm.expectRevert(LiquidationManager.AuctionAlreadyActive.selector);
        manager.startAuction(address(vault));
    }

    // --- Test getCurrentPrice --- //

    function test_getCurrentPrice_DecaysLinearly() public {
        _makeVaultUnhealthy();
        vm.prank(liquidator);
        manager.startAuction(address(vault));

        uint256 startPrice = manager.getCurrentPrice(1);
        uint256 halflife = manager.PRICE_DECAY_HALFLIFE();

        vm.warp(block.timestamp + halflife);

        uint256 priceAfterHalfLife = manager.getCurrentPrice(1);
        
        // Our linear decay model means price should be roughly half
        uint256 expectedPrice = startPrice / 2;
        uint256 delta = 1e15;
        assertTrue(priceAfterHalfLife >= expectedPrice - delta && priceAfterHalfLife <= expectedPrice + delta);
    }

    // --- Test buy --- //

    function test_buy_Success_PartialPurchase() public {
        _makeVaultUnhealthy();
        vm.prank(liquidator);
        manager.startAuction(address(vault));

        // Warp time to let price decay a bit
        vm.warp(block.timestamp + 30 minutes);

        uint256 collateralToBuy = 4e18; // Buy 4 out of 10 WETH
        uint256 currentPrice = manager.getCurrentPrice(1);
        uint256 debtToPay = (collateralToBuy * currentPrice) / 1e18;

        vm.startPrank(buyer);
        sccUsd.approve(address(manager), debtToPay);
        manager.buy(1, collateralToBuy);
        vm.stopPrank();

        (uint256 collateralAmount, uint256 debtToCover, , ,) = manager.auctions(1);
        assertEq(collateralAmount, INITIAL_WETH_COLLATERAL - collateralToBuy);
        assertEq(debtToCover, INITIAL_SCC_DEBT - debtToPay);
        assertEq(weth.balanceOf(buyer), collateralToBuy);
        assertEq(sccUsd.balanceOf(address(manager)), debtToPay, "Manager should hold the paid funds");
    }

    function test_buy_Success_FullPurchase() public {
        _makeVaultUnhealthy();
        vm.prank(liquidator);
        manager.startAuction(address(vault));

        vm.warp(block.timestamp + 1 hours);

        uint256 collateralToBuy = INITIAL_WETH_COLLATERAL;
        uint256 currentPrice = manager.getCurrentPrice(1);
        uint256 debtToPay = (collateralToBuy * currentPrice) / 1e18;

        // The debt to pay might be capped at the total debt
        if (debtToPay > INITIAL_SCC_DEBT) {
            debtToPay = INITIAL_SCC_DEBT;
        }

        vm.startPrank(buyer);
        sccUsd.approve(address(manager), debtToPay);
        manager.buy(1, collateralToBuy);
        vm.stopPrank();

        // Auction should be closed
        (,,,uint96 startTime,) = manager.auctions(1);
        assertEq(startTime, 0, "Auction should be deleted");

        // Buyer receives the collateral they paid for
        uint256 expectedCollateral = (debtToPay * 1e18) / currentPrice;
        
        uint256 delta = 1e15;
        assertTrue(weth.balanceOf(buyer) >= expectedCollateral - delta && weth.balanceOf(buyer) <= expectedCollateral + delta);

        // Original vault owner should get back the surplus collateral
        assertEq(weth.balanceOf(owner), INITIAL_WETH_COLLATERAL - expectedCollateral);
    }

    function test_fail_buy_InvalidPurchaseAmount_TooMuch() public {
        _makeVaultUnhealthy();
        vm.prank(liquidator);
        manager.startAuction(address(vault));

        uint256 collateralToBuy = INITIAL_WETH_COLLATERAL + 1e18;

        vm.startPrank(buyer);
        sccUsd.approve(address(manager), 1_000_000e18);
        vm.expectRevert(LiquidationManager.InvalidPurchaseAmount.selector);
        manager.buy(1, collateralToBuy);
        vm.stopPrank();
    }

    function test_fail_buy_AuctionNotFound() public {
        vm.prank(buyer);
        vm.expectRevert(LiquidationManager.AuctionNotFound.selector);
        manager.buy(999, 1e18);
    }
}