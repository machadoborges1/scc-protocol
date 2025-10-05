import { ethers } from 'ethers'; // Import ethers
import logger from './logger';
import { createProvider, createKeeperWallet } from './rpc';
import { createContracts } from './contracts';
import { VaultDiscoveryService } from './services/vaultDiscovery';
import { VaultMonitorService } from './services/vaultMonitor';
import { LiquidationAgentService } from './services/liquidationAgent';

/**
 * The main entry point for the keeper bot.
 * Initializes services, starts the main loop, and handles graceful shutdown.
 */
async function main() {
  logger.info('SCC Keeper Bot starting...');

  let isShuttingDown = false;

  // 1. Composition Root: Set up providers, wallets, and contract instances.
  const provider = createProvider();
  const keeperWallet = createKeeperWallet(provider);
  const contracts = createContracts(provider, keeperWallet);

  // 2. Instantiate services
  const services = {
    discovery: new VaultDiscoveryService(contracts.vaultFactoryContract, provider, logger),
    monitor: new VaultMonitorService(contracts.oracleManagerContract, contracts.getVaultContract, services.agent, logger),
    agent: new LiquidationAgentService(contracts.liquidationManagerContract_RW, logger),
  };

  logger.info(`Keeper address: ${keeperWallet.address}`);

  // 3. Start discovery and monitoring services
  await services.discovery.start(); // VaultDiscoveryService starts listening and pushing to queue
  services.monitor.start(); // VaultMonitorService starts pulling from queue

  // 4. Graceful Shutdown Handler
  const gracefulShutdown = async (signal: string) => {
    logger.warn(`Received ${signal}. Shutting down gracefully...`);
    if (isShuttingDown) return;
    isShuttingDown = true;

    services.discovery.stop();
    services.monitor.stop();
    logger.info('Bot shutdown complete.');
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

// Start the bot if this file is run directly
if (require.main === module) {
  main().catch((e) => { logger.error(e, 'Unhandled error'); process.exit(1); });
}
