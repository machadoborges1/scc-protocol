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
  VAULT_FACTORY_DEPLOY_BLOCK: z.coerce.number().int().min(0), // Garante que seja um inteiro não negativo

  // Configurações do Bot
  MIN_CR: z.coerce.number().positive().default(150), // MCR em porcentagem (ex: 150 para 150%)
  POLL_INTERVAL_MS: z.coerce.number().int().positive().default(5000), // 5 segundos
  MAX_GAS_PRICE_GWEI: z.coerce.number().positive().default(100),

  // Limite mínimo de saldo em ETH para o keeper antes de enviar um alerta
  MIN_KEEPER_ETH_BALANCE: z.coerce.number().positive().default(0.5),

  // Feature flag para usar multicall
  USE_MULTICALL: z.string().default('true').transform(val => val === 'true'),

  // Configurações de Retry
  MAX_RETRIES: z.coerce.number().int().min(0).default(5),
  BASE_DELAY_MS: z.coerce.number().int().positive().default(1000), // 1 segundo
});

export const config = envSchema.parse(process.env);
