// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {StakingPool} from "../src/StakingPool.sol";
import {MockERC20} from "../src/mocks/MockERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract StakingPoolGovernanceTest is Test {
    StakingPool public stakingPool;
    MockERC20 public sccGov;
    MockERC20 public sccUsd;

    address public deployer;
    address public newOwner;
    address public rewardsDistributor;
    address public mockTimelockController;

    function setUp() public {
        deployer = makeAddr("deployer");
        newOwner = makeAddr("newOwner"); // This will represent the TimelockController in tests
        rewardsDistributor = makeAddr("rewardsDistributor");
        mockTimelockController = makeAddr("mockTimelockController");

        vm.startPrank(deployer);
        sccGov = new MockERC20("SCC Governance", "SCC_GOV");
        sccUsd = new MockERC20("SCC USD", "SCC_USD");

        stakingPool = new StakingPool(
            address(sccGov),
            address(sccUsd),
            rewardsDistributor,
            deployer
        );
        vm.stopPrank();
    }

    function testOwnerCanSetRewardsDistribution() public {
        vm.startPrank(deployer);
        stakingPool.setRewardsDistribution(newOwner);
        assertEq(stakingPool.rewardsDistribution(), newOwner);
        vm.stopPrank();
    }

    function testNonOwnerCannotSetRewardsDistribution() public {
        vm.startPrank(newOwner);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, newOwner));
        stakingPool.setRewardsDistribution(address(0));
        vm.stopPrank();
    }

    function testTransferOwnership() public {
        vm.startPrank(deployer);
        stakingPool.transferOwnership(mockTimelockController);
        assertEq(stakingPool.owner(), mockTimelockController);
        vm.stopPrank();
    }

    function testNewOwnerCanSetRewardsDistributionAfterTransfer() public {
        vm.startPrank(deployer);
        stakingPool.transferOwnership(mockTimelockController);
        vm.stopPrank();

        vm.startPrank(mockTimelockController);
        stakingPool.setRewardsDistribution(newOwner);
        assertEq(stakingPool.rewardsDistribution(), newOwner);
        vm.stopPrank();
    }

    function testOldOwnerCannotSetRewardsDistributionAfterTransfer() public {
        vm.startPrank(deployer);
        stakingPool.transferOwnership(mockTimelockController);
        vm.stopPrank();

        vm.startPrank(deployer);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, deployer));
        stakingPool.setRewardsDistribution(address(0));
        vm.stopPrank();
    }
}
