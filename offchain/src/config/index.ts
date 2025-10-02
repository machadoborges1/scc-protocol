import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  RPC_URL: z.string().url(),
  KEEPER_PRIVATE_KEY: z.string().startsWith('0x').length(66), // 0x + 64 hex chars
  VAULT_FACTORY_ADDRESS: z.string().startsWith('0x').length(42),
  LIQUIDATION_MANAGER_ADDRESS: z.string().startsWith('0x').length(42),
  ORACLE_MANAGER_ADDRESS: z.string().startsWith('0x').length(42),
  SCC_USD_ADDRESS: z.string().startsWith('0x').length(42),
  SCC_GOV_ADDRESS: z.string().startsWith('0x').length(42),
  STAKING_POOL_ADDRESS: z.string().startsWith('0x').length(42),
  TIMELOCK_CONTROLLER_ADDRESS: z.string().startsWith('0x').length(42),
  SCC_GOVERNOR_ADDRESS: z.string().startsWith('0x').length(42),
  VAULT_FACTORY_DEPLOY_BLOCK: z.coerce.number().int().min(0), // Ensure it's a non-negative integer
});

export const config = envSchema.parse(process.env);
