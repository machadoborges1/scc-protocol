"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vaultMonitorService = void 0;
const ethers_1 = require("ethers");
const rpc_1 = require("../rpc");
const abis_1 = require("../contracts/abis");
const config_1 = require("../config");
const logger_1 = __importDefault(require("../logger"));
class VaultMonitorService {
    constructor() {
        this.monitoredVaults = new Map();
        this.oracleManagerContract = new ethers_1.ethers.Contract(config_1.config.ORACLE_MANAGER_ADDRESS, abis_1.OracleManagerInterface, rpc_1.keeperWallet);
    }
    async monitorVaults(vaults) {
        logger_1.default.info(`Monitoring ${vaults.length} vaults...`);
        const updatedMonitoredVaults = [];
        // Batch fetching vault data and oracle prices
        // Note: ethers.js does not have a built-in multicall utility. We would typically use a library like @makerdao/multicall
        // or implement a basic one. For this example, we'll simulate individual calls but acknowledge the optimization.
        // In a real-world scenario, a multicall contract would be deployed and used here.
        for (const vaultInfo of vaults) {
            const vaultContract = new ethers_1.ethers.Contract(vaultInfo.address, abis_1.VaultInterface, rpc_1.provider);
            // Fetch collateralToken and debtToken from the Vault contract
            const collateralToken = await (0, rpc_1.retry)(() => vaultContract.collateralToken());
            const debtToken = await (0, rpc_1.retry)(() => vaultContract.sccUsdToken());
            const collateralAmount = await (0, rpc_1.retry)(() => vaultContract.collateralAmount());
            const debtAmount = await (0, rpc_1.retry)(() => vaultContract.debtAmount());
            const collateralPrice = await (0, rpc_1.retry)(() => this.oracleManagerContract.getPrice(collateralToken));
            // Calculate Collateralization Ratio
            let collateralizationRatio;
            if (debtAmount > 0n) {
                // To maintain precision, multiply by a scaling factor before dividing.
                const scale = 10000n; // Using 10000 for 2 decimal places of precision (e.g., 150.25%)
                const numerator = BigInt(collateralAmount) * BigInt(collateralPrice) * scale;
                const denominator = BigInt(debtAmount);
                const ratio = numerator / denominator;
                collateralizationRatio = Number(ratio) / 100;
            }
            else {
                // If debt is zero, collateralization is infinite (healthy).
                collateralizationRatio = Number.POSITIVE_INFINITY;
            }
            const monitoredVault = {
                ...vaultInfo,
                collateralToken,
                debtToken,
                collateralAmount,
                debtAmount,
                collateralPrice,
                collateralizationRatio,
            };
            this.monitoredVaults.set(vaultInfo.address, monitoredVault);
            updatedMonitoredVaults.push(monitoredVault);
            logger_1.default.debug(`Vault ${vaultInfo.address}: CR = ${collateralizationRatio.toFixed(2)}%`);
        }
        logger_1.default.info(`Finished monitoring ${updatedMonitoredVaults.length} vaults.`);
        return updatedMonitoredVaults;
    }
    getMonitoredVaults() {
        return Array.from(this.monitoredVaults.values());
    }
}
exports.vaultMonitorService = new VaultMonitorService();
