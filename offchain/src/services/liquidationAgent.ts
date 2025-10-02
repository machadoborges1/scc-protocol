import { ethers } from 'ethers';
import { keeperWallet, getGasPrice, retry } from '../rpc';
import { LiquidationManagerInterface } from '../contracts/abis';
import { config } from '../config';
import logger from '../logger';

interface MonitoredVault {
  address: string;
  owner: string;
  collateralToken: string;
  debtToken: string;
  collateralAmount: bigint;
  debtAmount: bigint;
  collateralPrice: bigint;
  collateralizationRatio: number;
}

const MIN_COLLATERALIZATION_RATIO = 150; // Example: 150% CR

class LiquidationAgentService {
  private liquidationManagerContract: ethers.Contract;

  constructor() {
    this.liquidationManagerContract = new ethers.Contract(
      config.LIQUIDATION_MANAGER_ADDRESS,
      LiquidationManagerInterface,
      keeperWallet // Signer for sending transactions
    );
  }

  public async liquidateUnhealthyVaults(vaults: MonitoredVault[]): Promise<void> {
    logger.info(`Checking ${vaults.length} vaults for liquidation opportunities...`);

    for (const vault of vaults) {
      if (vault.collateralizationRatio < MIN_COLLATERALIZATION_RATIO) {
        logger.warn(`Vault ${vault.address} is unhealthy! CR: ${vault.collateralizationRatio.toFixed(2)}%`);
        await this.initiateLiquidation(vault);
      } else {
        logger.debug(`Vault ${vault.address} is healthy. CR: ${vault.collateralizationRatio.toFixed(2)}%`);
      }
    }
  }

  private async initiateLiquidation(vault: MonitoredVault): Promise<void> {
    logger.info(`Initiating liquidation for vault ${vault.address}...`);

    try {
      const gasPrice = await getGasPrice();

      // Simulate the transaction first (Milestone 4.5)
      // Note: ethers.js doesn't have a direct simulate function like viem.simulateContract.
      // A common approach is to use callStatic or estimateGas to check for reverts.
      // For a more robust simulation, a local fork or a dedicated simulation service would be used.
      await retry(async () => {
        await this.liquidationManagerContract.startAuction.staticCall(vault.address, { gasPrice });
      });
      logger.info(`Liquidation simulation for vault ${vault.address} successful.`);

      // Send the transaction (Milestone 4.2, 4.3, 4.6)
      const tx = await retry(async () => {
        return this.liquidationManagerContract.startAuction(vault.address, { gasPrice });
      });

      logger.info(`Liquidation transaction sent for vault ${vault.address}. Tx hash: ${tx.hash}`);

      // Wait for the transaction to be mined (Milestone 4.8)
      const receipt: ethers.TransactionReceipt | null = await retry(() => tx.wait());
      logger.info(`Liquidation transaction for vault ${vault.address} confirmed in block ${receipt?.blockNumber}.`);

    } catch (error) {
      logger.error(error, `Failed to liquidate vault ${vault.address}`);
    }
  }
}

export const liquidationAgentService = new LiquidationAgentService();
