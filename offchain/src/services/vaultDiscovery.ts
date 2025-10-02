import { ethers } from 'ethers';
import { provider, retry } from '../rpc';
import { VaultFactoryInterface } from '../contracts/abis';
import { config } from '../config';
import logger from '../logger';

interface VaultInfo {
  address: string;
  owner: string;
}

class VaultDiscoveryService {
  private vaultFactoryContract: ethers.Contract;
  private discoveredVaults: Map<string, VaultInfo> = new Map();
  private lastProcessedBlock: number;

  constructor() {
    this.vaultFactoryContract = new ethers.Contract(
      config.VAULT_FACTORY_ADDRESS,
      VaultFactoryInterface,
      provider
    );
    this.lastProcessedBlock = config.VAULT_FACTORY_DEPLOY_BLOCK;
  }

  public async start(): Promise<void> {
    logger.info('Starting Vault Discovery Service...');
    await this.fetchHistoricalVaults();
    this.subscribeToNewVaults();
    logger.info(`Discovered ${this.discoveredVaults.size} vaults.`);
  }

  private async fetchHistoricalVaults(): Promise<void> {
    logger.info(`Fetching historical VaultCreated events from block ${this.lastProcessedBlock}...`);
    const filter = this.vaultFactoryContract.filters.VaultCreated();

    const events = await retry(() =>
      this.vaultFactoryContract.queryFilter(filter, this.lastProcessedBlock, 'latest')
    );

    for (const event of events) {
      const eventLog = event as ethers.EventLog; // Cast to EventLog to access args
      if (eventLog.args) {
        const vaultAddress = eventLog.args[0];
        const owner = eventLog.args[1];
        this.addVault({
          address: vaultAddress,
          owner,
        });
      }
    }
    this.lastProcessedBlock = (await provider.getBlockNumber()) + 1;
    logger.info(`Finished fetching historical vaults. Total discovered: ${this.discoveredVaults.size}`);
  }

  private subscribeToNewVaults(): void {
    logger.info('Subscribing to new VaultCreated events...');
    this.vaultFactoryContract.on('VaultCreated', (vaultAddress, owner, event) => {
      logger.info(`New VaultCreated event detected: ${vaultAddress}`);
      this.addVault({
        address: vaultAddress,
        owner,
      });
      this.lastProcessedBlock = event.blockNumber + 1;
    });
  }

  private addVault(vaultInfo: VaultInfo): void {
    if (!this.discoveredVaults.has(vaultInfo.address)) {
      this.discoveredVaults.set(vaultInfo.address, vaultInfo);
      logger.debug(`Added new vault: ${vaultInfo.address}`);
    }
  }

  public getVaults(): VaultInfo[] {
    return Array.from(this.discoveredVaults.values());
  }
}

export const vaultDiscoveryService = new VaultDiscoveryService();
