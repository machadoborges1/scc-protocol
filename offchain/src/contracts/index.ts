import { ethers } from 'ethers';
import { config } from '../config';
import { provider, keeperWallet } from '../rpc';
import {
  VaultFactoryInterface,
  LiquidationManagerInterface,
  OracleManagerInterface,
  SCC_USD_Interface,
  SCC_GOV_Interface,
  StakingPoolInterface,
  TimelockControllerInterface,
  SCC_GovernorInterface,
  VaultInterface, // Although Vaults are created dynamically, we need its ABI
} from './abis';

// Read-only contract instances (connected to provider)
export const vaultFactoryContract = new ethers.Contract(
  config.VAULT_FACTORY_ADDRESS,
  VaultFactoryInterface,
  provider
);

export const liquidationManagerContract = new ethers.Contract(
  config.LIQUIDATION_MANAGER_ADDRESS,
  LiquidationManagerInterface,
  provider
);

export const oracleManagerContract = new ethers.Contract(
  config.ORACLE_MANAGER_ADDRESS,
  OracleManagerInterface,
  provider
);

export const sccUsdContract = new ethers.Contract(
  config.SCC_USD_ADDRESS,
  SCC_USD_Interface,
  provider
);

export const sccGovContract = new ethers.Contract(
  config.SCC_GOV_ADDRESS,
  SCC_GOV_Interface,
  provider
);

export const stakingPoolContract = new ethers.Contract(
  config.STAKING_POOL_ADDRESS,
  StakingPoolInterface,
  provider
);

export const timelockControllerContract = new ethers.Contract(
  config.TIMELOCK_CONTROLLER_ADDRESS,
  TimelockControllerInterface,
  provider
);

export const sccGovernorContract = new ethers.Contract(
  config.SCC_GOVERNOR_ADDRESS,
  SCC_GovernorInterface,
  provider
);

// Writable contract instances (connected to keeperWallet)
export const vaultFactoryContract_RW = new ethers.Contract(
  config.VAULT_FACTORY_ADDRESS,
  VaultFactoryInterface,
  keeperWallet
);

export const liquidationManagerContract_RW = new ethers.Contract(
  config.LIQUIDATION_MANAGER_ADDRESS,
  LiquidationManagerInterface,
  keeperWallet
);

// Function to get a Vault contract instance dynamically
export const getVaultContract = (address: string) => {
  return new ethers.Contract(address, VaultInterface, provider);
};

export const getVaultContract_RW = (address: string) => {
  return new ethers.Contract(address, VaultInterface, keeperWallet);
};