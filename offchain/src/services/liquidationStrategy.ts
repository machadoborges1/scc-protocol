import { Address } from 'viem';
import logger from '../logger';
import { TransactionManagerService } from './transactionManager';

interface MonitoredVault {
  address: Address;
  collateralizationRatio: number;
}

/**
 * Serviço "Cérebro": decide se uma liquidação deve ocorrer.
 */
export class LiquidationStrategyService {
  constructor(
    private transactionManager: TransactionManagerService,
  ) {}

  /**
   * Processa uma lista de vaults insalubres e decide se os liquida.
   * @param vaults A lista de vaults insalubres.
   */
  public async processUnhealthyVaults(vaults: MonitoredVault[]): Promise<void> {
    logger.info(`Processing ${vaults.length} unhealthy vaults...`);

    for (const vault of vaults) {
      // Lógica de lucratividade (a ser implementada no Milestone 4.3)
      // Por enquanto, a estratégia é simples: sempre liquidar se for insalubre.
      const isProfitable = true; // Simplificação

      if (isProfitable) {
        logger.info(`Liquidation for vault ${vault.address} is profitable. Executing...`);
        // O TransactionManager já verifica se um leilão está ativo.
        await this.transactionManager.startAuction(vault.address);
      } else {
        logger.info(`Liquidation for vault ${vault.address} is not profitable. Skipping.`);
      }
    }
  }
}
