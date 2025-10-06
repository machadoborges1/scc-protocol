import { Address, PublicClient, formatGwei } from 'viem';
import logger from '../logger';
import { TransactionManagerService } from './transactionManager';
import { config } from '../config';
import { retry } from '../rpc';

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
  public async processUnhealthyVaults(vaults: MonitoredVault[]): Promise<void> {
    logger.info(`[DEBUG] LiquidationStrategyService received ${vaults.length} unhealthy vaults.`);
    this.liquidationQueue.push(...vaults);
    this._processQueue(); // Tenta iniciar o processamento da fila
  }

  private async _processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.liquidationQueue.length === 0) {
      return; // Já processando ou fila vazia
    }

    this.isProcessingQueue = true;
    const vault = this.liquidationQueue.shift(); // Pega o próximo vault da fila

    if (!vault) {
      this.isProcessingQueue = false;
      return; // Fila ficou vazia inesperadamente
    }

    logger.info(`Processing liquidation for vault ${vault.address} from queue.`);

    try {
      // Análise de lucratividade usando taxas de gás EIP-1559
      const { maxFeePerGas } = await retry(() => this.publicClient.estimateFeesPerGas());
      const maxFeePerGasGwei = Number(formatGwei(maxFeePerGas ?? 0n));

      const isProfitable = maxFeePerGasGwei < config.MAX_GAS_PRICE_GWEI;

      if (!isProfitable) {
        logger.warn(
          { maxFeePerGasGwei, maxGasPrice: config.MAX_GAS_PRICE_GWEI },
          `Gas price (maxFeePerGas) is too high. Skipping liquidation for vault ${vault.address}.`,
        );
      } else {
        logger.info(`Liquidation for vault ${vault.address} is profitable. Executing...`);
        // O TransactionManager já verifica se um leilão está ativo.
        await this.transactionManager.startAuction(vault.address);
        logger.info(`Liquidation for vault ${vault.address} completed.`);
      }
    } catch (error: any) { // Adicionado : any para o tipo do erro
      logger.error(
        { vaultAddress: vault.address, error: error.message },
        `Error processing liquidation for vault ${vault.address}.`,
      );
      // Em caso de erro, podemos decidir se o vault deve ser reenfileirado ou descartado.
      // Por enquanto, apenas logamos e seguimos em frente.
    } finally {
      this.isProcessingQueue = false;
      await this._processQueue(); // <--- AGORA AGUARDAMOS A CHAMADA RECURSIVA
    }
  }
}