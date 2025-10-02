"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.vaultDiscoveryService = void 0;
const ethers_1 = require("ethers");
const rpc_1 = require("../rpc");
const abis_1 = require("../contracts/abis");
const config_1 = require("../config");
const logger_1 = __importDefault(require("../logger"));
class VaultDiscoveryService {
    constructor() {
        this.discoveredVaults = new Map();
        this.vaultFactoryContract = new ethers_1.ethers.Contract(config_1.config.VAULT_FACTORY_ADDRESS, abis_1.VaultFactoryInterface, rpc_1.provider);
        this.lastProcessedBlock = config_1.config.VAULT_FACTORY_DEPLOY_BLOCK;
    }
    async start() {
        logger_1.default.info('Starting Vault Discovery Service...');
        await this.fetchHistoricalVaults();
        this.subscribeToNewVaults();
        logger_1.default.info(`Discovered ${this.discoveredVaults.size} vaults.`);
    }
    async fetchHistoricalVaults() {
        logger_1.default.info(`Fetching historical VaultCreated events from block ${this.lastProcessedBlock}...`);
        const filter = this.vaultFactoryContract.filters.VaultCreated();
        const events = await (0, rpc_1.retry)(() => this.vaultFactoryContract.queryFilter(filter, this.lastProcessedBlock, 'latest'));
        for (const event of events) {
            const eventLog = event; // Cast to EventLog to access args
            if (eventLog.args) {
                const vaultAddress = eventLog.args[0];
                const owner = eventLog.args[1];
                this.addVault({
                    address: vaultAddress,
                    owner,
                });
            }
        }
        this.lastProcessedBlock = (await rpc_1.provider.getBlockNumber()) + 1;
        logger_1.default.info(`Finished fetching historical vaults. Total discovered: ${this.discoveredVaults.size}`);
    }
    subscribeToNewVaults() {
        logger_1.default.info('Subscribing to new VaultCreated events...');
        this.vaultFactoryContract.on('VaultCreated', (vaultAddress, owner, event) => {
            logger_1.default.info(`New VaultCreated event detected: ${vaultAddress}`);
            this.addVault({
                address: vaultAddress,
                owner,
            });
            this.lastProcessedBlock = event.blockNumber + 1;
        });
    }
    addVault(vaultInfo) {
        if (!this.discoveredVaults.has(vaultInfo.address)) {
            this.discoveredVaults.set(vaultInfo.address, vaultInfo);
            logger_1.default.debug(`Added new vault: ${vaultInfo.address}`);
        }
    }
    getVaults() {
        return Array.from(this.discoveredVaults.values());
    }
}
exports.vaultDiscoveryService = new VaultDiscoveryService();
