import { PublicClient, WalletClient, Address, parseAbi, Account } from 'viem';
import logger from '../logger';
import { config } from '../config';
import { retry } from '../rpc';

const LIQUIDATION_MANAGER_ABI = parseAbi([
  'function vaultToAuctionId(address vault) external view returns (uint256)',
  'function startAuction(address vault) external',
]);

interface MonitoredVault {
  address: Address;
  collateralizationRatio: number;
}

/**
 * Serviço responsável por executar as liquidações.
 */
export class TransactionManagerService {
  private readonly minCr = config.MIN_CR;

  constructor(
    private publicClient: PublicClient,
    private walletClient: WalletClient,
    private account: Account,
    private liquidationManagerAddress: Address,
  ) {}

  /**
   * Inicia o leilão para um único vault insalubre.
   * @param vault O vault a ser liquidado.
   */
  public async startAuction(vaultAddress: Address): Promise<void> {
    logger.info(`Processing vault ${vaultAddress} for liquidation.`);

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

      // Simula a transação para garantir que ela não irá reverter
      const { request } = await retry(() => this.publicClient.simulateContract({
        account: this.account,
        address: this.liquidationManagerAddress,
        abi: LIQUIDATION_MANAGER_ABI,
        functionName: 'startAuction',
        args: [vaultAddress],
      }));

      // Envia a transação
      const txHash = await retry(() => this.walletClient.writeContract(request));

      logger.info(`Liquidation tx sent for ${vaultAddress}. Hash: ${txHash}`);

      // Aguarda a confirmação da transação
      const receipt = await retry(() => this.publicClient.waitForTransactionReceipt({ hash: txHash }));

      if (receipt.status !== 'success') {
        throw new Error(`Liquidation transaction failed for vault ${vaultAddress}. Receipt: ${JSON.stringify(receipt)}`);
      }

      logger.info(`Liquidation of vault ${vaultAddress} confirmed in block ${receipt.blockNumber}.`);

    } catch (error) {
      logger.error({ err: error, vault: vaultAddress }, `Failed to liquidate vault.`);
    }
  }
}
