import { PublicClient, Address, parseAbiItem } from 'viem';
import { VaultQueue } from '../queue';
import logger from '../logger';
import { config } from '../config';
import { retry } from '../rpc';
import { vaultsDiscovered } from '../metrics';

export class VaultDiscoveryService {
  private unwatch?: () => void;
  private isRunning = false;

  constructor(
    private publicClient: PublicClient,
    private queue: VaultQueue,
    private vaultFactoryAddress: Address,
  ) {}

  public async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('VaultDiscoveryService is already running.');
      return;
    }
    this.isRunning = true;
    await this.discoverHistoricVaults();
    this.watchNewVaults();
    logger.info('VaultDiscoveryService started. Listening for new vaults...');
  }

  public stop(): void {
    this.isRunning = false;
    if (this.unwatch) {
      this.unwatch();
    }
    logger.info('Stopped listening for VaultCreated events.');
  }

  private async discoverHistoricVaults(): Promise<void> {
    logger.info('[VAULT DISCOVERY] Starting historic vault discovery...');
    const filter = parseAbiItem('event VaultCreated(address indexed vaultAddress, address indexed owner)');

    try {
      // Configuration log
      logger.info(`[VAULT DISCOVERY] Reading config: VAULT_FACTORY_DEPLOY_BLOCK = ${config.VAULT_FACTORY_DEPLOY_BLOCK}`);
      const fromBlock = BigInt(config.VAULT_FACTORY_DEPLOY_BLOCK);

      // Robust waiting loop
      let toBlock = 0n;
      logger.info(`[VAULT DISCOVERY] Waiting for RPC node at ${config.RPC_URL} to be ready...`);
      while (this.isRunning) {
          try {
            toBlock = await this.publicClient.getBlockNumber();
            logger.info(`[VAULT DISCOVERY] RPC call successful. Current block number: ${toBlock}`);
            
            if (toBlock >= fromBlock) {
                logger.info(`[VAULT DISCOVERY] Block number ${toBlock} is valid and past the deployment block ${fromBlock}. Proceeding.`);
                break;
            }
            logger.warn(`[VAULT DISCOVERY] RPC is ready, but current block ${toBlock} is before deployment block ${fromBlock}. Waiting for node to sync...`);

          } catch (rpcError) {
            logger.error({ err: rpcError }, `[VAULT DISCOVERY] RPC error while getting block number. Retrying...`);
          }
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      }

      if (!this.isRunning) {
        logger.info('[VAULT DISCOVERY] Service stopped while waiting for block number.');
        return;
      }

      logger.info(
        { address: this.vaultFactoryAddress, fromBlock: fromBlock.toString(), toBlock: toBlock.toString() },
        '[VAULT DISCOVERY] Executing getLogs...',
      );

      const events = await retry(() =>
        this.publicClient.getLogs({
          address: this.vaultFactoryAddress,
          event: filter,
          fromBlock,
          toBlock,
        }),
      );

      logger.info(`[VAULT DISCOVERY] getLogs returned with ${events.length} events.`);

      const vaultAddresses = events.map(event => event.args.vaultAddress).filter((address): address is Address => !!address);

      if (vaultAddresses.length > 0) {
        this.queue.addMany(vaultAddresses);
        vaultsDiscovered.inc(vaultAddresses.length);
        logger.info(`[VAULT DISCOVERY] Discovered and enqueued ${vaultAddresses.length} historic vaults.`);
      } else {
        logger.info('[VAULT DISCOVERY] No historic vaults found in the scanned range.');
      }
    } catch (e) {
      logger.error({ err: e }, "[VAULT DISCOVERY] A critical error occurred during historic vault discovery.");
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