import { createPublicClient as createViemPublicClient, createWalletClient as createViemWalletClient, http, PublicClient, WalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';
import { config } from '../config';
import logger from '../logger';

/**
 * Cria um cliente público Viem para interagir com a blockchain (leitura).
 * @returns Uma instância de PublicClient.
 */
export function createPublicClient(): PublicClient {
  return createViemPublicClient({
    chain: anvil, // ou a chain correta da configuração
    transport: http(config.RPC_URL, { batch: false }),
  });
}

/**
 * Cria um cliente de carteira Viem para enviar transações.
 * @param publicClient O cliente público para conectar a carteira.
 * @returns Uma instância de WalletClient e a conta associada.
 */
export function createWalletClient(publicClient: PublicClient): { account: any; walletClient: WalletClient } {
  const account = privateKeyToAccount(config.KEEPER_PRIVATE_KEY as `0x${string}`);
  const walletClient = createViemWalletClient({
    account,
    chain: anvil, // ou a chain correta da configuração
    transport: http(config.RPC_URL),
  });
  return { account, walletClient };
}

/**
 * Tenta novamente uma função assíncrona com backoff exponencial em caso de falha.
 * @param fn A função assíncrona a ser executada.
 * @returns Uma promessa que resolve com o valor de retorno da função executada.
 */
export async function retry<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; i < config.MAX_RETRIES; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === config.MAX_RETRIES - 1) {
        logger.error({ err: error }, `RPC call failed after ${config.MAX_RETRIES} retries.`);
        throw error;
      }
      const delay = (config.BASE_DELAY_MS * (2 ** i)) + Math.floor(Math.random() * 1000);
      logger.warn(`RPC call failed. Retrying in ${delay}ms (attempt ${i + 1}/${config.MAX_RETRIES})...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw new Error('Retry logic failed unexpectedly.');
}