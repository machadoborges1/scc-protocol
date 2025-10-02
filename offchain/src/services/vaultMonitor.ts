import { ethers } from 'ethers';
import { provider, retry, keeperWallet } from '../rpc';
import { VaultInterface, OracleManagerInterface } from '../contracts/abis';
import { config } from '../config';
import logger from '../logger';

interface VaultInfo {
  address: string;
  owner: string;
}

interface MonitoredVault extends VaultInfo {
  collateralToken: string;
  debtToken: string;
  collateralAmount: bigint;
  debtAmount: bigint;
  collateralPrice: bigint;
  collateralizationRatio: number;
}

class VaultMonitorService {
  private oracleManagerContract: ethers.Contract;
  private monitoredVaults: Map<string, MonitoredVault> = new Map();

  constructor() {
    this.oracleManagerContract = new ethers.Contract(
      config.ORACLE_MANAGER_ADDRESS,
      OracleManagerInterface,
      keeperWallet
    );
  }

  public async monitorVaults(vaults: VaultInfo[]): Promise<MonitoredVault[]> {
    logger.info(`Monitoring ${vaults.length} vaults...`);
    const updatedMonitoredVaults: MonitoredVault[] = [];

    // Batch fetching vault data and oracle prices
    // Note: ethers.js does not have a built-in multicall utility. We would typically use a library like @makerdao/multicall
    // or implement a basic one. For this example, we'll simulate individual calls but acknowledge the optimization.
    // In a real-world scenario, a multicall contract would be deployed and used here.

    for (const vaultInfo of vaults) {
      const vaultContract = new ethers.Contract(vaultInfo.address, VaultInterface, provider);

      // Fetch collateralToken and debtToken from the Vault contract
      const collateralToken = await retry(() => vaultContract.collateralToken());
      const debtToken = await retry(() => vaultContract.sccUsdToken());

      const collateralAmount = await retry(() => vaultContract.collateralAmount());
      const debtAmount = await retry(() => vaultContract.debtAmount());
      const collateralPrice = await retry(() => this.oracleManagerContract.getPrice(collateralToken));

      // Calculate Collateralization Ratio
      let collateralizationRatio: number;
      if (debtAmount > 0n) {
        // To maintain precision, multiply by a scaling factor before dividing.
        const scale = 10000n; // Using 10000 for 2 decimal places of precision (e.g., 150.25%)
        const numerator = BigInt(collateralAmount) * BigInt(collateralPrice) * scale;
        const denominator = BigInt(debtAmount);
        const ratio = numerator / denominator;
        collateralizationRatio = Number(ratio) / 100;
      } else {
        // If debt is zero, collateralization is infinite (healthy).
        collateralizationRatio = Number.POSITIVE_INFINITY;
      }

      const monitoredVault: MonitoredVault = {
        ...vaultInfo,
        collateralToken,
        debtToken,
        collateralAmount,
        debtAmount,
        collateralPrice,
        collateralizationRatio,
      };
      this.monitoredVaults.set(vaultInfo.address, monitoredVault);
      updatedMonitoredVaults.push(monitoredVault);

      logger.debug(`Vault ${vaultInfo.address}: CR = ${collateralizationRatio.toFixed(2)}%`);
    }

    logger.info(`Finished monitoring ${updatedMonitoredVaults.length} vaults.`);
    return updatedMonitoredVaults;
  }

  public getMonitoredVaults(): MonitoredVault[] {
    return Array.from(this.monitoredVaults.values());
  }
}

export const vaultMonitorService = new VaultMonitorService();