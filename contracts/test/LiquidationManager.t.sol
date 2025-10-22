// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "src/LiquidationManager.sol";
import "src/Vault.sol";
import "src/tokens/SCC_USD.sol";
import "src/OracleManager.sol";
import "src/mocks/MockV3Aggregator.sol";
import "src/mocks/MockERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

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
        manager = new LiquidationManager(owner, address(oracleManager), address(sccUsd));
        vault = new Vault(owner, address(weth), address(sccUsd), address(oracleManager), address(manager));

        // Authorize contracts to use the OracleManager
        oracleManager.setAuthorization(address(vault), true);
        oracleManager.setAuthorization(address(manager), true);
        oracleManager.setAuthorization(address(this), true); // Authorize the test contract itself

        // --- Perform all setup actions as the 'owner' ---
        vm.startPrank(owner);
        sccUsd.mint(owner, 1_000_000e18);
        sccUsd.mint(buyer, 50_000e18);

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
     * @notice Tests that a partial purchase of collateral from an auction is successful and updates the Vault's state.
     */
    function test_buy_Success_PartialPurchase_VaultStateUpdated() public {
        _makeVaultUnhealthy();
        vm.prank(liquidator);
        manager.startAuction(address(vault));

        vm.warp(block.timestamp + 30 minutes);

        uint256 collateralToBuyDesired = 4e18; // Buy 4 out of 10 WETH
        uint256 currentPrice = manager.getCurrentPrice(1);
        uint256 debtRequiredForDesiredCollateral = (collateralToBuyDesired * currentPrice) / 1e18;

        uint256 actualDebtPaid = debtRequiredForDesiredCollateral;
        uint256 actualCollateralSold = collateralToBuyDesired;

        // Simulate the capping logic from the contract
        if (actualDebtPaid > INITIAL_SCC_DEBT) {
            actualDebtPaid = INITIAL_SCC_DEBT;
            actualCollateralSold = (actualDebtPaid * 1e18) / currentPrice;
        }

        if (actualCollateralSold > INITIAL_WETH_COLLATERAL) {
            actualCollateralSold = INITIAL_WETH_COLLATERAL;
            actualDebtPaid = (actualCollateralSold * currentPrice) / 1e18;
        }

        vm.startPrank(buyer);
        sccUsd.approve(address(manager), actualDebtPaid); // Approve the actual debt to be paid
        manager.buy(1, collateralToBuyDesired); // Call with the desired amount
        vm.stopPrank();

        // Assert auction state is updated
        (uint256 collateralAmountAuction, uint256 debtToCoverAuction,,,) = manager.auctions(1);
        assertApproxEqAbs(collateralAmountAuction, INITIAL_WETH_COLLATERAL - actualCollateralSold, 1e15, "Auction collateral should be reduced");
        assertApproxEqAbs(debtToCoverAuction, INITIAL_SCC_DEBT - actualDebtPaid, 1e15, "Auction debt should be reduced");

        // Assert Vault state is updated
        uint256 expectedRemainingVaultCollateral = INITIAL_WETH_COLLATERAL - actualCollateralSold;
        uint256 expectedRemainingVaultDebt = INITIAL_SCC_DEBT - actualDebtPaid;
        assertApproxEqAbs(vault.collateralAmount(), expectedRemainingVaultCollateral, 1e15, "Vault collateral should be correctly updated after partial liquidation");
        assertApproxEqAbs(vault.debtAmount(), expectedRemainingVaultDebt, 1e15, "Vault debt should be correctly updated after partial liquidation");

        // Assert buyer received collateral
        assertApproxEqAbs(weth.balanceOf(buyer), actualCollateralSold, 1e15, "Buyer should receive correct collateral amount");

        // Assert manager holds the paid funds
        assertEq(sccUsd.balanceOf(address(manager)), actualDebtPaid, "Manager should hold the paid funds");
    }

    /**
     * @notice Tests that multiple partial purchases can lead to a full liquidation and correct Vault state update.
     */
    function test_buy_MultiplePartialPurchases_VaultStateUpdated() public {
        _makeVaultUnhealthy();
        vm.prank(liquidator);
        manager.startAuction(address(vault));

        vm.warp(block.timestamp + 30 minutes);

        uint256 collateralToBuy1 = 3e18; // First purchase: 3 WETH
        uint256 currentPrice1 = manager.getCurrentPrice(1);
        uint256 debtRequired1 = (collateralToBuy1 * currentPrice1) / 1e18;

        uint256 actualDebtPaid1 = debtRequired1;
        uint256 actualCollateralSold1 = collateralToBuy1;

        if (actualDebtPaid1 > INITIAL_SCC_DEBT) {
            actualDebtPaid1 = INITIAL_SCC_DEBT;
            actualCollateralSold1 = (actualDebtPaid1 * 1e18) / currentPrice1;
        }
        if (actualCollateralSold1 > INITIAL_WETH_COLLATERAL) {
            actualCollateralSold1 = INITIAL_WETH_COLLATERAL;
            actualDebtPaid1 = (actualCollateralSold1 * currentPrice1) / 1e18;
        }

        vm.startPrank(buyer);
        sccUsd.approve(address(manager), actualDebtPaid1); 
        manager.buy(1, collateralToBuy1);
        vm.stopPrank();

        // Verify state after first partial purchase
        assertApproxEqAbs(vault.collateralAmount(), INITIAL_WETH_COLLATERAL - actualCollateralSold1, 1e15, "Vault collateral after 1st buy");
        assertApproxEqAbs(vault.debtAmount(), INITIAL_SCC_DEBT - actualDebtPaid1, 1e15, "Vault debt after 1st buy");
        assertApproxEqAbs(weth.balanceOf(buyer), actualCollateralSold1, 1e15, "Buyer collateral after 1st buy");
        assertApproxEqAbs(sccUsd.balanceOf(address(manager)), actualDebtPaid1, 1e15, "Manager funds after 1st buy");

        // Second purchase to fully liquidate
        vm.warp(block.timestamp + 30 minutes);

        uint256 remainingAuctionDebt = INITIAL_SCC_DEBT - actualDebtPaid1;
        uint256 remainingAuctionCollateral = INITIAL_WETH_COLLATERAL - actualCollateralSold1;

        uint256 collateralToBuy2 = remainingAuctionCollateral; // Try to buy remaining
        uint256 currentPrice2 = manager.getCurrentPrice(1);
        uint256 debtRequired2 = (collateralToBuy2 * currentPrice2) / 1e18;

        uint256 actualDebtPaid2 = debtRequired2;
        uint256 actualCollateralSold2 = collateralToBuy2;

        if (actualDebtPaid2 > remainingAuctionDebt) {
            actualDebtPaid2 = remainingAuctionDebt;
            actualCollateralSold2 = (actualDebtPaid2 * 1e18) / currentPrice2;
        }
        if (actualCollateralSold2 > remainingAuctionCollateral) {
            actualCollateralSold2 = remainingAuctionCollateral;
            actualDebtPaid2 = (actualCollateralSold2 * currentPrice2) / 1e18;
        }

        vm.startPrank(buyer);
        sccUsd.approve(address(manager), sccUsd.balanceOf(buyer)); // Approve all remaining SCC_USD
        manager.buy(1, collateralToBuy2);
        vm.stopPrank();

        // Assert auction is deleted
        (uint256 collateralAmountAuction, uint256 debtToCoverAuction,,,) = manager.auctions(1);
        assertEq(collateralAmountAuction, 0, "Auction collateral should be 0 after full liquidation");
        assertEq(debtToCoverAuction, 0, "Auction debt should be 0 after full liquidation");

        // Assert Vault state is fully updated
        assertEq(vault.collateralAmount(), 0, "Vault collateral should be 0 after full liquidation");
        assertEq(vault.debtAmount(), 0, "Vault debt should be 0 after full liquidation");

        // Assert buyer received total collateral
        assertApproxEqAbs(weth.balanceOf(buyer), actualCollateralSold1 + actualCollateralSold2, 1e15, "Buyer should receive total collateral");

        // Assert manager holds total paid funds
        assertApproxEqAbs(sccUsd.balanceOf(address(manager)), actualDebtPaid1 + actualDebtPaid2, 1e15, "Manager should hold total paid funds");
    }
    function test_buy_WithPriceFluctuations() public {
        _makeVaultUnhealthy();
        vm.prank(liquidator);
        manager.startAuction(address(vault));

        // Initial purchase attempt with current price
        vm.warp(block.timestamp + 15 minutes);
        uint256 collateralToBuy1 = 2e18;
        uint256 currentPrice1 = manager.getCurrentPrice(1);
        uint256 debtRequired1 = (collateralToBuy1 * currentPrice1) / 1e18;

        uint256 actualDebtPaid1 = debtRequired1;
        uint256 actualCollateralSold1 = collateralToBuy1;

        if (actualDebtPaid1 > INITIAL_SCC_DEBT) {
            actualDebtPaid1 = INITIAL_SCC_DEBT;
            actualCollateralSold1 = (actualDebtPaid1 * 1e18) / currentPrice1;
        }
        if (actualCollateralSold1 > INITIAL_WETH_COLLATERAL) {
            actualCollateralSold1 = INITIAL_WETH_COLLATERAL;
            actualDebtPaid1 = (actualCollateralSold1 * currentPrice1) / 1e18;
        }

        vm.startPrank(buyer);
        sccUsd.approve(address(manager), actualDebtPaid1);
        manager.buy(1, collateralToBuy1);
        vm.stopPrank();

        // Simulate price drop
        int256 newPrice = 1800e8; // Further drop
        wethPriceFeed.updateAnswer(newPrice);

        // Second purchase attempt after price drop
        vm.warp(block.timestamp + 15 minutes);
        uint256 collateralToBuy2 = 3e18;
        uint256 currentPrice2 = manager.getCurrentPrice(1);
        uint256 debtRequired2 = (collateralToBuy2 * currentPrice2) / 1e18;

        uint256 remainingAuctionDebt = INITIAL_SCC_DEBT - actualDebtPaid1;
        uint256 remainingAuctionCollateral = INITIAL_WETH_COLLATERAL - actualCollateralSold1;

        uint256 actualDebtPaid2 = debtRequired2;
        uint256 actualCollateralSold2 = collateralToBuy2;

        if (actualDebtPaid2 > remainingAuctionDebt) {
            actualDebtPaid2 = remainingAuctionDebt;
            actualCollateralSold2 = (actualDebtPaid2 * 1e18) / currentPrice2;
        }
        if (actualCollateralSold2 > remainingAuctionCollateral) {
            actualCollateralSold2 = remainingAuctionCollateral;
            actualDebtPaid2 = (actualCollateralSold2 * currentPrice2) / 1e18;
        }

        vm.startPrank(buyer);
        sccUsd.approve(address(manager), sccUsd.balanceOf(buyer)); // Approve all remaining SCC_USD
        manager.buy(1, collateralToBuy2);
        vm.stopPrank();

        // Assert final state (partial liquidation, auction still active)
        (uint256 collateralAmountAuction, uint256 debtToCoverAuction,,,) = manager.auctions(1);
        assertApproxEqAbs(collateralAmountAuction, INITIAL_WETH_COLLATERAL - actualCollateralSold1 - actualCollateralSold2, 1e15, "Final auction collateral");
        assertApproxEqAbs(debtToCoverAuction, INITIAL_SCC_DEBT - actualDebtPaid1 - actualDebtPaid2, 1e15, "Final auction debt");

        assertApproxEqAbs(vault.collateralAmount(), INITIAL_WETH_COLLATERAL - actualCollateralSold1 - actualCollateralSold2, 1e15, "Final vault collateral");
        assertApproxEqAbs(vault.debtAmount(), INITIAL_SCC_DEBT - actualDebtPaid1 - actualDebtPaid2, 1e15, "Final vault debt");

        assertApproxEqAbs(weth.balanceOf(buyer), actualCollateralSold1 + actualCollateralSold2, 1e15, "Total buyer collateral");
        assertApproxEqAbs(sccUsd.balanceOf(address(manager)), actualDebtPaid1 + actualDebtPaid2, 1e15, "Total manager funds");
    }
    function test_buy_DebtDustHandling() public {
        _makeVaultUnhealthy();
        vm.prank(liquidator);
        manager.startAuction(address(vault));

        // Set DEBT_DUST to a higher value for testing purposes (e.g., 100 wei)
        // This is usually a constant, but for testing, we can simulate its effect.
        // For this test, we'll ensure the remaining debt is just below a threshold.

        // Simulate a purchase that leaves a very small amount of debt, less than DEBT_DUST
        vm.warp(block.timestamp + 1 hours);

            uint256 currentPrice = manager.getCurrentPrice(1);
            (uint256 auctionCollateral, uint256 debtToCoverAuction,,,) = manager.auctions(1);
        
            // Calculate collateral to buy to leave a dust amount of debt
            uint256 debtToPayToLeaveDust = debtToCoverAuction - manager.DEBT_DUST() + 1; // Pay almost all debt
            uint256 collateralToBuy = (debtToPayToLeaveDust * 1e18) / currentPrice;
        
            // Ensure collateralToBuy doesn't exceed available collateral
            if (collateralToBuy > auctionCollateral) {
                collateralToBuy = auctionCollateral;
                debtToPayToLeaveDust = (collateralToBuy * currentPrice) / 1e18;
            }
        vm.startPrank(buyer);
        sccUsd.approve(address(manager), debtToPayToLeaveDust);
        manager.buy(1, collateralToBuy);
        vm.stopPrank();

        // After this purchase, the remaining debt in the auction should be slightly above DEBT_DUST
        // and the auction should NOT be closed.
        (uint256 collateralAmountAuction, uint256 debtToCoverAuctionFinal,,,) = manager.auctions(1);

        uint256 expectedRemainingCollateral = 909696969696969697;
        uint256 expectedRemainingDebt = 1000000000000000050; // Just over 1e18

        assertApproxEqAbs(collateralAmountAuction, expectedRemainingCollateral, 1, "Auction collateral should remain.");
        assertApproxEqAbs(debtToCoverAuctionFinal, expectedRemainingDebt, 1, "Auction debt should be just over dust.");

        // Assert Vault state reflects the partial sale
        assertApproxEqAbs(vault.collateralAmount(), expectedRemainingCollateral, 1, "Vault collateral should be reduced by amount sold.");
        assertApproxEqAbs(vault.debtAmount(), expectedRemainingDebt, 1, "Vault debt should be reduced by amount paid.");
    }

    /**
     * @notice Tests that a vault is no longer liquidatable after a full liquidation.
     */
    function test_VaultNotLiquidatable_AfterFullLiquidation() public {
        _makeVaultUnhealthy();
        vm.prank(liquidator);
        manager.startAuction(address(vault));

        vm.warp(block.timestamp + 1 hours);

        uint256 collateralToBuyDesired = INITIAL_WETH_COLLATERAL;
        uint256 currentPrice = manager.getCurrentPrice(1);
        uint256 debtRequiredForDesiredCollateral = (collateralToBuyDesired * currentPrice) / 1e18;

        uint256 actualDebtPaid = debtRequiredForDesiredCollateral;
        uint256 actualCollateralSold = collateralToBuyDesired;

        if (actualDebtPaid > INITIAL_SCC_DEBT) {
            actualDebtPaid = INITIAL_SCC_DEBT;
            actualCollateralSold = (actualDebtPaid * 1e18) / currentPrice;
        }
        if (actualCollateralSold > INITIAL_WETH_COLLATERAL) {
            actualCollateralSold = INITIAL_WETH_COLLATERAL;
            actualDebtPaid = (actualCollateralSold * currentPrice) / 1e18;
        }

        vm.startPrank(buyer);
        sccUsd.approve(address(manager), actualDebtPaid);
        manager.buy(1, collateralToBuyDesired);
        vm.stopPrank();

        // Assert that the vault is no longer liquidatable
        assertFalse(manager.isVaultLiquidatable(address(vault)), "Vault should not be liquidatable after full liquidation");
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
     * @notice Tests that a full purchase of collateral successfully updates the Vault's state.
     */
    function test_buy_Success_FullPurchase_VaultStateUpdated() public {
        _makeVaultUnhealthy();
        vm.prank(liquidator);
        manager.startAuction(address(vault));

        vm.warp(block.timestamp + 1 hours);

        uint256 collateralToBuyDesired = INITIAL_WETH_COLLATERAL; // Buyer wants to buy all 10 WETH
        uint256 currentPrice = manager.getCurrentPrice(1);
        uint256 debtRequiredForDesiredCollateral = (collateralToBuyDesired * currentPrice) / 1e18;

        uint256 actualDebtPaid = debtRequiredForDesiredCollateral;
        uint256 actualCollateralSold = collateralToBuyDesired;

        // Simulate the capping logic from the contract
        if (actualDebtPaid > INITIAL_SCC_DEBT) { // auction.debtToCover is INITIAL_SCC_DEBT in this test
            actualDebtPaid = INITIAL_SCC_DEBT;
            actualCollateralSold = (actualDebtPaid * 1e18) / currentPrice;
        }

        // Ensure we don't sell more collateral than available in the auction
        if (actualCollateralSold > INITIAL_WETH_COLLATERAL) { // auction.collateralAmount is INITIAL_WETH_COLLATERAL
            actualCollateralSold = INITIAL_WETH_COLLATERAL;
            actualDebtPaid = (actualCollateralSold * currentPrice) / 1e18;
        }

        vm.startPrank(buyer);
        sccUsd.approve(address(manager), actualDebtPaid); // Approve the actual debt to be paid
        manager.buy(1, collateralToBuyDesired); // Call with the desired amount
        vm.stopPrank();

        // Assert auction is deleted
        (uint256 collateralAmountAuction, uint256 debtToCoverAuction,,,) = manager.auctions(1);
        assertEq(collateralAmountAuction, 0, "Auction collateral should be 0");
        assertEq(debtToCoverAuction, 0, "Auction debt should be 0");

        // Assert Vault state is updated
        assertApproxEqAbs(vault.collateralAmount(), 0, 1e15, "Vault collateral should be 0 after full liquidation");
        assertEq(vault.debtAmount(), 0, "Vault debt should be 0 after full liquidation");

        // Assert buyer received collateral
        assertApproxEqAbs(weth.balanceOf(buyer), actualCollateralSold, 1e15, "Buyer should receive correct collateral amount");

        // Assert manager holds the paid funds
        assertEq(sccUsd.balanceOf(address(manager)), actualDebtPaid, "Manager should hold the paid funds");
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
        Vault noDebtVault = new Vault(
            owner,
            address(weth),
            address(sccUsd),
            address(oracleManager),
            address(manager)
        );
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

    // --- Test withdrawFees --- //

    /**
     * @notice Tests that the owner can successfully withdraw collected fees.
     */
    function test_WithdrawFees_Success() public {
        // 1. Perform a partial purchase to generate fees in the manager contract
        _makeVaultUnhealthy();
        vm.prank(liquidator);
        manager.startAuction(address(vault));
        vm.warp(block.timestamp + 30 minutes);

        uint256 collateralToBuy = 4e18;
        uint256 currentPrice = manager.getCurrentPrice(1);
        uint256 debtToPay = (collateralToBuy * currentPrice) / 1e18;

        vm.startPrank(buyer);
        sccUsd.approve(address(manager), debtToPay);
        manager.buy(1, collateralToBuy);
        vm.stopPrank();

        assertEq(sccUsd.balanceOf(address(manager)), debtToPay);

        // 2. Withdraw the fees as the owner
        address recipient = makeAddr("recipient");
        uint256 recipientBalanceBefore = sccUsd.balanceOf(recipient);

        vm.prank(owner);
        manager.withdrawFees(recipient, debtToPay);

        // 3. Assert balances
        assertEq(sccUsd.balanceOf(address(manager)), 0);
        assertEq(sccUsd.balanceOf(recipient), recipientBalanceBefore + debtToPay);
    }

    /**
     * @notice Tests that a non-owner cannot withdraw collected fees.
     */
    function test_Fail_WithdrawFees_NotOwner() public {
        // Attempt to withdraw fees as a non-owner (buyer)
        vm.prank(buyer);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, buyer));
        manager.withdrawFees(address(buyer), 100e18);
    }
}
