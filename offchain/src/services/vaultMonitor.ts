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

export class VaultMonitorService {
  private isRunning = false;
  private readonly minCr = BigInt(config.MIN_CR); // ex: 150 for 150%

  constructor(
    private publicClient: PublicClient,
    private queue: VaultQueue,
    private liquidationStrategy: LiquidationStrategyService,
    private oracleManagerAddress: Address,
  ) {}

  public start(): void {
    if (this.isRunning) {
      logger.warn('VaultMonitorService is already running.');
      return;
    }
    this.isRunning = true;
    logger.info('VaultMonitorService started.');
    this.processQueueLoop();
  }

  public stop(): void {
    this.isRunning = false;
    logger.info('VaultMonitorService stopped.');
  }

  private async processQueueLoop(): Promise<void> {
    while (this.isRunning) {
      const vaultAddress = this.queue.getNext();
      if (vaultAddress) {
        await this.monitorVault(vaultAddress);
        // Re-add the vault to the end of the queue to ensure continuous monitoring
        this.queue.add(vaultAddress);
      }
      // Wait for the poll interval before processing the next vault
      await new Promise(resolve => setTimeout(resolve, config.POLL_INTERVAL_MS));
    }
  }

  private async monitorVault(vaultAddress: Address): Promise<void> {
    logger.info({ vaultAddress }, '[DEBUG] Entering monitorVault');
    try {
      let debtAmount: bigint, collateralAmount: bigint, collateralToken: Address;

      logger.info('[DEBUG] Using readContract path');
      debtAmount = await retry(() =>
        this.publicClient.readContract({
          address: vaultAddress,
          abi: VAULT_ABI,
          functionName: 'debtAmount',
        }),
      );
      logger.info({ debtAmount: debtAmount.toString() }, '[DEBUG] Fetched debtAmount');

      collateralAmount = await retry(() =>
        this.publicClient.readContract({
          address: vaultAddress,
          abi: VAULT_ABI,
          functionName: 'collateralAmount',
        }),
      );
      logger.info({ collateralAmount: collateralAmount.toString() }, '[DEBUG] Fetched collateralAmount');

      collateralToken = await retry(() =>
        this.publicClient.readContract({
          address: vaultAddress,
          abi: VAULT_ABI,
          functionName: 'collateralToken',
        }),
      );
      logger.info({ collateralToken }, '[DEBUG] Fetched collateralToken');


      if (debtAmount === 0n) {
        logger.info(`Vault ${vaultAddress}: Healthy (no debt).`);
        return;
      }

      logger.info('[DEBUG] Vault has debt, proceeding to get price.');
      const price = await retry(() => this.publicClient.readContract({
        address: this.oracleManagerAddress,
        abi: ORACLE_ABI,
        functionName: 'getPrice',
        args: [collateralToken],
        account: vaultAddress,
      }));
      logger.info({ price: price.toString() }, '[DEBUG] Fetched price');

      const crPercentage = (collateralAmount * price * 100n) / debtAmount / (10n**18n);

      logger.info({ crPercentage: crPercentage.toString() }, '[DEBUG] Calculated CR');

      logger.info(`Monitored vault ${vaultAddress}: CR = ${crPercentage}%`);

      if (crPercentage < this.minCr) {
        logger.warn(`Vault ${vaultAddress} is unhealthy! CR: ${crPercentage}%. Passing to liquidation strategy service.`);
        unhealthyVaultsDetected.inc();
        logger.info(`[DEBUG] Vault ${vaultAddress} passed to LiquidationStrategyService.`);
        await this.liquidationStrategy.processUnhealthyVaults([{
          address: vaultAddress,
          collateralizationRatio: Number(crPercentage),
        }]);
      }
    } catch (error) {
      logger.error({ err: error, vault: vaultAddress }, `[DEBUG] Error in monitorVault`);
    }
  }
}