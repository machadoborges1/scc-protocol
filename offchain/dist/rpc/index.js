"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.keeperWallet = exports.provider = void 0;
exports.retry = retry;
exports.getGasPrice = getGasPrice;
const ethers_1 = require("ethers");
const config_1 = require("../config");
const logger_1 = __importDefault(require("../logger"));
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const GAS_PRICE_MULTIPLIER = 1.2; // 20% increase
exports.provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.RPC_URL);
exports.keeperWallet = new ethers_1.ethers.Wallet(config_1.config.KEEPER_PRIVATE_KEY, exports.provider);
/**
 * Retries an asynchronous function with exponential backoff.
 * @param fn The function to retry.
 * @param retries The number of retries remaining.
 * @param delay The current delay before retrying.
 * @returns The result of the function.
 */
async function retry(fn, retries = MAX_RETRIES, delay = INITIAL_RETRY_DELAY) {
    try {
        return await fn();
    }
    catch (error) {
        if (retries > 0) {
            logger_1.default.warn(`RPC call failed. Retrying in ${delay / 1000}s... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return retry(fn, retries - 1, delay * 2);
        }
        else {
            logger_1.default.error(`RPC call failed after ${MAX_RETRIES} retries.`);
            throw error;
        }
    }
}
/**
 * Fetches the current gas price and applies a dynamic multiplier.
 * @returns The gas price as a BigNumber.
 */
async function getGasPrice() {
    return retry(async () => {
        const feeData = await exports.provider.getFeeData();
        if (!feeData.gasPrice) {
            throw new Error("Could not fetch gas price");
        }
        // Apply a multiplier to the gas price for faster inclusion
        const gasPrice = BigInt(Math.floor(Number(feeData.gasPrice) * GAS_PRICE_MULTIPLIER));
        logger_1.default.debug(`Fetched gas price: ${feeData.gasPrice.toString()}, adjusted: ${gasPrice.toString()}`);
        return gasPrice;
    });
}
