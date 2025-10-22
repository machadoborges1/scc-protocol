// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {console} from "forge-std/console.sol";

// Core Contracts
import {VaultFactory} from "../src/VaultFactory.sol";
import {LiquidationManager} from "../src/LiquidationManager.sol";
import {OracleManager} from "../src/OracleManager.sol";
import {SCC_USD} from "../src/tokens/SCC_USD.sol";
import {SCC_GOV} from "../src/tokens/SCC_GOV.sol";
import {StakingPool} from "../src/StakingPool.sol";
import {SCC_Governor} from "../src/SCC_Governor.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {Vault} from "../src/Vault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Mocks
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockV3Aggregator} from "../src/mocks/MockV3Aggregator.sol";

contract FeeLifecycleTest is Test {
    // --- Actors ---
    address public deployer = makeAddr("deployer");
    address public vaultOwner = makeAddr("vaultOwner");
    address public liquidator = makeAddr("liquidator");
    address public staker = makeAddr("staker");

    // --- Contracts ---
    MockERC20 public weth;
    MockV3Aggregator public mockPriceFeed;
    SCC_USD public sccUSD;
    SCC_GOV public sccGOV;
    OracleManager public oracleManager;
    LiquidationManager public liquidationManager;
    VaultFactory public vaultFactory;
    StakingPool public stakingPool;
    TimelockController public timelock;
    SCC_Governor public governor;

    // --- Setup ---
    function setUp() public {
        // Use the deployer address for all initial deployments
        vm.startPrank(deployer);

        // 1. Deploy Mocks
        weth = new MockERC20("Wrapped Ether", "WETH");
        mockPriceFeed = new MockV3Aggregator(18, 2000 * 1e18); // $2000

        // 2. Deploy Core Protocol Contracts
        sccUSD = new SCC_USD(deployer);
        oracleManager = new OracleManager(24 hours);
        liquidationManager = new LiquidationManager(deployer, address(oracleManager), address(sccUSD));
        vaultFactory = new VaultFactory(
            deployer,
            address(weth),
            address(sccUSD),
            address(oracleManager),
            address(liquidationManager)
        );

        // 3. Deploy Governance & Staking Contracts
        sccGOV = new SCC_GOV(deployer, 1_000_000 * 1e18);
        timelock = new TimelockController(1 days, new address[](0), new address[](0), deployer);
        governor = new SCC_Governor(sccGOV, timelock);
        // Staking pool owner and rewards distribution are initially the deployer
        stakingPool = new StakingPool(address(sccGOV), address(sccUSD), deployer, deployer);

        // 4. Configure Contracts & Transfer Ownership
        oracleManager.setPriceFeed(address(weth), address(mockPriceFeed));
        oracleManager.setAuthorization(address(liquidationManager), true);
        oracleManager.grantRole(oracleManager.AUTHORIZER_ROLE(), address(vaultFactory));
        sccUSD.grantRole(sccUSD.MINTER_GRANTER_ROLE(), address(vaultFactory));

        bytes32 proposerRole = timelock.PROPOSER_ROLE();
        bytes32 executorRole = timelock.EXECUTOR_ROLE();
        bytes32 adminRole = timelock.DEFAULT_ADMIN_ROLE();
        timelock.grantRole(proposerRole, address(governor));
        timelock.grantRole(executorRole, address(0)); // Anyone can execute
        timelock.revokeRole(adminRole, deployer);

        // Set rewards distribution to be the Timelock BEFORE transferring ownership
        stakingPool.setRewardsDistribution(address(timelock));

        // Transfer ownership to Timelock
        vaultFactory.transferOwnership(address(timelock));
        liquidationManager.transferOwnership(address(timelock));
        stakingPool.transferOwnership(address(timelock));
        oracleManager.grantRole(oracleManager.DEFAULT_ADMIN_ROLE(), address(timelock));
        oracleManager.renounceRole(oracleManager.DEFAULT_ADMIN_ROLE(), deployer);
        sccUSD.grantRole(sccUSD.DEFAULT_ADMIN_ROLE(), address(timelock));
        sccUSD.renounceRole(sccUSD.DEFAULT_ADMIN_ROLE(), deployer);
        sccUSD.renounceRole(sccUSD.MINTER_GRANTER_ROLE(), deployer);



        vm.stopPrank();
    }

    function test_FullFeeLifecycle() public {
        // ###################################################################
        // 1. SETUP: Fund actors and prepare the environment
        // ###################################################################
        vm.startPrank(deployer);
        weth.mint(vaultOwner, 10 ether);
        sccUSD.mint(liquidator, 2000 ether);
        sccGOV.transfer(staker, 100_000 ether);
        sccGOV.transfer(deployer, 200_000 ether); // For voting
        vm.stopPrank();

        // ###################################################################
        // 2. VAULT CREATION: vaultOwner creates a vault and takes on debt
        // ###################################################################
        vm.startPrank(vaultOwner);
        address vaultAddress = vaultFactory.createNewVault();
        Vault vault = Vault(vaultAddress);
        weth.approve(vaultAddress, 2 ether); // $4000 collateral
        vault.depositCollateral(2 ether);
        vault.mint(2000 ether); // 200% CR
        vm.stopPrank();

        // ###################################################################
        // 3. LIQUIDATION: Price drops, and liquidator buys the collateral
        // ###################################################################
        // Price drops to $1400, making vault CR 140% (< 150%)
        vm.startPrank(deployer);
        mockPriceFeed.updateAnswer(1400 * 1e18);
        vm.stopPrank();

        liquidationManager.startAuction(vaultAddress);
        uint256 auctionId = liquidationManager.vaultToAuctionId(vaultAddress);

        vm.startPrank(liquidator);
        sccUSD.approve(address(liquidationManager), 2000 ether);
        // Liquidator buys all the collateral
        uint256 collateralToBuy = vault.collateralAmount();
        liquidationManager.buy(auctionId, collateralToBuy);
        vm.stopPrank();

        uint256 feesCollected = sccUSD.balanceOf(address(liquidationManager));
        assertTrue(feesCollected > 0, "Fees should have been collected in LiquidationManager");

        // ###################################################################
        // 4. GOVERNANCE: Propose, vote, and execute fee transfer
        // ###################################################################
        vm.startPrank(deployer);
        sccGOV.delegate(deployer);
        vm.stopPrank();

        address[] memory targets = new address[](3);
        targets[0] = address(liquidationManager);
        targets[1] = address(sccUSD);
        targets[2] = address(stakingPool);

        uint256[] memory values = new uint256[](3);
        values[0] = 0;
        values[1] = 0;
        values[2] = 0;

        bytes[] memory calldatas = new bytes[](3);
        // 1. Withdraw fees from LiquidationManager to Timelock
        calldatas[0] = abi.encodeWithSignature("withdrawFees(address,uint256)", address(timelock), feesCollected);
        // 2. Timelock approves StakingPool to spend SCC_USD
        calldatas[1] = abi.encodeWithSignature("approve(address,uint256)", address(stakingPool), feesCollected);
        // 3. StakingPool notifies reward amount (pulls from Timelock)
        calldatas[2] = abi.encodeWithSignature("notifyRewardAmount(uint256,uint256)", feesCollected, 7 days);

        string memory description = "Proposal to transfer liquidation fees to StakingPool and start distribution";

        vm.startPrank(deployer);
        uint256 proposalId = governor.propose(targets, values, calldatas, description);

        // Vote
        vm.roll(block.number + governor.votingDelay() + 1);
        governor.castVote(proposalId, 1); // 1 = For

        // Queue
        vm.roll(block.number + governor.votingPeriod() + 1);
        governor.queue(targets, values, calldatas, keccak256(bytes(description)));

        // Execute
        vm.warp(block.timestamp + timelock.getMinDelay() + 1);
        governor.execute(targets, values, calldatas, keccak256(bytes(description)));
        vm.stopPrank();

        assertEq(sccUSD.balanceOf(address(liquidationManager)), 0, "LiquidationManager should have no fees left");
        assertTrue(stakingPool.rewardRate() > 0, "StakingPool reward rate should be updated");

        // ###################################################################
        // 5. STAKING & CLAIM: Staker stakes GOV and claims rewards
        // ###################################################################
        vm.startPrank(staker);
        sccGOV.approve(address(stakingPool), 100_000 ether);
        stakingPool.stake(100_000 ether);
        vm.stopPrank();

        // Move time forward to accrue rewards
        vm.warp(block.timestamp + 3.5 days);

        uint256 earnedRewards = stakingPool.earned(staker);
        assertTrue(earnedRewards > 0, "Staker should have earned rewards");

        uint256 initialBalance = sccUSD.balanceOf(staker);
        vm.startPrank(staker);
        stakingPool.getReward();
        vm.stopPrank();

        uint256 finalBalance = sccUSD.balanceOf(staker);
        assertTrue(finalBalance > initialBalance, "Staker SCC_USD balance should increase after claiming rewards");
    }
}
