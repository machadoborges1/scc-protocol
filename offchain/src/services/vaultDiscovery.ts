import { PublicClient, Address, parseAbiItem } from 'viem';
import { VaultQueue } from '../queue';
import logger from '../logger';
import { config } from '../config';
import { retry } from '../rpc';

/**
 * Serviço para descobrir Vaults existentes e novos na blockchain.
 * Atua como um "Produtor", adicionando os endereços dos Vaults a uma fila para processamento posterior.
 */
export class VaultDiscoveryService {
  private unwatch?: () => void;

  constructor(
    private publicClient: PublicClient,
    private queue: VaultQueue,
    private vaultFactoryAddress: Address,
  ) {}

  /**
   * Inicia o serviço. Busca todos os vaults históricos e começa a escutar por novos.
   */
  public async start(): Promise<void> {
    await this.discoverHistoricVaults();
    this.watchNewVaults();
    logger.info('VaultDiscoveryService started. Listening for new vaults...');
  }

  /**
   * Para o serviço, interrompendo a escuta por novos eventos.
   */
  public stop(): void {
    if (this.unwatch) {
      this.unwatch();
    }
    logger.info('Stopped listening for VaultCreated events.');
  }

  /**
   * Busca todos os eventos VaultCreated desde o bloco de deploy da fábrica
   * e adiciona os endereços dos vaults à fila.
   */
  private async discoverHistoricVaults(): Promise<void> {
    logger.info('Discovering historic vaults...');
    const filter = parseAbiItem('event VaultCreated(address indexed owner, address indexed vaultAddress)');

    const events = await retry(() => this.publicClient.getLogs({
      address: this.vaultFactoryAddress,
      event: filter,
      fromBlock: BigInt(config.VAULT_FACTORY_DEPLOY_BLOCK),
    }));

    const vaultAddresses = events.map(event => event.args.vaultAddress).filter((address): address is Address => !!address);

    if (vaultAddresses.length > 0) {
      this.queue.addMany(vaultAddresses);
      logger.info(`Discovered and enqueued ${vaultAddresses.length} historic vaults.`);
    } else {
      logger.info('No historic vaults found.');
    }
  }

  /**
   * Inicia a escuta por novos eventos VaultCreated.
   */
  private watchNewVaults(): void {
    console.log('Setting up watchContractEvent...');
    const filter = parseAbiItem('event VaultCreated(address indexed owner, address indexed vaultAddress)');

    this.unwatch = this.publicClient.watchContractEvent({
      address: this.vaultFactoryAddress,
      abi: [filter],
      onLogs: logs => {
        for (const log of logs) {
          const vaultAddress = log.args.vaultAddress;
          if (vaultAddress) {
            this.queue.add(vaultAddress);
            logger.info(`Discovered new vault: ${vaultAddress}`);
          }
        }
      },
    });
  }
}
