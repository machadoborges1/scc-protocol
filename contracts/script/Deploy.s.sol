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
    // --- Network Specific Addresses ---
    // Sepolia Testnet
    address private constant SEPOLIA_WETH_USD_PRICE_FEED = 0x694AA1769357215DE4FAC081bf1f309aDC325306;
    address private constant SEPOLIA_WETH = 0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9;

    // --- Config Struct ---
    struct Config {
        address wethAddress;
        address wethPriceFeedAddress;
    }

    function getNetworkConfig() internal view returns (Config memory) {
        uint256 chainId = block.chainid;
        if (chainId == 11155111) { // Sepolia
            return Config({
                wethAddress: SEPOLIA_WETH,
                wethPriceFeedAddress: SEPOLIA_WETH_USD_PRICE_FEED
            });
        } else { // Return empty for local, will be handled in run()
            return Config({
                wethAddress: address(0),
                wethPriceFeedAddress: address(0)
            });
        }
    }

    function run() external {
        Config memory config = getNetworkConfig();

        vm.startBroadcast();

        // For local networks, deploy mocks inside the broadcast
        if (block.chainid != 11155111) {
            console.log("Deploying Mocks for local network...");
            MockERC20 mockWeth = new MockERC20("Wrapped Ether", "WETH");
            MockV3Aggregator mockPriceFeed = new MockV3Aggregator(8, 2000 * 1e8); // $2000
            config.wethAddress = address(mockWeth);
            config.wethPriceFeedAddress = address(mockPriceFeed);
        }

        // 1. Deploy Core Protocol Contracts
        console.log("Deploying Core Contracts...");
        SCC_USD sccUSD = new SCC_USD(msg.sender);
        OracleManager oracleManager = new OracleManager(24 hours);
        LiquidationManager liquidationManager = new LiquidationManager(msg.sender, address(oracleManager), address(sccUSD));
        VaultFactory vaultFactory = new VaultFactory(
            msg.sender,
            config.wethAddress,
            address(sccUSD),
            address(oracleManager),
            address(liquidationManager)
        );
        console.log("VaultFactory deployed at block:", block.number);

        // 2. Deploy Governance & Staking Contracts
        console.log("Deploying Governance & Staking...");
        SCC_GOV sccGOV = new SCC_GOV(msg.sender, 1_000_000 * 1e18);
        TimelockController timelock = new TimelockController(1 days, new address[](0), new address[](0), msg.sender);
        SCC_Governor governor = new SCC_Governor(sccGOV, timelock);
        StakingPool stakingPool = new StakingPool(address(sccGOV), address(sccUSD), msg.sender, msg.sender);

        // 3. Configure Contracts & Transfer Ownership
        console.log("Configuring Contracts & Transferring Ownership...");
        oracleManager.setPriceFeed(config.wethAddress, config.wethPriceFeedAddress);
        oracleManager.setAuthorization(address(liquidationManager), true);
        oracleManager.grantRole(oracleManager.AUTHORIZER_ROLE(), address(vaultFactory));
        sccUSD.grantRole(sccUSD.MINTER_GRANTER_ROLE(), address(vaultFactory));

        bytes32 proposerRole = timelock.PROPOSER_ROLE();
        bytes32 executorRole = timelock.EXECUTOR_ROLE();
        bytes32 adminRole = timelock.DEFAULT_ADMIN_ROLE();
        timelock.grantRole(proposerRole, address(governor));
        timelock.grantRole(executorRole, address(0));
        timelock.revokeRole(adminRole, msg.sender);

        vaultFactory.transferOwnership(address(timelock));
        liquidationManager.transferOwnership(address(timelock));
        stakingPool.transferOwnership(address(timelock));

        oracleManager.grantRole(oracleManager.DEFAULT_ADMIN_ROLE(), address(timelock));
        oracleManager.renounceRole(oracleManager.DEFAULT_ADMIN_ROLE(), msg.sender);
        sccUSD.grantRole(sccUSD.DEFAULT_ADMIN_ROLE(), address(timelock));
        sccUSD.renounceRole(sccUSD.DEFAULT_ADMIN_ROLE(), msg.sender);
        sccUSD.renounceRole(sccUSD.MINTER_GRANTER_ROLE(), msg.sender);

        // 4. Create a test Vault for immediate use on local network
        if (block.chainid == 31337) {
            console.log("\n--- Creating a Test Vault ---");
            address testVaultAddress = vaultFactory.createNewVault();
            console.log("Test Vault Address:", testVaultAddress);
        }

        vm.stopBroadcast();

        // 5. Log Deployed Addresses
        console.log("\n---");
        console.log("Deployment Complete!");
        console.log("\n--- Contract Addresses ---");
        console.log("WETH (Collateral):", config.wethAddress);
        console.log("WETH/USD Price Feed:", config.wethPriceFeedAddress);
        console.log("SCC_USD:", address(sccUSD));
        console.log("SCC_GOV:", address(sccGOV));
        console.log("OracleManager:", address(oracleManager));
        console.log("VaultFactory:", address(vaultFactory));
        console.log("LiquidationManager:", address(liquidationManager));
        console.log("StakingPool:", address(stakingPool));
        console.log("TimelockController:", address(timelock));
        console.log("SCC_Governor:", address(governor));
    }
}