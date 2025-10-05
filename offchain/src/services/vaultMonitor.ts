import { ethers } from 'ethers';
import { retry } from '../rpc';
import logger from '../logger'; // New import
import { vaultQueue, VaultQueueItem } from '../queue'; // New import
import { LiquidationAgentService } from './liquidationAgent'; // New import

export type VaultContractFactory = (address: string) => ethers.Contract;

const MIN_CR = 150; // Define MIN_CR for monitoring purposes

/**
 * Service responsible for monitoring the health of vaults.
 */
export class VaultMonitorService {
  private isRunning = false; // New property

  /**
   * @param oracleManager An ethers.Contract instance for the OracleManager.
   * @param vaultFactory A factory function that returns an ethers.Contract instance for a given vault address.
   * @param liquidationAgent The LiquidationAgentService instance.
   * @param logger The logger instance.
   */
  constructor(private oracleManager: ethers.Contract, private vaultFactory: VaultContractFactory, private liquidationAgent: LiquidationAgentService, private logger: any) {}

  public start(): void {
    this.isRunning = true;
    this.logger.info('VaultMonitorService started. Listening for new vaults...');
    this.processQueueLoop(); // Start the processing loop
  }

  public stop(): void {
    this.isRunning = false;
    this.logger.info('VaultMonitorService stopped.');
  }

  private async processQueueLoop(): Promise<void> {
    while (this.isRunning) {
      const vaultItem = vaultQueue.dequeue();
      if (vaultItem) {
        await this.processVault(vaultItem);
      } else {
        // If queue is empty, wait for a short period before checking again
        await new Promise(resolve => setTimeout(resolve, 1000)); // Poll every 1 second
      }
    }
  }

  private async processVault(vaultItem: VaultQueueItem): Promise<void> {
    try {
      const vault = this.vaultFactory(vaultItem.address);
      const debt = await retry(() => vault.debtAmount());
      let cr = Infinity;
      if (debt > 0n) {
        const collateral = await retry(() => vault.collateralAmount());
        // TODO: This assumes the collateral token has 18 decimals. Make it dynamic if needed.
        const price = await retry(async () => this.oracleManager.getPrice(await vault.collateralToken()));
        // CR = (Collateral Value / Debt Value) * 100
        // Collateral Value = (collateralAmount * price) / 1e18 (since price has 18 decimals)
        cr = Number((BigInt(collateral) * BigInt(price) * 100n) / (BigInt(debt) * (10n ** 18n)));
      }
      this.logger.info(`Monitored vault ${vaultItem.address}: CR = ${cr.toFixed(2)}%`);
      
      if (cr < MIN_CR) {
        this.logger.warn(`Vault ${vaultItem.address} is unhealthy! CR: ${cr.toFixed(2)}%. Passing to liquidation agent.`);
        await this.liquidationAgent.liquidateUnhealthyVaults([{ address: vaultItem.address, collateralizationRatio: cr }]);
      }

    } catch (error) {
      this.logger.error(error, `Failed to monitor vault ${vaultItem.address}`);
    }
  }
}