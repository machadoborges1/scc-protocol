import { PublicClient, Address, parseAbiItem } from 'viem';
import { VaultQueue } from '../queue';
import logger from '../logger';
import { config } from '../config';
import { retry } from '../rpc';
import { vaultsDiscovered } from '../metrics';

export class VaultDiscoveryService {
  private unwatch?: () => void;

  constructor(
    private publicClient: PublicClient,
    private queue: VaultQueue,
    private vaultFactoryAddress: Address,
  ) {}

  public async start(): Promise<void> {
    await this.discoverHistoricVaults();
    this.watchNewVaults();
    logger.info('VaultDiscoveryService started. Listening for new vaults...');
  }

  public stop(): void {
    if (this.unwatch) {
      this.unwatch();
    }
    logger.info('Stopped listening for VaultCreated events.');
  }

  private async discoverHistoricVaults(): Promise<void> {
    logger.info('Discovering historic vaults...');
    const filter = parseAbiItem('event VaultCreated(address indexed vaultAddress, address indexed owner)');

    try {
      const fromBlock = BigInt(config.VAULT_FACTORY_DEPLOY_BLOCK);
      const toBlock = await this.publicClient.getBlockNumber();

      logger.info(
        { address: this.vaultFactoryAddress, fromBlock: fromBlock.toString(), toBlock: toBlock.toString() },
        '>>> [DEBUG] Calling getLogs with params:',
      );

      if (fromBlock > toBlock) {
        logger.info('>>> [DEBUG] fromBlock is greater than toBlock, skipping getLogs call.');
        logger.info('No historic vaults found.');
        return;
      }

      const events = await retry(() =>
        this.publicClient.getLogs({
          address: this.vaultFactoryAddress,
          event: filter,
          fromBlock,
          toBlock,
        }),
      );

      logger.info(`>>> [DEBUG] getLogs returned with ${events.length} events.`);

      const vaultAddresses = events.map(event => event.args.vaultAddress).filter((address): address is Address => !!address);

      if (vaultAddresses.length > 0) {
        this.queue.addMany(vaultAddresses);
        vaultsDiscovered.inc(vaultAddresses.length);
        logger.info(`Discovered and enqueued ${vaultAddresses.length} historic vaults.`);
      } else {
        logger.info('No historic vaults found.');
      }
    } catch (e) {
      logger.error({ err: e }, ">>> [DEBUG] Error during discoverHistoricVaults");
    }
  }

  private watchNewVaults(): void {
    const filter = parseAbiItem('event VaultCreated(address indexed vaultAddress, address indexed owner)');

    this.unwatch = this.publicClient.watchContractEvent({
      address: this.vaultFactoryAddress,
      abi: [filter],
      onLogs: logs => {
        for (const log of logs) {
          const vaultAddress = log.args.vaultAddress;
          if (vaultAddress) {
            this.queue.add(vaultAddress);
            vaultsDiscovered.inc();
            logger.info(`Discovered new vault: ${vaultAddress}`);
          }
        }
      },
    });
  }
}