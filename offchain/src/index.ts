import { createServer } from 'http';
import { register, keeperEthBalance } from './metrics';
import { Address, formatEther } from 'viem';
import logger from './logger';
import { config } from './config';
import { sendAlert } from './alerter';
import { createPublicClient, createWalletClient } from './rpc';
import { VaultQueue } from './queue';
import { VaultDiscoveryService } from './services/vaultDiscovery';
import { VaultMonitorService } from './services/vaultMonitor';
import { TransactionManagerService } from './services/transactionManager';
import { LiquidationStrategyService } from './services/liquidationStrategy';

/**
 * Main bot orchestrator.
 * Configures and initializes all modules, injecting necessary dependencies
 * and managing the process lifecycle.
 */
async function main() {
  logger.info('SCC Keeper Bot starting...');

  // 1. Client and Wallet Composition
  const publicClient = createPublicClient();
  const { account, walletClient } = createWalletClient(publicClient);
  logger.info(`Keeper account address: ${account.address}`);

  // 2. Queue and Service Composition
  const vaultQueue = new VaultQueue();

  const transactionManager = new TransactionManagerService(
    publicClient,
    walletClient,
    account,
    config.LIQUIDATION_MANAGER_ADDRESS as Address,
  );

  const liquidationStrategy = new LiquidationStrategyService(publicClient, transactionManager);

  const vaultMonitor = new VaultMonitorService(
    publicClient,
    vaultQueue,
    liquidationStrategy,
    config.ORACLE_MANAGER_ADDRESS as Address,
  );

  const vaultDiscovery = new VaultDiscoveryService(
    publicClient,
    vaultQueue,
    config.VAULT_FACTORY_ADDRESS as Address,
  );

  // 3. Service Initialization
  await transactionManager.initialize();

  // 4. Service Start
  // The discovery service populates the queue with historical vaults and listens for new ones.
  await vaultDiscovery.start();

  // The monitoring service consumes the queue and checks the health of the vaults.
  vaultMonitor.start();

  // 5. Metrics Server
  const metricsPort = process.env.METRICS_PORT || 9092;
  const metricsServer = createServer(async (req, res) => {
    if (req.url === '/metrics') {
      res.setHeader('Content-Type', register.contentType);
      res.end(await register.metrics());
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  metricsServer.listen(metricsPort, () => {
    logger.info(`Metrics server listening on http://localhost:${metricsPort}`);
  });

  // 6. Periodic Metrics Collection
  setInterval(async () => {
    try {
      const balance = await publicClient.getBalance({ address: account.address });
      const balanceEth = Number(formatEther(balance));
      
      // Converts BigInt to a number for the Gauge. prom-client does not support BigInt.
      keeperEthBalance.set(balanceEth);

      // Checks if the balance is below the minimum limit and sends an alert
      if (balanceEth < config.MIN_KEEPER_ETH_BALANCE) {
        sendAlert('warn', 'Keeper ETH Balance Low', { 
          balance: `${balanceEth.toFixed(4)} ETH`,
          threshold: `${config.MIN_KEEPER_ETH_BALANCE} ETH`,
        });
      }
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch keeper ETH balance for metrics.');
    }
  }, 60_000); // Every 60 seconds

  // 4. Graceful Shutdown Manager
  const gracefulShutdown = (signal: string) => {
    logger.warn(`Received ${signal}. Shutting down gracefully...`);
    vaultDiscovery.stop();
    vaultMonitor.stop();
    // Add stops for other services if necessary
    logger.info('Bot shutdown complete.');
    process.exit(0);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

if (require.main === module) {
  main().catch((error) => {
    logger.error({ err: error }, 'Unhandled error in main function.');
    process.exit(1);
  });
}