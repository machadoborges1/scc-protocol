import { ethers } from 'ethers';
import { retry } from '../rpc';
import logger from '../logger';
import { config } from '../config';

export class VaultDiscoveryService {
  constructor(private vaultFactoryContract: ethers.Contract, private provider: ethers.Provider) {}

  private discoveredVaults = new Map<string, { address: string; owner: string }>();

  public async start(): Promise<void> {
    const filter = this.vaultFactoryContract.filters.VaultCreated();
    const events = await retry(() => this.vaultFactoryContract.queryFilter(filter, config.VAULT_FACTORY_DEPLOY_BLOCK));
    for (const event of events) {
      if ('args' in event && event.args) {
        this.addVault(event.args[0], event.args[1]);
      }
    }
    this.vaultFactoryContract.on(filter, (owner, vaultAddress) => this.addVault(vaultAddress, owner));
  }

  private addVault(address: string, owner: string): void {
    if (!this.discoveredVaults.has(address)) this.discoveredVaults.set(address, { address, owner });
  }

  public getVaults() { return Array.from(this.discoveredVaults.values()); }

  public stop(): void {
    this.vaultFactoryContract.removeAllListeners();
    logger.info('Stopped listening for VaultCreated events.');
  }
}