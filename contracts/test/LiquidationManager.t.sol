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
    address public bidder1 = makeAddr("bidder1");
    address public bidder2 = makeAddr("bidder2");

    function setUp() public {
        // Deploy contracts
        oracle = new MockOracle();
        weth = new MockERC20("Wrapped Ether", "WETH");
        sccUsd = new SCC_USD(owner);
        vault = new Vault(owner, address(weth), address(sccUsd), address(oracle));
        manager = new LiquidationManager(owner, address(oracle), address(sccUsd));

        // --- Perform all setup actions as the 'owner' ---
        vm.startPrank(owner);

        // Mint a large amount of test funds for the owner before changing ownership
        sccUsd.mint(owner, 1_000_000e18);

        // 1. Transfer SCC_USD ownership to the Vault so only it can mint going forward
        sccUsd.transferOwnership(address(vault));

        // 2. Fund owner with WETH, approve vault, and deposit collateral
        weth.mint(owner, 10e18);
        weth.approve(address(vault), 10e18);
        vault.depositCollateral(10e18);

        // 3. Mint some debt to create a position
        vault.mint(15_000e18);

        vm.stopPrank();
    }

    function test_Fail_Liquidate_HealthyVault() public {
        vm.prank(liquidator);
        vm.expectRevert(LiquidationManager.VaultNotLiquidatable.selector);
        manager.liquidate(address(vault));
    }

    function test_Liquidate_UnhealthyVault() public {
        oracle.setPrice(2200 * 1e18);
        vm.expectEmit(true, true, false, true);
        emit LiquidationManager.AuctionStarted(1, address(vault), 10e18, 15_000e18);
        vm.prank(liquidator);
        manager.liquidate(address(vault));
    }

    function test_Bid_Success_FirstBid() public {
        oracle.setPrice(2200 * 1e18);
        vm.prank(liquidator);
        manager.liquidate(address(vault));

        uint256 bidAmount = 15_000e18;
        
        vm.startPrank(owner);
        sccUsd.transfer(bidder1, bidAmount);
        vm.stopPrank();

        vm.startPrank(bidder1);
        sccUsd.approve(address(manager), bidAmount);
        manager.bid(1, bidAmount);
        vm.stopPrank();

        address highestBidder;
        uint256 highestBid;
        (,, highestBidder, highestBid,,) = manager.auctions(1);

        assertEq(highestBidder, bidder1);
        assertEq(highestBid, bidAmount);
        assertEq(sccUsd.balanceOf(address(manager)), bidAmount);
    }

    function test_Bid_Success_SecondBid() public {
        test_Bid_Success_FirstBid();

        uint256 firstBid = 15_000e18;
        uint256 secondBid = (firstBid * 105) / 100;

        vm.startPrank(owner);
        sccUsd.transfer(bidder2, secondBid);
        vm.stopPrank();

        vm.startPrank(bidder2);
        sccUsd.approve(address(manager), secondBid);
        manager.bid(1, secondBid);
        vm.stopPrank();

        address highestBidder;
        uint256 highestBid;
        (,, highestBidder, highestBid,,) = manager.auctions(1);

        assertEq(highestBidder, bidder2);
        assertEq(highestBid, secondBid);
        assertEq(sccUsd.balanceOf(address(manager)), secondBid, "Manager should hold second bid");
        assertEq(sccUsd.balanceOf(bidder1), firstBid, "Bidder1 should be refunded");
    }

    function test_Fail_Bid_TooLow() public {
        test_Bid_Success_FirstBid();

        uint256 firstBid = 15_000e18;
        uint256 lowBid = (firstBid * 104) / 100;

        vm.startPrank(owner);
        sccUsd.transfer(bidder2, lowBid);
        vm.stopPrank();

        vm.startPrank(bidder2);
        sccUsd.approve(address(manager), lowBid);

        vm.expectRevert(LiquidationManager.BidTooLow.selector);
        manager.bid(1, lowBid);
    }

    function test_Fail_Bid_AuctionEnded() public {
        oracle.setPrice(2200 * 1e18);
        vm.prank(liquidator);
        manager.liquidate(address(vault));

        vm.warp(block.timestamp + manager.AUCTION_DURATION() + 1);

        uint256 bidAmount = 15_000e18;

        vm.startPrank(owner);
        sccUsd.transfer(bidder1, bidAmount);
        vm.stopPrank();

        vm.startPrank(bidder1);
        sccUsd.approve(address(manager), bidAmount);

        vm.expectRevert(LiquidationManager.AuctionEnded.selector);
        manager.bid(1, bidAmount);
    }
}
