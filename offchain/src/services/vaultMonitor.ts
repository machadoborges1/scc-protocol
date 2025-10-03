import { ethers } from 'ethers';
import { retry } from '../rpc';

export type VaultContractFactory = (address: string) => ethers.Contract;

export class VaultMonitorService {
  constructor(private oracleManager: ethers.Contract, private vaultFactory: VaultContractFactory) {}

  public async monitorVaults(vaults: { address: string }[]) {
    const monitored = [];
    for (const v of vaults) {
      const vault = this.vaultFactory(v.address);
      const debt = await retry(() => vault.debtAmount());
      let cr = Infinity;
      if (debt > 0n) {
        const collateral = await retry(() => vault.collateralAmount());
        const price = await retry(() => this.oracleManager.getPrice(vault.collateralToken()));
        cr = Number((BigInt(collateral) * BigInt(price) * 100n) / (BigInt(debt) * (10n ** 18n)));
      }
      monitored.push({ ...v, collateralizationRatio: cr });
    }
    return monitored;
  }
}