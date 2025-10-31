import { createPublicClient as createViemPublicClient, createWalletClient as createViemWalletClient, http, webSocket, PublicClient, WalletClient } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';
import { config } from '../config';
import logger from '../logger';

/**
 * Creates a Viem public client to interact with the blockchain (read-only).
 * @returns A PublicClient instance.
 */
export function createPublicClient(): PublicClient {
  const wsUrl = config.RPC_URL.replace('http', 'ws');
chain: anvil, // or the correct chain from the configuration
    transport: webSocket(wsUrl),
  });
}

/**
 * Creates a Viem wallet client to send transactions.
 * @param publicClient The public client to connect the wallet to.
 * @returns A WalletClient instance and the associated account.
 */
export function createWalletClient(publicClient: PublicClient): { account: any; walletClient: WalletClient } {
  const account = privateKeyToAccount(config.KEEPER_PRIVATE_KEY as `0x${string}`);
  const walletClient = createViemWalletClient({
    account,
    chain: anvil, // or the correct chain from the configuration
    transport: http(config.RPC_URL),
  });
  return { account, walletClient };
}

/**
 * Retries an asynchronous function with exponential backoff in case of failure.
 * @param fn The asynchronous function to be executed.
 * @returns A promise that resolves with the return value of the executed function.
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