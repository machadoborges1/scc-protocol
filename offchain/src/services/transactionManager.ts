import { PublicClient, WalletClient, Address, parseAbi, Account, WaitForTransactionReceiptTimeoutError, formatGwei } from 'viem';
import logger from '../logger';
import { config } from '../config';
import { retry } from '../rpc';
import { transactionsSent, transactionsConfirmed, transactionsFailed, transactionsReplaced } from '../metrics';
import { sendAlert } from '../alerter';

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
    try {
      // Re-fetch the latest nonce before processing to avoid conflicts with manual transactions.
      this.nonce = await retry(() => this.publicClient.getTransactionCount({
        address: this.account.address,
        blockTag: 'latest',
      }));
      logger.info(`Processing vault ${vaultAddress} for liquidation with up-to-date nonce ${this.nonce}.`);
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

      // 1. Primeira tentativa
      const { maxFeePerGas, maxPriorityFeePerGas } = await retry(() => this.publicClient.estimateFeesPerGas());
      const { request } = await retry(() => this.publicClient.simulateContract({
        account: this.account,
        address: this.liquidationManagerAddress,
        abi: LIQUIDATION_MANAGER_ABI,
        functionName: 'startAuction',
        args: [vaultAddress],
        nonce: this.nonce,
        maxFeePerGas,
        maxPriorityFeePerGas,
      }));

      const txHash = await retry(() => this.walletClient.writeContract(request));
      transactionsSent.inc();
      logger.info(`Liquidation tx sent for ${vaultAddress}. Hash: ${txHash}, Nonce: ${this.nonce}`);

      try {
        const receipt = await this.publicClient.waitForTransactionReceipt({ hash: txHash, timeout: 15_000 });
        if (receipt.status === 'success') {
          transactionsConfirmed.inc();
          logger.info(`Liquidation of vault ${vaultAddress} confirmed in block ${receipt.blockNumber}.`);
        } else {
          transactionsFailed.inc();
          throw new Error(`Liquidation transaction failed for vault ${vaultAddress}. Receipt: ${JSON.stringify(receipt)}`);
        }
      } catch (error) {
        if (error instanceof WaitForTransactionReceiptTimeoutError) {
          logger.warn(`Transaction ${txHash} is stuck. Attempting to replace it.`);
          transactionsReplaced.inc();
          
          // 2. Tentativa de substituição (replace-by-fee)
          const replacementFees = await this.publicClient.estimateFeesPerGas();
          replacementFees.maxFeePerGas = (replacementFees.maxFeePerGas ?? 0n) * 120n / 100n; // Aumenta em 20%
          replacementFees.maxPriorityFeePerGas = (replacementFees.maxPriorityFeePerGas ?? 0n) * 120n / 100n;

          logger.info({ 
            newMaxFee: `${formatGwei(replacementFees.maxFeePerGas)} gwei`,
            newPriorityFee: `${formatGwei(replacementFees.maxPriorityFeePerGas)} gwei`,
          }, 'Submitting replacement transaction with higher fees.');

          const { request: replacementRequest } = await retry(() => this.publicClient.simulateContract({
            account: this.account,
            address: this.liquidationManagerAddress,
            abi: LIQUIDATION_MANAGER_ABI,
            functionName: 'startAuction',
            args: [vaultAddress],
            nonce: this.nonce, // MESMO NONCE
            maxFeePerGas: replacementFees.maxFeePerGas,
            maxPriorityFeePerGas: replacementFees.maxPriorityFeePerGas,
          }));

          const replacementTxHash = await retry(() => this.walletClient.writeContract(replacementRequest));
          transactionsSent.inc();
          logger.info(`Replacement tx sent for ${vaultAddress}. Hash: ${replacementTxHash}, Nonce: ${this.nonce}`);

          const replacementReceipt = await this.publicClient.waitForTransactionReceipt({ hash: replacementTxHash });
          if (replacementReceipt.status === 'success') {
            transactionsConfirmed.inc();
            logger.info(`Replacement for vault ${vaultAddress} confirmed in block ${replacementReceipt.blockNumber}.`);
          } else {
            transactionsFailed.inc();
            throw new Error(`Replacement transaction failed for vault ${vaultAddress}.`);
          }
        } else {
          throw error;
        }
      }

      // Se chegamos aqui, a transação (original ou substituta) foi confirmada com sucesso.
      this.nonce++;

    } catch (error) {
      const errorDetails = { err: error, vault: vaultAddress, nonce: this.nonce };
      logger.error(errorDetails, `Failed to liquidate vault.`);
      sendAlert('fatal', 'Liquidation Process Failed', errorDetails);
      // Se a simulação ou envio falhar, o nonce não foi consumido, então não o incrementamos.
    }
  }
}