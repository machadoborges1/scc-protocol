require('dotenv').config();

import { exec } from 'child_process';
import * as util from 'util';
import { createPublicClient, createWalletClient, http, getContract, Account, Abi, PublicClient, WalletClient, createTestClient, TestClient, publicActions, parseEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';
import { mine, snapshot, revert, setBalance } from 'viem/actions';

// ABI Imports
import MOCK_ERC20_ABI from '../../src/contracts/abis/MockERC20.json';
import VAULT_FACTORY_ABI from '../../src/contracts/abis/VaultFactory.json';
import VAULT_ABI from '../../src/contracts/abis/Vault.json';
import LIQUIDATION_MANAGER_ABI from '../../src/contracts/abis/LiquidationManager.json';
import MOCK_V3_AGGREGATOR_ABI from '../../src/contracts/abis/MockV3Aggregator.json';

// Service Imports
import { VaultQueue } from '../../src/queue';
import { VaultMonitorService } from '../../src/services/vaultMonitor';
import { VaultDiscoveryService } from '../../src/services/vaultDiscovery';
import { TransactionManagerService } from '../../src/services/transactionManager';
import { LiquidationStrategyService } from '../../src/services/liquidationStrategy';

jest.setTimeout(90000);

const execAsync = util.promisify(exec);

let publicClient: PublicClient & TestClient;
let user: { account: Account; client: WalletClient };
let bot: { account: Account; client: WalletClient };
let contracts: { [key: string]: `0x${string}` };
let monitorService: VaultMonitorService;
let discoveryService: VaultDiscoveryService;
let snapshotId: `0x${string}`;

const anvilUrl = 'http://127.0.0.1:8545';
const FUNDED_USER_KEY = process.env.FUNDED_USER_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bac478cbed5ef2741d5464775b25ee6"; // Default Anvil private key 1
const FUNDED_BOT_KEY = process.env.FUNDED_BOT_KEY || "0x59c6995e998f97a5a004496c12fed1a4f4557b9acde441bf3653aef665cd2109"; // Default Anvil private key 2

describe('Liquidation Integration Test', () => {
  beforeEach(async () => {
    publicClient = createTestClient({ mode: 'anvil', chain: anvil, transport: http(anvilUrl, { batch: false }) }).extend(publicActions);
    const userAccount = privateKeyToAccount(FUNDED_USER_KEY as `0x${string}`);
    const botAccount = privateKeyToAccount(FUNDED_BOT_KEY as `0x${string}`);
    user = { account: userAccount, client: createWalletClient({ account: userAccount, chain: anvil, transport: http(anvilUrl) }) as WalletClient };
    bot = { account: botAccount, client: createWalletClient({ account: botAccount, chain: anvil, transport: http(anvilUrl) }) as WalletClient };

    await setBalance(publicClient, {
      address: user.account.address,
      value: parseEther('10000'),
    });

    snapshotId = await snapshot(publicClient);

    const { stdout } = await execAsync(
      `cd ../contracts && forge script script/Deploy.s.sol:Deploy --rpc-url ${anvilUrl} --broadcast --private-key ${FUNDED_USER_KEY}`,
      { env: { ...process.env, KEEPER_ADDRESS: bot.account.address } }
    );
    contracts = {};
    stdout.split('\n').forEach((line: string) => {
      const match = line.match(/([^:]+):\s*(0x[a-fA-F0-9]{40})/);
      if (match) {
        contracts[match[1].trim()] = match[2] as `0x${string}`;
      }
    });

    console.log('Before getContract for wethContract');
    const wethContract = getContract({ address: contracts['WETH (Mock Collateral)'], abi: MOCK_ERC20_ABI.abi as unknown as Abi, client: user.client }) as any;
    console.log('After getContract for wethContract, wethContract:', wethContract);
    console.log('Before wethContract.write.mint');
    const mintHash = await wethContract.write.mint([user.account.address, 100n * 10n ** 18n]);
    await publicClient.waitForTransactionReceipt({ hash: mintHash });
  });

  afterEach(async () => {
    discoveryService?.stop();
    monitorService?.stop();
    await revert(publicClient, { id: snapshotId });
  });

  it('should discover, monitor, and liquidate an unhealthy vault', async () => {
    jest.setTimeout(90000);
    // 1. Criar Vault
    console.log('Before getContract for vaultFactory');
    const vaultFactory = getContract({ address: contracts['VaultFactory'], abi: VAULT_FACTORY_ABI.abi as unknown as Abi, client: user.client }) as any;
    console.log('After getContract for vaultFactory, vaultFactory:', vaultFactory);
    console.log('Before vaultFactory.write.createNewVault');
    const createHash = await vaultFactory.write.createNewVault();
    const createReceipt = await publicClient.waitForTransactionReceipt({ hash: createHash });
    const vaultAddress = createReceipt.logs[0].address;

    // 2. Depositar Colateral e Mintar SCC_USD
    console.log('Before getContract for weth (inside it block)');
    const weth = getContract({ address: contracts['WETH (Mock Collateral)'], abi: MOCK_ERC20_ABI.abi as unknown as Abi, client: user.client }) as any;
    console.log('After getContract for weth, weth:', weth);
    console.log('Before getContract for vault');
    const vault = getContract({ address: vaultAddress, abi: VAULT_ABI.abi as unknown as Abi, client: user.client }) as any;
    console.log('After getContract for vault, vault:', vault);

    console.log('Before weth.write.approve');
    const approveHash = await weth.write.approve([vaultAddress, 10n * 10n ** 18n]);
    await publicClient.waitForTransactionReceipt({ hash: approveHash });

    const depositHash = await vault.write.depositCollateral([10n * 10n ** 18n]);
    await publicClient.waitForTransactionReceipt({ hash: depositHash });

    const mintHash = await vault.write.mint([10000n * 10n ** 18n]);
    await publicClient.waitForTransactionReceipt({ hash: mintHash });

    // 3. Configurar e Iniciar os Serviços do Bot
    const queue = new VaultQueue();
    const transactionManager = new TransactionManagerService(publicClient, bot.client, bot.account, contracts['LiquidationManager']);
    const liquidationStrategy = new LiquidationStrategyService(transactionManager);
    monitorService = new VaultMonitorService(publicClient, queue, liquidationStrategy, contracts['OracleManager']);
    discoveryService = new VaultDiscoveryService(publicClient, queue, contracts['VaultFactory']);

    await discoveryService.start();
    monitorService.start();

    // Promessa para resolver quando a liquidação ocorrer
    const liquidationPromise = new Promise<any>((resolve) => {
      publicClient.watchContractEvent({
        address: contracts['LiquidationManager'],
        abi: LIQUIDATION_MANAGER_ABI.abi as unknown as Abi,
        eventName: 'AuctionStarted',
        onLogs: (logs: any) => {
          resolve(logs[0].args);
        },
      });
    });

    // 4. Acionar a Liquidação (baixar o preço do colateral)
    console.log('Before getContract for priceFeed');
    const priceFeed = getContract({ address: contracts['WETH/USD Price Feed (Mock)'], abi: MOCK_V3_AGGREGATOR_ABI.abi as unknown as Abi, client: user.client }) as any;
    console.log('After getContract for priceFeed, priceFeed:', priceFeed);
    try {
      console.log('Before priceFeed.write.updateAnswer');
      const updateHash = await priceFeed.write.updateAnswer([700n * 10n ** 8n], { account: user.account });
      await publicClient.waitForTransactionReceipt({ hash: updateHash });
    } catch (e) {
      console.error('Error updating price feed:', e);
      throw e; // Re-throw to fail the test explicitly
    }

    // 5. Aguardar e Verificar
    const result = await liquidationPromise;
    expect(result.auctionId).toBe(1n);
    expect(result.vault).toBe(vaultAddress);
  });
});
