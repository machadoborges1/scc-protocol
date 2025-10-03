import { ethers } from 'ethers';
import { config } from '../config';
import * as abis from './abis';

// This file now only exports a factory function to avoid side-effects on import.

export function createContracts(provider: ethers.Provider, signer: ethers.Signer) {
  const liquidationManagerContract = new ethers.Contract(config.LIQUIDATION_MANAGER_ADDRESS, abis.LiquidationManagerInterface, provider);

  return {
    vaultFactoryContract: new ethers.Contract(config.VAULT_FACTORY_ADDRESS, abis.VaultFactoryInterface, provider),
    oracleManagerContract: new ethers.Contract(config.ORACLE_MANAGER_ADDRESS, abis.OracleManagerInterface, provider),
    liquidationManagerContract_RW: liquidationManagerContract.connect(signer) as ethers.Contract,
    getVaultContract: (address: string) => new ethers.Contract(address, abis.VaultInterface, provider),
  };
}
