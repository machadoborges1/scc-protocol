// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {StakingPool} from "../src/StakingPool.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";

contract StakingPoolTest is Test {
    StakingPool public stakingPool;
    MockERC20 public sccGov;
    MockERC20 public sccUsd;

    address public deployer;
    address public staker1;
    address public staker2;
    address public rewardsDistributor;

    function setUp() public {
        deployer = makeAddr("deployer");
        staker1 = makeAddr("staker1");
        staker2 = makeAddr("staker2");
        rewardsDistributor = makeAddr("rewardsDistributor");

        vm.startPrank(deployer);
        sccGov = new MockERC20("SCC Governance", "SCC_GOV");
        sccUsd = new MockERC20("SCC USD", "SCC_USD");

        stakingPool = new StakingPool(address(sccGov), address(sccUsd), rewardsDistributor, deployer);
        vm.stopPrank();

        // Mint some tokens for stakers
        sccGov.mint(staker1, 1000 ether);
        sccGov.mint(staker2, 1000 ether);

        // Approve staking pool to spend stakers' tokens
        vm.startPrank(staker1);
        sccGov.approve(address(stakingPool), type(uint256).max);
        vm.stopPrank();

        vm.startPrank(staker2);
        sccGov.approve(address(stakingPool), type(uint256).max);
        vm.stopPrank();
    }

    function testDeployment() public view {
        assertEq(address(stakingPool.stakingToken()), address(sccGov));
        assertEq(address(stakingPool.rewardsToken()), address(sccUsd));
        assertEq(stakingPool.rewardsDistribution(), rewardsDistributor);
        assertEq(stakingPool.owner(), deployer);
    }

    function testStake() public {
        vm.startPrank(staker1);
        stakingPool.stake(100 ether);
        assertEq(stakingPool.staked(staker1), 100 ether);
        assertEq(sccGov.balanceOf(staker1), 900 ether);
        assertEq(sccGov.balanceOf(address(stakingPool)), 100 ether);
        vm.stopPrank();
    }

    function testUnstake() public {
        vm.startPrank(staker1);
        stakingPool.stake(100 ether);
        stakingPool.unstake(50 ether);
        assertEq(stakingPool.staked(staker1), 50 ether);
        assertEq(sccGov.balanceOf(staker1), 950 ether);
        assertEq(sccGov.balanceOf(address(stakingPool)), 50 ether);
        vm.stopPrank();
    }

    function testUnstakeInsufficientAmount() public {
        vm.startPrank(staker1);
        stakingPool.stake(100 ether);
        vm.expectRevert("Not enough staked");
        stakingPool.unstake(200 ether);
        vm.stopPrank();
    }

    function testStakeZeroAmount() public {
        vm.startPrank(staker1);
        vm.expectRevert("Cannot stake 0");
        stakingPool.stake(0);
        vm.stopPrank();
    }

    function testUnstakeZeroAmount() public {
        vm.startPrank(staker1);
        vm.expectRevert("Cannot unstake 0");
        stakingPool.unstake(0);
        vm.stopPrank();
    }

    function testNotifyRewardAmount() public {
        vm.startPrank(rewardsDistributor);
        sccUsd.mint(rewardsDistributor, 1000 ether);
        sccUsd.approve(address(stakingPool), type(uint256).max);
        uint256 reward = 100 ether;
        stakingPool.notifyRewardAmount(reward);
        uint256 expectedRewardRate = reward / 7 days;
        assertEq(stakingPool.rewardRate(), expectedRewardRate);
        assertEq(stakingPool.periodFinish(), block.timestamp + 7 days);
        assertEq(sccUsd.balanceOf(address(stakingPool)), reward);
        vm.stopPrank();
    }

    function testEarnedRewardsSingleStaker() public {
        vm.startPrank(staker1);
        stakingPool.stake(100 ether);
        vm.stopPrank();

        vm.startPrank(rewardsDistributor);
        sccUsd.mint(rewardsDistributor, 700 ether);
        sccUsd.approve(address(stakingPool), type(uint256).max);
        stakingPool.notifyRewardAmount(700 ether); // 100 ether/day
        vm.stopPrank();

        vm.warp(block.timestamp + 1 days); // Advance time by 1 day

        vm.startPrank(staker1);
        uint256 earnedAmount = stakingPool.earned(staker1);
        assertApproxEqAbs(earnedAmount, 100 ether, 1 ether); // Allow for minor precision differences
        vm.stopPrank();
    }

    function testGetRewardSingleStaker() public {
        vm.startPrank(staker1);
        stakingPool.stake(100 ether);
        vm.stopPrank();

        vm.startPrank(rewardsDistributor);
        sccUsd.mint(rewardsDistributor, 700 ether);
        sccUsd.approve(address(stakingPool), type(uint256).max);
        stakingPool.notifyRewardAmount(700 ether); // 100 ether/day
        vm.stopPrank();

        vm.warp(block.timestamp + 1 days); // Advance time by 1 day

        vm.startPrank(staker1);
        uint256 initialSccUsdBalance = sccUsd.balanceOf(staker1);
        stakingPool.getReward();
        uint256 finalSccUsdBalance = sccUsd.balanceOf(staker1);
        assertApproxEqAbs(finalSccUsdBalance - initialSccUsdBalance, 100 ether, 1 ether);
        vm.stopPrank();
    }

    function testEarnedRewardsMultipleStakers() public {
        vm.startPrank(staker1);
        stakingPool.stake(100 ether);
        vm.stopPrank();

        vm.startPrank(staker2);
        stakingPool.stake(200 ether);
        vm.stopPrank();

        vm.startPrank(rewardsDistributor);
        sccUsd.mint(rewardsDistributor, 700 ether);
        sccUsd.approve(address(stakingPool), type(uint256).max);
        stakingPool.notifyRewardAmount(700 ether); // 100 ether/day
        vm.stopPrank();

        vm.warp(block.timestamp + 1 days); // Advance time by 1 day

        uint256 totalReward = 100 ether;
        uint256 totalStaked = 300 ether;

        // Staker 1 should get 1/3 of rewards
        uint256 staker1Reward = (totalReward * 100 ether) / totalStaked;
        assertApproxEqAbs(stakingPool.earned(staker1), staker1Reward, 1 ether);

        // Staker 2 should get 2/3 of rewards
        uint256 staker2Reward = (totalReward * 200 ether) / totalStaked;
        assertApproxEqAbs(stakingPool.earned(staker2), staker2Reward, 1 ether);
    }

    function testGetRewardMultipleStakers() public {
        vm.startPrank(staker1);
        stakingPool.stake(100 ether);
        vm.stopPrank();

        vm.startPrank(staker2);
        stakingPool.stake(200 ether);
        vm.stopPrank();

        vm.startPrank(rewardsDistributor);
        sccUsd.mint(rewardsDistributor, 700 ether);
        sccUsd.approve(address(stakingPool), type(uint256).max);
        stakingPool.notifyRewardAmount(700 ether); // 100 ether/day
        vm.stopPrank();

        vm.warp(block.timestamp + 1 days); // Advance time by 1 day

        uint256 totalReward = 100 ether;
        uint256 totalStaked = 300 ether;
        uint256 staker1Reward = (totalReward * 100 ether) / totalStaked;
        uint256 staker2Reward = (totalReward * 200 ether) / totalStaked;

        vm.startPrank(staker1);
        uint256 initialSccUsdBalance1 = sccUsd.balanceOf(staker1);
        stakingPool.getReward();
        uint256 finalSccUsdBalance1 = sccUsd.balanceOf(staker1);
        assertApproxEqAbs(finalSccUsdBalance1 - initialSccUsdBalance1, staker1Reward, 1 ether);
        vm.stopPrank();

        vm.startPrank(staker2);
        uint256 initialSccUsdBalance2 = sccUsd.balanceOf(staker2);
        stakingPool.getReward();
        uint256 finalSccUsdBalance2 = sccUsd.balanceOf(staker2);
        assertApproxEqAbs(finalSccUsdBalance2 - initialSccUsdBalance2, staker2Reward, 1 ether);
        vm.stopPrank();
    }

    function testRewardPeriodExtension() public {
        vm.startPrank(staker1);
        stakingPool.stake(100 ether);
        vm.stopPrank();

        vm.startPrank(rewardsDistributor);
        sccUsd.mint(rewardsDistributor, 700 ether);
        sccUsd.approve(address(stakingPool), type(uint256).max);
        stakingPool.notifyRewardAmount(700 ether); // 100 ether/day for 7 days
        vm.stopPrank();

        vm.warp(block.timestamp + 3 days); // Advance 3 days

        vm.startPrank(rewardsDistributor);
        sccUsd.mint(rewardsDistributor, 700 ether);
        sccUsd.approve(address(stakingPool), type(uint256).max);
        stakingPool.notifyRewardAmount(700 ether); // Add another 700 ether
        vm.stopPrank();

        assertEq(stakingPool.periodFinish(), block.timestamp + 7 days);
        vm.warp(block.timestamp + 1 days); // Advance 1 more day
        vm.startPrank(staker1);
        uint256 earnedAmount = stakingPool.earned(staker1);
        assertTrue(earnedAmount > 0);
        vm.stopPrank();
    }

    function testRewardPeriodEnds() public {
        vm.startPrank(staker1);
        stakingPool.stake(100 ether);
        vm.stopPrank();

        vm.startPrank(rewardsDistributor);
        sccUsd.mint(rewardsDistributor, 700 ether);
        sccUsd.approve(address(stakingPool), type(uint256).max);
        stakingPool.notifyRewardAmount(700 ether); // 100 ether/day for 7 days
        vm.stopPrank();

        vm.warp(block.timestamp + 8 days); // Advance past period finish

        vm.startPrank(staker1);
        uint256 earnedAmount = stakingPool.earned(staker1);
        assertApproxEqAbs(earnedAmount, 700 ether, 1 ether);
        vm.stopPrank();
    }
}
