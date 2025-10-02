import { ethers } from 'ethers';
import { config } from '../config';
import logger from '../logger';

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const GAS_PRICE_MULTIPLIER = 1.2; // 20% increase

export const provider = new ethers.JsonRpcProvider(config.RPC_URL);
export const keeperWallet = new ethers.Wallet(config.KEEPER_PRIVATE_KEY, provider);

/**
 * Retries an asynchronous function with exponential backoff.
 * @param fn The function to retry.
 * @param retries The number of retries remaining.
 * @param delay The current delay before retrying.
 * @returns The result of the function.
 */
async function retry<T>(fn: () => Promise<T>, retries = MAX_RETRIES, delay = INITIAL_RETRY_DELAY): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      logger.warn(`RPC call failed. Retrying in ${delay / 1000}s... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retry(fn, retries - 1, delay * 2);
    } else {
      logger.error(`RPC call failed after ${MAX_RETRIES} retries.`);
      throw error;
    }
  }
}

/**
 * Fetches the current gas price and applies a dynamic multiplier.
 * @returns The gas price as a BigNumber.
 */
async function getGasPrice(): Promise<bigint> {
  return retry(async () => {
    const feeData = await provider.getFeeData();
    if (!feeData.gasPrice) {
      throw new Error("Could not fetch gas price");
    }
    // Apply a multiplier to the gas price for faster inclusion
    const gasPrice = BigInt(Math.floor(Number(feeData.gasPrice) * GAS_PRICE_MULTIPLIER));
    logger.debug(`Fetched gas price: ${feeData.gasPrice.toString()}, adjusted: ${gasPrice.toString()}`);
    return gasPrice;
  });
}

export { retry, getGasPrice };