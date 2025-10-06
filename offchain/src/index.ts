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

  // 3. Inicialização dos Serviços
  await transactionManager.initialize();

  // 4. Início dos Serviços
  // O serviço de descoberta preenche a fila com vaults históricos e escuta por novos.
  await vaultDiscovery.start();

  // O serviço de monitoramento consome a fila e verifica a saúde dos vaults.
  vaultMonitor.start();

  // 5. Servidor de Métricas
  const metricsPort = process.env.METRICS_PORT || 9091;
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

  // 6. Coleta de Métricas Periódicas
  setInterval(async () => {
    try {
      const balance = await publicClient.getBalance({ address: account.address });
      const balanceEth = Number(formatEther(balance));
      
      // Converte o BigInt para um número para o Gauge. O prom-client não suporta BigInt.
      keeperEthBalance.set(balanceEth);

      // Verifica se o saldo está abaixo do limite mínimo e envia um alerta
      if (balanceEth < config.MIN_KEEPER_ETH_BALANCE) {
        sendAlert('warn', 'Keeper ETH Balance Low', { 
          balance: `${balanceEth.toFixed(4)} ETH`,
          threshold: `${config.MIN_KEEPER_ETH_BALANCE} ETH`,
        });
      }
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch keeper ETH balance for metrics.');
    }
  }, 60_000); // A cada 60 segundos

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