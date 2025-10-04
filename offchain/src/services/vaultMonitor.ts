import { ethers } from 'ethers';
import { retry } from '../rpc';

export type VaultContractFactory = (address: string) => ethers.Contract;

/**
 * Service responsible for monitoring the health of vaults.
 */
export class VaultMonitorService {
  /**
   * @param oracleManager An ethers.Contract instance for the OracleManager.
   * @param vaultFactory A factory function that returns an ethers.Contract instance for a given vault address.
   */
  constructor(private oracleManager: ethers.Contract, private vaultFactory: VaultContractFactory) {}

  /**
   * Checks a list of vaults and calculates their collateralization ratio (CR).
   * @param vaults An array of objects, each with a vault address.
   * @returns A promise that resolves to an array of vaults, each augmented with its collateralization ratio.
   */
  public async monitorVaults(vaults: { address: string }[]) {
    const monitoredPromises = vaults.map(async (v) => {
      const vault = this.vaultFactory(v.address);
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
      return { ...v, collateralizationRatio: cr };
    });

    return Promise.all(monitoredPromises);
  }
}