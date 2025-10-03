import logger from './logger';
import { createProvider, createKeeperWallet } from './rpc';
import { createContracts } from './contracts';
import { VaultDiscoveryService } from './services/vaultDiscovery';
import { VaultMonitorService } from './services/vaultMonitor';
import { LiquidationAgentService } from './services/liquidationAgent';

async function main() {
  logger.info('SCC Keeper Bot starting...');

  // 1. Composition Root
  const provider = createProvider();
  const keeperWallet = createKeeperWallet(provider);
  const contracts = createContracts(provider, keeperWallet);

  // 2. Instantiate services with dependencies
  const discovery = new VaultDiscoveryService(contracts.vaultFactoryContract, provider);
  const monitor = new VaultMonitorService(contracts.oracleManagerContract, contracts.getVaultContract);
  const agent = new LiquidationAgentService(contracts.liquidationManagerContract_RW);

  logger.info(`Keeper address: ${keeperWallet.address}`);

  // 3. Start the application
  await discovery.start();

  const runLoop = async () => {
    try {
      const vaults = discovery.getVaults();
      if (vaults.length > 0) {
        const monitored = await monitor.monitorVaults(vaults);
        await agent.liquidateUnhealthyVaults(monitored);
      }
    } catch (e) { logger.error(e, 'Error in main loop'); }
  };

  setInterval(runLoop, 15000);
  runLoop();
}

main().catch((e) => { logger.error(e, 'Unhandled error'); process.exit(1); });
