import { PublicClient, WalletClient, Address, parseAbi, Account } from 'viem';
import logger from '../logger';
import { config } from '../config';
import { retry } from '../rpc';

const LIQUIDATION_MANAGER_ABI = parseAbi([
  'function vaultToAuctionId(address vault) external view returns (uint256)',
  'function startAuction(address vault) external',
]);

/**
 * Serviço responsável por executar as liquidações com gerenciamento de nonce.
 */
export class TransactionManagerService {
  private nonce: number = 0;

  constructor(
    private publicClient: PublicClient,
    private walletClient: WalletClient,
    private account: Account,
    private liquidationManagerAddress: Address,
  ) {}

  /**
   * Inicializa o serviço buscando o nonce atual da conta.
   */
  public async initialize(): Promise<void> {
    this.nonce = await retry(() => this.publicClient.getTransactionCount({
      address: this.account.address,
      blockTag: 'latest',
    }));
    logger.info(`TransactionManager initialized with nonce ${this.nonce}`);
  }

  /**
   * Inicia o leilão para um único vault insalubre.
   * @param vaultAddress O endereço do vault a ser liquidado.
   */
  public async startAuction(vaultAddress: Address): Promise<void> {
    logger.info(`Processing vault ${vaultAddress} for liquidation with nonce ${this.nonce}.`);

    try {
      const activeAuctionId = await retry(() => this.publicClient.readContract({
        address: this.liquidationManagerAddress,
        abi: LIQUIDATION_MANAGER_ABI,
        functionName: 'vaultToAuctionId',
        args: [vaultAddress],
      }));

      if (activeAuctionId !== 0n) {
        logger.info(`Auction for vault ${vaultAddress} is already active (ID: ${activeAuctionId}). Skipping.`);
        return;
      }

      logger.warn(`Vault ${vaultAddress} is unhealthy! Initiating liquidation...`);

      // Estima as taxas de gás dinâmicas (EIP-1559)
      const { maxFeePerGas, maxPriorityFeePerGas } = await retry(() => this.publicClient.estimateFeesPerGas());

      // Simula a transação para garantir que ela não irá reverter
      const { request } = await retry(() => this.publicClient.simulateContract({
        account: this.account,
        address: this.liquidationManagerAddress,
        abi: LIQUIDATION_MANAGER_ABI,
        functionName: 'startAuction',
        args: [vaultAddress],
        nonce: this.nonce, // Gerenciamento de nonce explícito
        maxFeePerGas,
        maxPriorityFeePerGas,
      }));

      // Envia a transação
      const txHash = await retry(() => this.walletClient.writeContract(request));
      logger.info(`Liquidation tx sent for ${vaultAddress}. Hash: ${txHash}, Nonce: ${this.nonce}`);

      // Incrementa o nonce localmente IMEDIATAMENTE após o envio bem-sucedido
      this.nonce++;

      // Aguarda a confirmação da transação
      const receipt = await retry(() => this.publicClient.waitForTransactionReceipt({ hash: txHash }));

      if (receipt.status !== 'success') {
        // Em um cenário real, poderíamos ter uma lógica para reenviar a transação com o mesmo nonce
        throw new Error(`Liquidation transaction failed for vault ${vaultAddress}. Receipt: ${JSON.stringify(receipt)}`);
      }

      logger.info(`Liquidation of vault ${vaultAddress} confirmed in block ${receipt.blockNumber}.`);

    } catch (error) {
      logger.error({ err: error, vault: vaultAddress, nonce: this.nonce }, `Failed to liquidate vault.`);
      // Se a simulação ou envio falhar, o nonce não foi consumido, então não o incrementamos.
      // Uma lógica mais avançada poderia resetar o nonce buscando-o da rede novamente.
    }
  }
}
