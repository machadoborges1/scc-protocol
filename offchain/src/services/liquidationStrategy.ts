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
 * Serviço "Cérebro": decide se uma liquidação deve ocorrer.
 */
export class LiquidationStrategyService {
  constructor(
    private publicClient: PublicClient,
    private transactionManager: TransactionManagerService,
  ) {}

  /**
   * Processa uma lista de vaults insalubres e decide se os liquida.
   * @param vaults A lista de vaults insalubres.
   */
  public async processUnhealthyVaults(vaults: MonitoredVault[]): Promise<void> {
    logger.info(`[DEBUG] LiquidationStrategyService received ${vaults.length} unhealthy vaults.`);
    logger.info(`Processing ${vaults.length} unhealthy vaults...`);

    // Análise de lucratividade simples baseada no preço do gás
    const gasPrice = await retry(() => this.publicClient.getGasPrice());
    const gasPriceGwei = Number(formatGwei(gasPrice));

    const isProfitable = gasPriceGwei < config.MAX_GAS_PRICE_GWEI;

    if (!isProfitable) {
      logger.warn(
        { gasPriceGwei, maxGasPrice: config.MAX_GAS_PRICE_GWEI },
        `Gas price is too high. Skipping all liquidations for this batch.`,
      );
      return;
    }

    for (const vault of vaults) {
      logger.info(`Liquidation for vault ${vault.address} is profitable. Executing...`);
      // O TransactionManager já verifica se um leilão está ativo.
      await this.transactionManager.startAuction(vault.address);
    }
  }
}
