import { Address, PublicClient, formatGwei } from 'viem';
import logger from '../logger';
import { TransactionManagerService } from './transactionManager';
import { config } from '../config';
import { retry } from '../rpc';
import { liquidationsAnalyzed } from '../metrics';

interface MonitoredVault {
  address: Address;
  collateralizationRatio: number;
}

/**
 * Serviço "Cérebro": decide se uma liquidação deve ocorrer e gerencia o throttling.
 */
export class LiquidationStrategyService {
  private liquidationQueue: MonitoredVault[] = [];
  private isProcessingQueue = false;

  constructor(
    private publicClient: PublicClient,
    private transactionManager: TransactionManagerService,
  ) {}

  /**
   * Adiciona vaults insalubres à fila de liquidação e inicia o processamento se não estiver ativo.
   * @param vaults A lista de vaults insalubres.
   */
  public processUnhealthyVaults(vaults: MonitoredVault[]): void {
    logger.info(`[DEBUG] LiquidationStrategyService received ${vaults.length} unhealthy vaults.`);
    this.liquidationQueue.push(...vaults);
    this._processQueue();
  }

  private async _processQueue(): Promise<void> {
    if (this.isProcessingQueue) {
      return; // Evita processamento concorrente
    }
    this.isProcessingQueue = true;

    logger.info(`Starting liquidation queue processing. Queue size: ${this.liquidationQueue.length}`);

    try {
      while (this.liquidationQueue.length > 0) {
        const vault = this.liquidationQueue.shift();
        if (!vault) {
          continue;
        }

        logger.info(`Processing liquidation for vault ${vault.address} from queue.`);

        try {
          // Análise de lucratividade usando taxas de gás EIP-1559
          const { maxFeePerGas } = await retry(() => this.publicClient.estimateFeesPerGas());
          const maxFeePerGasGwei = Number(formatGwei(maxFeePerGas ?? 0n));

          const isProfitable = maxFeePerGasGwei < config.MAX_GAS_PRICE_GWEI;

          if (!isProfitable) {
            liquidationsAnalyzed.inc({ is_profitable: 'false' });
            logger.warn(
              { maxFeePerGasGwei, maxGasPrice: config.MAX_GAS_PRICE_GWEI },
              `Gas price (maxFeePerGas) is too high. Skipping liquidation for vault ${vault.address}.`,
            );
          } else {
            liquidationsAnalyzed.inc({ is_profitable: 'true' });
            logger.info(`Liquidation for vault ${vault.address} is profitable. Executing...`);
            await this.transactionManager.startAuction(vault.address);
            logger.info(`Liquidation for vault ${vault.address} completed.`);
          }
        } catch (error: any) {
          logger.error(
            { vaultAddress: vault.address, error: error.message },
            `Error processing liquidation for vault ${vault.address}.`,
          );
          // Em caso de erro, não reenfileiramos para evitar loops infinitos.
        }
      }
    } finally {
      this.isProcessingQueue = false;
      logger.info('Finished processing liquidation queue.');
    }
  }
}