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
 * "Brain" Service: decides if a liquidation should occur and manages throttling.
 */
export class LiquidationStrategyService {
  private liquidationQueue: MonitoredVault[] = [];
  private isProcessingQueue = false;

  constructor(
    private publicClient: PublicClient,
    private transactionManager: TransactionManagerService,
  ) {}

  /**
   * Adds unhealthy vaults to the liquidation queue and starts processing if not already active.
   * @param vaults The list of unhealthy vaults.
   */
  public processUnhealthyVaults(vaults: MonitoredVault[]): void {
    logger.info(`[DEBUG] LiquidationStrategyService received ${vaults.length} unhealthy vaults.`);
    this.liquidationQueue.push(...vaults);
    this._processQueue();
  }

  private async _processQueue(): Promise<void> {
    if (this.isProcessingQueue) {
      return; // Prevents concurrent processing
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
          // Profitability analysis using EIP-1559 gas fees
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
          // In case of error, we do not re-queue to avoid infinite loops.
        }
      }
    } finally {
      this.isProcessingQueue = false;
      logger.info('Finished processing liquidation queue.');
    }
  }
}