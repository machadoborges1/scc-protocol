"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVaultContract_RW = exports.getVaultContract = exports.liquidationManagerContract_RW = exports.vaultFactoryContract_RW = exports.sccGovernorContract = exports.timelockControllerContract = exports.stakingPoolContract = exports.sccGovContract = exports.sccUsdContract = exports.oracleManagerContract = exports.liquidationManagerContract = exports.vaultFactoryContract = void 0;
const ethers_1 = require("ethers");
const config_1 = require("../config");
const rpc_1 = require("../rpc");
const abis_1 = require("./abis");
// Read-only contract instances (connected to provider)
exports.vaultFactoryContract = new ethers_1.ethers.Contract(config_1.config.VAULT_FACTORY_ADDRESS, abis_1.VaultFactoryInterface, rpc_1.provider);
exports.liquidationManagerContract = new ethers_1.ethers.Contract(config_1.config.LIQUIDATION_MANAGER_ADDRESS, abis_1.LiquidationManagerInterface, rpc_1.provider);
exports.oracleManagerContract = new ethers_1.ethers.Contract(config_1.config.ORACLE_MANAGER_ADDRESS, abis_1.OracleManagerInterface, rpc_1.provider);
exports.sccUsdContract = new ethers_1.ethers.Contract(config_1.config.SCC_USD_ADDRESS, abis_1.SCC_USD_Interface, rpc_1.provider);
exports.sccGovContract = new ethers_1.ethers.Contract(config_1.config.SCC_GOV_ADDRESS, abis_1.SCC_GOV_Interface, rpc_1.provider);
exports.stakingPoolContract = new ethers_1.ethers.Contract(config_1.config.STAKING_POOL_ADDRESS, abis_1.StakingPoolInterface, rpc_1.provider);
exports.timelockControllerContract = new ethers_1.ethers.Contract(config_1.config.TIMELOCK_CONTROLLER_ADDRESS, abis_1.TimelockControllerInterface, rpc_1.provider);
exports.sccGovernorContract = new ethers_1.ethers.Contract(config_1.config.SCC_GOVERNOR_ADDRESS, abis_1.SCC_GovernorInterface, rpc_1.provider);
// Writable contract instances (connected to keeperWallet)
exports.vaultFactoryContract_RW = new ethers_1.ethers.Contract(config_1.config.VAULT_FACTORY_ADDRESS, abis_1.VaultFactoryInterface, rpc_1.keeperWallet);
exports.liquidationManagerContract_RW = new ethers_1.ethers.Contract(config_1.config.LIQUIDATION_MANAGER_ADDRESS, abis_1.LiquidationManagerInterface, rpc_1.keeperWallet);
// Function to get a Vault contract instance dynamically
const getVaultContract = (address) => {
    return new ethers_1.ethers.Contract(address, abis_1.VaultInterface, rpc_1.provider);
};
exports.getVaultContract = getVaultContract;
const getVaultContract_RW = (address) => {
    return new ethers_1.ethers.Contract(address, abis_1.VaultInterface, rpc_1.keeperWallet);
};
exports.getVaultContract_RW = getVaultContract_RW;
