import { PublicClient, Address, parseAbi, formatUnits } from 'viem';
import { VaultQueue } from '../queue';
import logger from '../logger';
import { config } from '../config';
import { retry } from '../rpc';
import { LiquidationStrategyService } from './liquidationStrategy';
import { unhealthyVaultsDetected } from '../metrics';

const VAULT_ABI = parseAbi([
  'function debtAmount() external view returns (uint256)',
  'function collateralAmount() external view returns (uint256)',
  'function collateralToken() external view returns (address)',
]);

const ORACLE_ABI = parseAbi([
  'function getPrice(address token) external view returns (uint256)',
]);

/**
 * Serviço para monitorar a saúde dos Vaults.
 * Atua como um "Consumidor", processando os Vaults de uma fila.
 */
export class VaultMonitorService {
  private isRunning = false;
  private readonly minCr = BigInt(config.MIN_CR * 100); // ex: 15000 for 150%

  constructor(
    private publicClient: PublicClient,
    private queue: VaultQueue,
    private liquidationStrategy: LiquidationStrategyService,
    private oracleManagerAddress: Address,
  ) {}

  /**
   * Inicia o loop de processamento da fila.
   */
  public start(): void {
    if (this.isRunning) {
      logger.warn('VaultMonitorService is already running.');
      return;
    }
    this.isRunning = true;
    logger.info('VaultMonitorService started.');
    this.processQueueLoop();
  }

  /**
   * Para o loop de processamento.
   */
  public stop(): void {
    this.isRunning = false;
    logger.info('VaultMonitorService stopped.');
  }

  private async processQueueLoop(): Promise<void> {
    while (this.isRunning) {
      const vaultAddress = this.queue.getNext();
      if (vaultAddress) {
        await this.monitorVault(vaultAddress);
      } else {
        // Aguarda se a fila estiver vazia
        await new Promise(resolve => setTimeout(resolve, config.POLL_INTERVAL_MS));
      }
    }
  }

  /**
   * Busca o estado de um vault, calcula seu CR e o envia para liquidação se estiver insalubre.
   * @param vaultAddress O endereço do vault a ser monitorado.
   */
  private async monitorVault(vaultAddress: Address): Promise<void> {
    try {
      const results = await retry(() => this.publicClient.multicall({
        contracts: [
          { address: vaultAddress, abi: VAULT_ABI, functionName: 'debtAmount' },
          { address: vaultAddress, abi: VAULT_ABI, functionName: 'collateralAmount' },
          { address: vaultAddress, abi: VAULT_ABI, functionName: 'collateralToken' },
        ],
        allowFailure: false,
      }));

      const [debtAmount, collateralAmount, collateralToken] = results;

      if (debtAmount === 0n) {
        logger.info(`Vault ${vaultAddress}: Healthy (no debt).`);
        return;
      }

      const price = await retry(() => this.publicClient.readContract({
        address: this.oracleManagerAddress,
        abi: ORACLE_ABI,
        functionName: 'getPrice',
        args: [collateralToken],
      }));

      // CR = (collateral * price) / debt
      // Preços e valores de token têm 18 casas decimais, então normalizamos.
      const collateralValue = collateralAmount * price; // O valor já está em 10^36
      const collateralizationRatio = collateralValue / debtAmount; // O resultado fica em 10^18

      // Para comparar com o MCR, trazemos para a mesma base (100% = 10000)
      const crPercentage = collateralizationRatio / BigInt(10 ** 14);

      logger.info(`Monitored vault ${vaultAddress}: CR = ${formatUnits(crPercentage, 2)}%`);

      if (crPercentage < this.minCr) {
        logger.warn(`Vault ${vaultAddress} is unhealthy! CR: ${formatUnits(crPercentage, 2)}%. Passing to liquidation strategy service.`);
        unhealthyVaultsDetected.inc();
        logger.info(`[DEBUG] Vault ${vaultAddress} passed to LiquidationStrategyService.`);
        await this.liquidationStrategy.processUnhealthyVaults([{
          address: vaultAddress,
          collateralizationRatio: Number(formatUnits(crPercentage, 2)),
        }]);
      }
    } catch (error) {
      logger.error({ err: error, vault: vaultAddress }, `Failed to monitor vault.`);
    }
  }
}
