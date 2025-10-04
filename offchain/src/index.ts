import { ethers } from 'ethers'; // Import ethers
import logger from './logger';
import { createProvider, createKeeperWallet } from './rpc';
import { createContracts } from './contracts';
import { VaultDiscoveryService } from './services/vaultDiscovery';
import { VaultMonitorService } from './services/vaultMonitor';
import { LiquidationAgentService } from './services/liquidationAgent';

// This function contains the core logic of the bot's loop
export async function runOnce(services: { discovery: VaultDiscoveryService, monitor: VaultMonitorService, agent: LiquidationAgentService }, botSigner: ethers.Wallet) {
  try {
    const discoveredVaults = services.discovery.getVaults();
    if (discoveredVaults.length > 0) {
      logger.info(`Bot loop: Monitoring ${discoveredVaults.length} vaults.`);
      const monitoredVaults = await services.monitor.monitorVaults(discoveredVaults);
      // Re-create the agent with the correct signer for this run
      const agentWithSigner = new LiquidationAgentService(services.agent['liquidationManager'].connect(botSigner) as ethers.Contract, logger);
      await agentWithSigner.liquidateUnhealthyVaults(monitoredVaults);
    }
  } catch (e) {
    logger.error(e, 'Error in main loop');
  }
}

async function main() {
  logger.info('SCC Keeper Bot starting...');

  // 1. Composition Root
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
  const mainLoop = setInterval(() => runOnce(services, keeperWallet), 15000);
  runOnce(services, keeperWallet);

  // 4. Graceful Shutdown Handler
  const gracefulShutdown = (signal: string) => {
    logger.warn(`Received ${signal}. Shutting down gracefully...`);
    clearInterval(mainLoop);
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
