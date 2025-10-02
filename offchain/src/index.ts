import logger from './logger';
import { provider, keeperWallet, getGasPrice } from './rpc';
import { config } from './config';
import { vaultDiscoveryService } from './services/vaultDiscovery';
import { vaultMonitorService } from './services/vaultMonitor';
import { liquidationAgentService } from './services/liquidationAgent';

logger.info('Keeper Bot starting...');

async function main() {
  logger.info(`Connected to RPC: ${config.RPC_URL}`);
  logger.info(`Keeper address: ${keeperWallet.address}`);

  await vaultDiscoveryService.start();

  // Main bot loop
  setInterval(async () => {
    logger.info('Bot loop executed...');
    const discoveredVaults = vaultDiscoveryService.getVaults();
    logger.info(`Monitoring ${discoveredVaults.length} vaults.`);

    if (discoveredVaults.length > 0) {
      const monitoredVaults = await vaultMonitorService.monitorVaults(discoveredVaults);
      // Now 'monitoredVaults' contains the updated state and CR for each vault
      // This data can be passed to the liquidation agent
      logger.debug(`Monitored vaults: ${JSON.stringify(monitoredVaults.map(v => ({ address: v.address, cr: v.collateralizationRatio })))}`);

      await liquidationAgentService.liquidateUnhealthyVaults(monitoredVaults);
    }

    // Example of fetching gas price
    try {
      const gasPrice = await getGasPrice();
      logger.debug(`Current gas price: ${gasPrice.toString()}`);
    } catch (error) {
      logger.error(error, 'Failed to fetch gas price');
    }

  }, 15000); // Run every 15 seconds
}

main().catch((error) => {
  logger.error(error, 'Unhandled error in main function');
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  // Add any cleanup logic here
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  // Add any cleanup logic here
  process.exit(0);
});
