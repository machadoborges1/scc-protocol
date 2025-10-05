import { exec } from 'child_process';
import { ethers, Wallet } from 'ethers';
import * as util from 'util';
import * as abis from '../../src/contracts/abis';
import { runOnce } from '../../src/index';
import { VaultDiscoveryService } from '../../src/services/vaultDiscovery';
import { VaultMonitorService } from '../../src/services/vaultMonitor';
import { LiquidationAgentService } from '../../src/services/liquidationAgent';
import logger from '../../src/logger';

const execAsync = util.promisify(exec);
const anvilUrl = 'http://127.0.0.1:8545';

// Use the actual pre-funded anvil keys from environment variables
const FUNDED_USER_KEY = process.env.ANVIL_KEY_1!;
const FUNDED_BOT_KEY = process.env.ANVIL_KEY_2!;

describe('Integration: Bot Liquidation Flow', () => {
  let provider: ethers.JsonRpcProvider;
  let user: Wallet;
  let bot: Wallet;
  let contracts: Record<string, string> = {};
  let discovery: VaultDiscoveryService;

  jest.setTimeout(90000);

  beforeEach(async () => {
    provider = new ethers.JsonRpcProvider(anvilUrl);
    user = new Wallet(FUNDED_USER_KEY, provider);
    bot = new Wallet(FUNDED_BOT_KEY, provider);

    await provider.send('anvil_reset', []);

    const { stdout } = await execAsync(
      `cd ../contracts && forge script script/Deploy.s.sol:Deploy --rpc-url ${anvilUrl} --broadcast --private-key ${user.privateKey}`,
      { env: { ...process.env, KEEPER_ADDRESS: bot.address } }
    );
    contracts = {};
    stdout.split('\n').forEach(line => {
      const [key, value] = line.split(':').map(s => s.trim());
      if (key && value && key.length < 30) contracts[key] = value;
    });

    // --- FIX: Re-initialize user wallet to refresh its nonce after forge script ---
    user = new Wallet(FUNDED_USER_KEY, provider);
    // --- END FIX ---

    const wethContract = new ethers.Contract(contracts['WETH (Mock Collateral)'], abis.MockERC20.abi, user);
    await (await wethContract.mint(user.address, ethers.parseEther('100'))).wait();
  });

  afterAll(() => {
    if (discovery) {
      discovery.stop();
    }
  });

  it('should liquidate an unhealthy vault', async () => {
    // --- FIX: Re-synchronize user wallet at the start of the it block to ensure latest nonce ---
    user = await provider.getSigner(user.address) as unknown as Wallet; // Use getSigner to re-sync
    // --- END FIX ---

    // Step 1: Create Vault
    const vaultFactory = new ethers.Contract(contracts['VaultFactory'], abis.VaultFactoryInterface, user);
    const createTx = await vaultFactory.createNewVault();
    const receipt = await createTx.wait();
    const vaultCreatedEvent = receipt!.logs.find((log: ethers.Log | ethers.EventLog): log is ethers.EventLog => log instanceof ethers.EventLog && log.eventName === 'VaultCreated');
    if (!vaultCreatedEvent) throw new Error('VaultCreated event not found');
    const vaultAddress = vaultCreatedEvent.args[0];

    // Step 2: Approve and Deposit Collateral
    const weth = new ethers.Contract(contracts['WETH (Mock Collateral)'], abis.MockERC20.abi, user);
    await (await weth.approve(vaultAddress, ethers.parseEther('10'))).wait();
    
    const vault = new ethers.Contract(vaultAddress, abis.VaultInterface, user);
    await (await vault.depositCollateral(ethers.parseEther('10'))).wait();

    // Step 3: Mint SCC_USD
    await (await vault.mint(ethers.parseEther('10000'))).wait();

    // --- DEBUG BOT INFO START ---
    console.log(`🔍 [DEBUG TEST] Bot Address: ${bot.address}`);
    console.log(`🔍 [DEBUG TEST] Bot Nonce: ${await bot.getNonce()}`);
    // --- DEBUG BOT INFO END ---

    // Step 4: Run Bot Logic
    const liquidationManager = new ethers.Contract(contracts['LiquidationManager'], abis.LiquidationManagerInterface, provider).connect(bot) as ethers.Contract;
    const agent = new LiquidationAgentService(liquidationManager, logger);

    const vaultFactoryForDiscovery = new ethers.Contract(contracts['VaultFactory'], abis.VaultFactoryInterface, user);
    discovery = new VaultDiscoveryService(vaultFactoryForDiscovery, provider);
    
    const oracleManagerForMonitor = new ethers.Contract(contracts['OracleManager'], abis.OracleManagerInterface, bot); // Connect OracleManager for monitor to bot
    const monitor = new VaultMonitorService(oracleManagerForMonitor, (addr) => new ethers.Contract(addr, abis.VaultInterface, provider));
    
    const liquidationManagerForEvents = new ethers.Contract(contracts['LiquidationManager'], abis.LiquidationManagerInterface, provider);
    await discovery.start();
    const liquidationPromise = new Promise<any>(resolve => {
      liquidationManagerForEvents.once('AuctionStarted', (id) => resolve({ id }));
    });

    // --- DEBUG CONTRACT INFO START ---
    console.log('🔍 [DEBUG] Verificando contrato liquidationManager:');
    console.log('🔍 [DEBUG] liquidationManager:', liquidationManager);
    console.log('🔍 [DEBUG] liquidationManager.signer:', liquidationManager.signer);
    console.log('🔍 [DEBUG] liquidationManager.runner:', liquidationManager.runner);
    console.log('🔍 [DEBUG] liquidationManager.target:', liquidationManager.target);

    if (liquidationManager.signer) {
      // We can't call getAddress() or getNonce() here due to TypeScript error, but we can see the object
      console.log('🔍 [DEBUG] Signer object is present.');
    }
    // --- DEBUG CONTRACT INFO END ---

    // Step 5: Trigger Liquidation by dropping price
    const priceFeed = new ethers.Contract(contracts['WETH/USD Price Feed (Mock)'], abis.MockV3Aggregator.abi, user);
    await (await priceFeed.updateAnswer(ethers.parseUnits('700', 8))).wait();
    
    // Step 6: Run the bot's main loop once
    await runOnce({ discovery, monitor, agent });

    // Assert
    const result = await liquidationPromise;
    expect(result.id).toBe(1n);
  });
});