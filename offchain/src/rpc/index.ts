import { ethers } from 'ethers';
import { config } from '../config';
import logger from '../logger';

// This file now only exports factory functions to avoid side-effects on import.

export function createProvider(): ethers.JsonRpcProvider {
  return new ethers.JsonRpcProvider(config.RPC_URL);
}

export function createKeeperWallet(provider: ethers.Provider): ethers.Wallet {
  return new ethers.Wallet(config.KEEPER_PRIVATE_KEY, provider);
}

export async function retry<T>(fn: () => Promise<T>): Promise<T> {
  const MAX_RETRIES = 5;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === MAX_RETRIES - 1) {
        logger.error(error, `RPC call failed after ${MAX_RETRIES} retries.`);
        throw error;
      }
      await new Promise(res => setTimeout(res, 1000 * (i + 1)));
    }
  }
  throw new Error('Retry logic failed');
}

export async function getGasPrice(provider: ethers.Provider): Promise<bigint> {
  const feeData = await provider.getFeeData();
  if (!feeData.gasPrice) throw new Error("Could not fetch gas price");
  return feeData.gasPrice;
}
