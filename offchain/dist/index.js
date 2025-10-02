"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("./logger"));
const rpc_1 = require("./rpc");
const config_1 = require("./config");
const vaultDiscovery_1 = require("./services/vaultDiscovery");
const vaultMonitor_1 = require("./services/vaultMonitor");
const liquidationAgent_1 = require("./services/liquidationAgent");
logger_1.default.info('Keeper Bot starting...');
async function main() {
    logger_1.default.info(`Connected to RPC: ${config_1.config.RPC_URL}`);
    logger_1.default.info(`Keeper address: ${rpc_1.keeperWallet.address}`);
    await vaultDiscovery_1.vaultDiscoveryService.start();
    // Main bot loop
    setInterval(async () => {
        logger_1.default.info('Bot loop executed...');
        const discoveredVaults = vaultDiscovery_1.vaultDiscoveryService.getVaults();
        logger_1.default.info(`Monitoring ${discoveredVaults.length} vaults.`);
        if (discoveredVaults.length > 0) {
            const monitoredVaults = await vaultMonitor_1.vaultMonitorService.monitorVaults(discoveredVaults);
            // Now 'monitoredVaults' contains the updated state and CR for each vault
            // This data can be passed to the liquidation agent
            logger_1.default.debug(`Monitored vaults: ${JSON.stringify(monitoredVaults.map(v => ({ address: v.address, cr: v.collateralizationRatio })))}`);
            await liquidationAgent_1.liquidationAgentService.liquidateUnhealthyVaults(monitoredVaults);
        }
        // Example of fetching gas price
        try {
            const gasPrice = await (0, rpc_1.getGasPrice)();
            logger_1.default.debug(`Current gas price: ${gasPrice.toString()}`);
        }
        catch (error) {
            logger_1.default.error(error, 'Failed to fetch gas price');
        }
    }, 15000); // Run every 15 seconds
}
main().catch((error) => {
    logger_1.default.error(error, 'Unhandled error in main function');
    process.exit(1);
});
// Handle graceful shutdown
process.on('SIGINT', async () => {
    logger_1.default.info('SIGINT received, shutting down gracefully...');
    // Add any cleanup logic here
    process.exit(0);
});
process.on('SIGTERM', async () => {
    logger_1.default.info('SIGTERM received, shutting down gracefully...');
    // Add any cleanup logic here
    process.exit(0);
});
