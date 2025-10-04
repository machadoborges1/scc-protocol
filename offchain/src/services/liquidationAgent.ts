import { ethers } from 'ethers';
import { getGasPrice, retry } from '../rpc';

const MIN_CR = 150;

interface MonitoredVault { // Using a more specific interface
  address: string;
  collateralizationRatio: number;
}

export class LiquidationAgentService {
  constructor(private liquidationManager: ethers.Contract, private logger: any) {}

  public async liquidateUnhealthyVaults(vaults: MonitoredVault[]) {
    this.logger.info(`Checking ${vaults.length} vaults for liquidation opportunities...`);
    for (const vault of vaults) {
      if (vault.collateralizationRatio < MIN_CR) {
        await this.initiateLiquidation(vault);
      }
    }
  }

  private async initiateLiquidation(vault: MonitoredVault): Promise<void> {
    this.logger.info(`Processing vault ${vault.address} for liquidation.`);

    try {
      const activeAuctionId = await retry(() => this.liquidationManager.vaultToAuctionId(vault.address));
      if (activeAuctionId !== 0n) {
        this.logger.info(`Auction for vault ${vault.address} is already active (ID: ${activeAuctionId}). Skipping.`);
        return;
      }

      this.logger.warn(`Vault ${vault.address} is unhealthy! CR: ${vault.collateralizationRatio.toFixed(2)}%. Initiating liquidation...`);

      const provider = this.liquidationManager.runner?.provider;
      if (!provider) throw new Error('Provider not found on contract runner');
      const gasPrice = await getGasPrice(provider);

      await retry(() => this.liquidationManager.startAuction.staticCall(vault.address, { gasPrice }));
      const tx = await retry(() => this.liquidationManager.startAuction(vault.address, { gasPrice }));
      this.logger.info(`Liquidation tx sent for ${vault.address}. Hash: ${tx.hash}`);
      await retry(() => tx.wait());

    } catch (error) {
      this.logger.error(error, `Failed to liquidate vault ${vault.address}`);
    }
  }
}