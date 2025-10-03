import { ethers } from 'ethers';

import VaultFactoryABI from './abis/VaultFactory.json';
import LiquidationManagerABI from './abis/LiquidationManager.json';
import OracleManagerABI from './abis/OracleManager.json';
import SCC_GOV_ABI from './abis/SCC_GOV.json';
import SCC_GovernorABI from './abis/SCC_Governor.json';
import SCC_USD_ABI from './abis/SCC_USD.json';
import StakingPoolABI from './abis/StakingPool.json';
import TimelockControllerABI from './abis/TimelockController.json';
import VaultABI from './abis/Vault.json';

// Import mock ABIs needed for tests
import MockERC20 from './abis/MockERC20.json';
import MockV3Aggregator from './abis/MockV3Aggregator.json';

// Export interfaces for the application
export const VaultFactoryInterface = new ethers.Interface(VaultFactoryABI.abi);
export const LiquidationManagerInterface = new ethers.Interface(LiquidationManagerABI.abi);
export const OracleManagerInterface = new ethers.Interface(OracleManagerABI.abi);
export const SCC_GOV_Interface = new ethers.Interface(SCC_GOV_ABI.abi);
export const SCC_GovernorInterface = new ethers.Interface(SCC_GovernorABI.abi);
export const SCC_USD_Interface = new ethers.Interface(SCC_USD_ABI.abi);
export const StakingPoolInterface = new ethers.Interface(StakingPoolABI.abi);
export const TimelockControllerInterface = new ethers.Interface(TimelockControllerABI.abi);
export const VaultInterface = new ethers.Interface(VaultABI.abi);

// Export raw ABIs for tests
export { MockERC20, MockV3Aggregator };