// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
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

// Mocks
import {MockERC20} from "../src/mocks/MockERC20.sol";
import {MockV3Aggregator} from "../src/mocks/MockV3Aggregator.sol";

contract Deploy is Script {
    // Constants for mock price feed
    uint8 private constant MOCK_PRICE_FEED_DECIMALS = 8;
    int256 private constant MOCK_INITIAL_PRICE = 2000 * 1e8; // $2000

    function run() external {
        vm.startBroadcast();

        // 1. Deploy Mocks
        console.log("Deploying Mocks...");
        // Constructor for MockERC20 takes (name, symbol)
        MockERC20 weth = new MockERC20("Wrapped Ether", "WETH");
        MockV3Aggregator wethPriceFeed = new MockV3Aggregator(
            MOCK_PRICE_FEED_DECIMALS,
            MOCK_INITIAL_PRICE
        );

        // 2. Deploy Core Protocol Contracts
        console.log("Deploying Core Contracts...");
        // Constructor for SCC_USD takes an initialOwner address
        SCC_USD sccUSD = new SCC_USD(msg.sender);
        // Constructor for OracleManager takes a stale price timeout
        uint256 twentyFourHours = 24 * 60 * 60;
        OracleManager oracleManager = new OracleManager(twentyFourHours);

        VaultFactory vaultFactory = new VaultFactory(
            msg.sender,
            address(weth),
            address(sccUSD),
            address(oracleManager)
        );
        LiquidationManager liquidationManager = new LiquidationManager(
            msg.sender,
            address(oracleManager),
            address(sccUSD)
        );

        // 3. Deploy Governance & Staking Contracts
        console.log("Deploying Governance & Staking...");
        uint256 initialGovSupply = 1_000_000 * 1e18;
        SCC_GOV sccGOV = new SCC_GOV(msg.sender, initialGovSupply);

        TimelockController timelock = new TimelockController(1 days, new address[](0), new address[](0), msg.sender);

        SCC_Governor governor = new SCC_Governor(sccGOV, timelock);

        StakingPool stakingPool = new StakingPool(address(sccGOV), address(sccUSD), msg.sender, msg.sender);

        // 4. Configure Contracts & Transfer Ownership
        console.log("Configuring Contracts & Transferring Ownership...");
        // Set the price feed for WETH in the OracleManager
        oracleManager.setPriceFeed(address(weth), address(wethPriceFeed));

        // Authorize the VaultFactory and LiquidationManager to use the OracleManager
        oracleManager.setAuthorization(address(vaultFactory), true);
        oracleManager.setAuthorization(address(liquidationManager), true);

        // Setup Governance Roles
        bytes32 proposerRole = timelock.PROPOSER_ROLE();
        bytes32 executorRole = timelock.EXECUTOR_ROLE();
        bytes32 adminRole = keccak256("TIMELOCK_ADMIN_ROLE");

        timelock.grantRole(proposerRole, address(governor));
        timelock.grantRole(executorRole, address(0)); // address(0) means anyone can execute a passed proposal

        // Revoke deployer's admin role and transfer to Timelock itself
        timelock.revokeRole(adminRole, msg.sender);

        // Transfer ownership of core contracts to Timelock
        vaultFactory.transferOwnership(address(timelock));
        oracleManager.transferOwnership(address(timelock));
        liquidationManager.transferOwnership(address(timelock));
        stakingPool.transferOwnership(address(timelock));
        // The owner of SCC_USD should also be the Timelock to manage future minting permissions
        sccUSD.transferOwnership(address(timelock));

        vm.stopBroadcast();

        // 5. Log Deployed Addresses
        console.log("\n---");
        console.log("Deployment Complete!");
        console.log("\n--- Contract Addresses ---");
        console.log("WETH (Mock Collateral):", address(weth));
        console.log("WETH/USD Price Feed (Mock):", address(wethPriceFeed));
        console.log("SCC_USD:", address(sccUSD));
        console.log("SCC_GOV:", address(sccGOV));
        console.log("OracleManager:", address(oracleManager));
        console.log("VaultFactory:", address(vaultFactory));
        console.log("LiquidationManager:", address(liquidationManager));
        console.log("StakingPool:", address(stakingPool));
        console.log("TimelockController:", address(timelock));
        console.log("SCC_Governor:", address(governor));
        console.log("\n");
    }
}
