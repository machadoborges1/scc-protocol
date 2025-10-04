import { ethers } from 'ethers'; // Import ethers
import logger from './logger';
import { createProvider, createKeeperWallet } from './rpc';
import { createContracts } from './contracts';
import { VaultDiscoveryService } from './services/vaultDiscovery';
import { VaultMonitorService } from './services/vaultMonitor';
import { LiquidationAgentService } from './services/liquidationAgent';

/**
 * Executes one cycle of the bot's core logic.
 * It discovers vaults, monitors them, and liquidates unhealthy ones.
 * @param services A collection of services required for the bot's operation.
 */
export async function runOnce(services: { discovery: VaultDiscoveryService, monitor: VaultMonitorService, agent: LiquidationAgentService }) {
  try {
    const discoveredVaults = services.discovery.getVaults();
    if (discoveredVaults.length > 0) {
      logger.info(`Bot loop: Monitoring ${discoveredVaults.length} vaults.`);
      const monitoredVaults = await services.monitor.monitorVaults(discoveredVaults);
      await services.agent.liquidateUnhealthyVaults(monitoredVaults);
    }
  } catch (e) {
    logger.error(e, 'Error in main loop');
  }
}

/**
 * The main entry point for the keeper bot.
 * Initializes services, starts the main loop, and handles graceful shutdown.
 */
async function main() {
  logger.info('SCC Keeper Bot starting...');

  let isRunning = false;
  let isShuttingDown = false;

  // This function contains the core logic of the bot's loop
  const runOnceWrapper = async (services: { discovery: VaultDiscoveryService, monitor: VaultMonitorService, agent: LiquidationAgentService }) => {
    if (isShuttingDown) return;
    isRunning = true;
    try {
      await runOnce(services);
    } catch (e) {
      logger.error(e, 'Error in main loop wrapper');
    } finally {
      isRunning = false;
    }
  };

  // 1. Composition Root: Set up providers, wallets, and contract instances.
  const provider = createProvider();
  const keeperWallet = createKeeperWallet(provider);
  const contracts = createContracts(provider, keeperWallet);

  // 2. Instantiate services
  const services = {
    discovery: new VaultDiscoveryService(contracts.vaultFactoryContract, provider),
    monitor: new VaultMonitorService(contracts.oracleManagerContract, contracts.getVaultContract),
    agent: new LiquidationAgentService(contracts.liquidationManagerContract_RW, logger),
  };

  logger.info(`Keeper address: ${keeperWallet.address}`);

  // 3. Start discovery and main loop
  await services.discovery.start();
  const mainLoop = setInterval(() => runOnceWrapper(services), 15000);
  runOnceWrapper(services);

  // 4. Graceful Shutdown Handler
  const gracefulShutdown = async (signal: string) => {
    logger.warn(`Received ${signal}. Shutting down gracefully...`);
    if (isShuttingDown) return;
    isShuttingDown = true;
    clearInterval(mainLoop);

    while (isRunning) {
      logger.info('Waiting for current bot loop to finish...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    services.discovery.stop();
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
