"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    RPC_URL: zod_1.z.string().url(),
    KEEPER_PRIVATE_KEY: zod_1.z.string().startsWith('0x').length(66), // 0x + 64 hex chars
    VAULT_FACTORY_ADDRESS: zod_1.z.string().startsWith('0x').length(42),
    LIQUIDATION_MANAGER_ADDRESS: zod_1.z.string().startsWith('0x').length(42),
    ORACLE_MANAGER_ADDRESS: zod_1.z.string().startsWith('0x').length(42),
    SCC_USD_ADDRESS: zod_1.z.string().startsWith('0x').length(42),
    SCC_GOV_ADDRESS: zod_1.z.string().startsWith('0x').length(42),
    STAKING_POOL_ADDRESS: zod_1.z.string().startsWith('0x').length(42),
    TIMELOCK_CONTROLLER_ADDRESS: zod_1.z.string().startsWith('0x').length(42),
    SCC_GOVERNOR_ADDRESS: zod_1.z.string().startsWith('0x').length(42),
    VAULT_FACTORY_DEPLOY_BLOCK: zod_1.z.coerce.number().int().min(0), // Ensure it's a non-negative integer
});
exports.config = envSchema.parse(process.env);
