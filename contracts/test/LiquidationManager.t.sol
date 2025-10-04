// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "src/LiquidationManager.sol";
import "src/Vault.sol";
import "src/tokens/SCC_USD.sol";
import "src/OracleManager.sol";
import "src/mocks/MockV3Aggregator.sol";
import "src/mocks/MockERC20.sol";

/**
 * @dev Test suite for the LiquidationManager contract.
 */
contract LiquidationManagerTest is Test {
    LiquidationManager public manager;
    Vault public vault;
    SCC_USD public sccUsd;
    OracleManager public oracleManager;
    MockV3Aggregator public wethPriceFeed;
    MockERC20 public weth;

    address public owner = makeAddr("owner");
    address public liquidator = makeAddr("liquidator");
    address public buyer = makeAddr("buyer");

    uint256 public constant INITIAL_WETH_COLLATERAL = 10e18;
    uint256 public constant INITIAL_SCC_DEBT = 15_000e18; // 10 WETH @ $3000/ETH = $30k value. 50% CR is $15k debt.
    int256 public constant INITIAL_WETH_PRICE = 3000e8;

    /**
     * @notice Sets up the testing environment before each test.
     */
    function setUp() public {
        // Deploy Oracle and its mock feed
        oracleManager = new OracleManager(1 hours);
        wethPriceFeed = new MockV3Aggregator(8, INITIAL_WETH_PRICE);
        weth = new MockERC20("Wrapped Ether", "WETH");
        oracleManager.setPriceFeed(address(weth), address(wethPriceFeed));

        // Deploy other contracts
        sccUsd = new SCC_USD(owner);
        vault = new Vault(owner, address(weth), address(sccUsd), address(oracleManager));
        manager = new LiquidationManager(owner, address(oracleManager), address(sccUsd));

        // Authorize contracts to use the OracleManager
        oracleManager.setAuthorization(address(vault), true);
        oracleManager.setAuthorization(address(manager), true);
        oracleManager.setAuthorization(address(this), true); // Authorize the test contract itself

        // --- Perform all setup actions as the 'owner' ---
        vm.startPrank(owner);
        sccUsd.mint(owner, 1_000_000e18);
        sccUsd.mint(buyer, 50_000e18);
        vault.setLiquidationManager(address(manager));

        // NEW: Grant the Vault contract the MINTER_ROLE on the SCC_USD token
        sccUsd.grantRole(sccUsd.MINTER_ROLE(), address(vault));

        sccUsd.transferOwnership(address(vault));
        weth.mint(owner, INITIAL_WETH_COLLATERAL);
        weth.approve(address(vault), INITIAL_WETH_COLLATERAL);
        vault.depositCollateral(INITIAL_WETH_COLLATERAL);
        vault.mint(INITIAL_SCC_DEBT);
        vm.stopPrank();
    }

    /**
     * @notice Helper function to simulate a vault becoming unhealthy by dropping the collateral price.
     */
    function _makeVaultUnhealthy() internal {
        // Drop oracle price to make vault liquidatable
        // Initial CR = (10 * 3000) / 15000 = 200%
        // New CR = (10 * 2200) / 15000 = 146.6% < 150%
        int256 newPrice = 2200e8; // $2200
        wethPriceFeed.updateAnswer(newPrice);
    }

    // --- Test startAuction --- //

    /**
     * @notice Tests that an auction can be successfully started for an unhealthy vault.
     */
    function test_startAuction_Success() public {
        _makeVaultUnhealthy();
        uint256 price = oracleManager.getPrice(address(weth));
        uint256 expectedStartPrice = (price * manager.START_PRICE_MULTIPLIER()) / 100;

        vm.expectEmit(true, true, true, true);
        emit LiquidationManager.AuctionStarted(
            1, address(vault), INITIAL_WETH_COLLATERAL, INITIAL_SCC_DEBT, expectedStartPrice
        );

        vm.prank(liquidator);
        manager.startAuction(address(vault));

        (uint256 collateralAmount, uint256 debtToCover, address vaultAddress, uint96 startTime, uint256 startPrice) =
            manager.auctions(1);
        assertEq(collateralAmount, INITIAL_WETH_COLLATERAL);
        assertEq(debtToCover, INITIAL_SCC_DEBT);
        assertEq(vaultAddress, address(vault));
        assertEq(startPrice, expectedStartPrice);
        assertTrue(startTime > 0);
    }

    /**
     * @notice Tests that starting an auction for a healthy vault reverts.
     */
    function test_fail_startAuction_HealthyVault() public {
        vm.prank(liquidator);
        vm.expectRevert(LiquidationManager.VaultNotLiquidatable.selector);
        manager.startAuction(address(vault));
    }

    /**
     * @notice Tests that starting an auction for a vault that already has an active auction reverts.
     */
    function test_fail_startAuction_AlreadyActive() public {
        _makeVaultUnhealthy();
        vm.prank(liquidator);
        manager.startAuction(address(vault));

        vm.expectRevert(LiquidationManager.AuctionAlreadyActive.selector);
        manager.startAuction(address(vault));
    }

    // --- Test getCurrentPrice --- //

    /**
     * @notice Tests that the collateral price decays linearly over time during an auction.
     */
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
        assertApproxEqAbs(priceAfterHalfLife, expectedPrice, 1e15);
    }

    // --- Test buy --- //

    /**
     * @notice Tests that a partial purchase of collateral from an auction is successful.
     */
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

        (uint256 collateralAmount, uint256 debtToCover,,,) = manager.auctions(1);
        assertEq(collateralAmount, INITIAL_WETH_COLLATERAL - collateralToBuy);
        assertEq(debtToCover, INITIAL_SCC_DEBT - debtToPay);
        assertEq(weth.balanceOf(buyer), collateralToBuy);
        assertEq(sccUsd.balanceOf(address(manager)), debtToPay, "Manager should hold the paid funds");
    }

    /**
     * @notice Tests that a full purchase of collateral from an auction is successful and closes the auction.
     */
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

        (,,, uint96 startTime,) = manager.auctions(1);
        assertEq(startTime, 0, "Auction should be deleted");

        uint256 expectedCollateral = (debtToPay * 1e18) / currentPrice;
        assertApproxEqAbs(weth.balanceOf(buyer), expectedCollateral, 1e15);
        assertApproxEqAbs(weth.balanceOf(owner), INITIAL_WETH_COLLATERAL - expectedCollateral, 1e15);
    }

    /**
     * @notice Tests that buying more collateral than available in an auction reverts.
     */
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

    /**
     * @notice Tests that attempting to buy from a non-existent auction reverts.
     */
    function test_fail_buy_AuctionNotFound() public {
        vm.prank(buyer);
        vm.expectRevert(LiquidationManager.AuctionNotFound.selector);
        manager.buy(999, 1e18);
    }

    /**
     * @notice Tests that starting an auction for a vault with zero debt reverts.
     * This covers the division-by-zero edge case.
     */
    function test_fail_startAuction_NoDebt() public {
        // Create a new vault specifically for this test
        vm.startPrank(owner);
        Vault noDebtVault = new Vault(owner, address(weth), address(sccUsd), address(oracleManager));
        noDebtVault.setLiquidationManager(address(manager));
        vm.stopPrank(); // Stop pranking as owner

        // Authorize the new vault on the oracle as the test contract (owner of oracle)
        oracleManager.setAuthorization(address(noDebtVault), true);

        // Give it collateral but mint no debt
        vm.startPrank(owner);
        weth.mint(owner, 5e18);
        weth.approve(address(noDebtVault), 5e18);
        noDebtVault.depositCollateral(5e18);
        vm.stopPrank();

        // Assert that debt is indeed zero
        assertEq(noDebtVault.debtAmount(), 0);

        // Attempt to liquidate, expecting a revert because a vault with no debt is healthy.
        vm.prank(liquidator);
        vm.expectRevert(LiquidationManager.VaultNotLiquidatable.selector);
        manager.startAuction(address(noDebtVault));
    }
}
