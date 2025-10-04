import { ethers } from 'ethers';
import { config } from '../config';
import logger from '../logger';

// This file now only exports factory functions to avoid side-effects on import.

/**
 * Creates a new JSON-RPC provider connected to the configured RPC_URL.
 * @returns A new instance of ethers.JsonRpcProvider.
 */
export function createProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(config.RPC_URL);
}

/**
 * Creates a wallet instance for the keeper using the configured private key.
 * @param provider The ethers Provider to connect the wallet to.
 * @returns A new ethers.Wallet instance for the keeper.
 */
export function createKeeperWallet(provider: ethers.Provider): ethers.Wallet {
  return new ethers.Wallet(config.KEEPER_PRIVATE_KEY, provider);
}

/**
 * Retries an async function with exponential backoff in case of failure.
 * @param fn The async function to execute.
 * @returns A promise that resolves with the return value of the executed function.
 */
export async function retry<T>(fn: () => Promise<T>): Promise<T> {
  const MAX_RETRIES = 5;
  const BASE_DELAY_MS = 1000;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === MAX_RETRIES - 1) {
        logger.error(error, `RPC call failed after ${MAX_RETRIES} retries.`);
        throw error;
      }
      // Exponential backoff with jitter
      const delay = (BASE_DELAY_MS * (2 ** i)) + Math.floor(Math.random() * 1000);
      logger.warn(`RPC call failed. Retrying in ${delay}ms (attempt ${i + 1}/${MAX_RETRIES})...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw new Error('Retry logic failed');
}

/**
 * Fetches the current gas price from the provider.
 * @param provider The ethers Provider to fetch the gas price from.
 * @returns A promise that resolves with the current gas price as a bigint.
 */
export async function getGasPrice(provider: ethers.Provider): Promise<bigint> {
  const feeData = await provider.getFeeData();
  if (!feeData.gasPrice) throw new Error("Could not fetch gas price");
  return feeData.gasPrice;
}
