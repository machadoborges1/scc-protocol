"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.liquidationAgentService = void 0;
const ethers_1 = require("ethers");
const rpc_1 = require("../rpc");
const abis_1 = require("../contracts/abis");
const config_1 = require("../config");
const logger_1 = __importDefault(require("../logger"));
const MIN_COLLATERALIZATION_RATIO = 150; // Example: 150% CR
class LiquidationAgentService {
    constructor() {
        this.liquidationManagerContract = new ethers_1.ethers.Contract(config_1.config.LIQUIDATION_MANAGER_ADDRESS, abis_1.LiquidationManagerInterface, rpc_1.keeperWallet // Signer for sending transactions
        );
    }
    async liquidateUnhealthyVaults(vaults) {
        logger_1.default.info(`Checking ${vaults.length} vaults for liquidation opportunities...`);
        for (const vault of vaults) {
            if (vault.collateralizationRatio < MIN_COLLATERALIZATION_RATIO) {
                logger_1.default.warn(`Vault ${vault.address} is unhealthy! CR: ${vault.collateralizationRatio.toFixed(2)}%`);
                await this.initiateLiquidation(vault);
            }
            else {
                logger_1.default.debug(`Vault ${vault.address} is healthy. CR: ${vault.collateralizationRatio.toFixed(2)}%`);
            }
        }
    }
    async initiateLiquidation(vault) {
        logger_1.default.info(`Initiating liquidation for vault ${vault.address}...`);
        try {
            const gasPrice = await (0, rpc_1.getGasPrice)();
            // Simulate the transaction first (Milestone 4.5)
            // Note: ethers.js doesn't have a direct simulate function like viem.simulateContract.
            // A common approach is to use callStatic or estimateGas to check for reverts.
            // For a more robust simulation, a local fork or a dedicated simulation service would be used.
            await (0, rpc_1.retry)(async () => {
                await this.liquidationManagerContract.startAuction.staticCall(vault.address, { gasPrice });
            });
            logger_1.default.info(`Liquidation simulation for vault ${vault.address} successful.`);
            // Send the transaction (Milestone 4.2, 4.3, 4.6)
            const tx = await (0, rpc_1.retry)(async () => {
                return this.liquidationManagerContract.startAuction(vault.address, { gasPrice });
            });
            logger_1.default.info(`Liquidation transaction sent for vault ${vault.address}. Tx hash: ${tx.hash}`);
            // Wait for the transaction to be mined (Milestone 4.8)
            const receipt = await (0, rpc_1.retry)(() => tx.wait());
            logger_1.default.info(`Liquidation transaction for vault ${vault.address} confirmed in block ${receipt?.blockNumber}.`);
        }
        catch (error) {
            logger_1.default.error(error, `Failed to liquidate vault ${vault.address}`);
        }
    }
}
exports.liquidationAgentService = new LiquidationAgentService();
