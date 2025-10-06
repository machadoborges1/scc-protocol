import logger from './logger';
import { config } from './config';
import { createPublicClient, createWalletClient } from './rpc';
import { VaultQueue } from './queue';
import { VaultDiscoveryService } from './services/vaultDiscovery';
import { VaultMonitorService } from './services/vaultMonitor';
import { TransactionManagerService } from './services/transactionManager';
import { LiquidationStrategyService } from './services/liquidationStrategy';

/**
 * Orquestrador principal do bot.
 * Configura e inicializa todos os módulos, injetando as dependências necessárias
 * e gerenciando o ciclo de vida do processo.
 */
async function main() {
  logger.info('SCC Keeper Bot starting...');

  // 1. Composição dos Clientes e Carteira
  const publicClient = createPublicClient();
  const { account, walletClient } = createWalletClient(publicClient);
  logger.info(`Keeper account address: ${account.address}`);

  // 2. Composição da Fila e dos Serviços
  const vaultQueue = new VaultQueue();

  const transactionManager = new TransactionManagerService(
    publicClient,
    walletClient,
    account,
    config.LIQUIDATION_MANAGER_ADDRESS,
  );

  const liquidationStrategy = new LiquidationStrategyService(transactionManager);

  const vaultMonitor = new VaultMonitorService(
    publicClient,
    vaultQueue,
    liquidationStrategy,
    config.ORACLE_MANAGER_ADDRESS,
  );

  const vaultDiscovery = new VaultDiscoveryService(
    publicClient,
    vaultQueue,
    config.VAULT_FACTORY_ADDRESS,
  );

  // 3. Início dos Serviços
  // O serviço de descoberta preenche a fila com vaults históricos e escuta por novos.
  await vaultDiscovery.start();

  // O serviço de monitoramento consome a fila e verifica a saúde dos vaults.
  vaultMonitor.start();

  // 4. Gerenciador de Desligamento Gracioso
  const gracefulShutdown = (signal: string) => {
    logger.warn(`Received ${signal}. Shutting down gracefully...`);
    vaultDiscovery.stop();
    vaultMonitor.stop();
    // Adicionar paradas para outros serviços se necessário
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