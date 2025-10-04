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
      `cd ../contracts && forge script script/Deploy.s.sol:Deploy --rpc-url ${anvilUrl} --broadcast --private-key ${user.privateKey}`
    );
    contracts = {};
    stdout.split('\n').forEach(line => {
      const [key, value] = line.split(':').map(s => s.trim());
      if (key && value && key.length < 30) contracts[key] = value;
    });

    const wethContract = new ethers.Contract(contracts['WETH (Mock Collateral)'], abis.MockERC20.abi, user);
    // The first transaction from the user account after reset will have nonce 0, but let's be explicit.
    const nonce = await user.getNonce();
    await (await wethContract.mint(user.address, ethers.parseEther('100'), { nonce })).wait();
  });

  afterAll(() => {
    if (discovery) {
      discovery.stop();
    }
  });

  it('should liquidate an unhealthy vault', async () => {
    // Start nonce management for the user wallet in this test
    let userNonce = await user.getNonce();

    // Step 1: Create Vault
    const vaultFactory = new ethers.Contract(contracts['VaultFactory'], abis.VaultFactoryInterface, user);
    const createTx = await vaultFactory.createNewVault({ nonce: userNonce++ });
    const receipt = await createTx.wait();
    const vaultCreatedEvent = receipt!.logs.find((log: ethers.Log | ethers.EventLog): log is ethers.EventLog => log instanceof ethers.EventLog && log.eventName === 'VaultCreated');
    if (!vaultCreatedEvent) throw new Error('VaultCreated event not found');
    const vaultAddress = vaultCreatedEvent.args[0];

    // Step 2: Approve and Deposit Collateral
    const weth = new ethers.Contract(contracts['WETH (Mock Collateral)'], abis.MockERC20.abi, user);
    await (await weth.approve(vaultAddress, ethers.parseEther('10'), { nonce: userNonce++ })).wait();
    
    const vault = new ethers.Contract(vaultAddress, abis.VaultInterface, user);
    await (await vault.depositCollateral(ethers.parseEther('10'), { nonce: userNonce++ })).wait();

    // Step 3: Mint SCC_USD
    await (await vault.mint(ethers.parseEther('10000'), { nonce: userNonce++ })).wait();

    // Step 4: Run Bot Logic
    const vaultFactoryForDiscovery = new ethers.Contract(contracts['VaultFactory'], abis.VaultFactoryInterface, user);
    discovery = new VaultDiscoveryService(vaultFactoryForDiscovery, provider);
    
    const oracleManagerForMonitor = new ethers.Contract(contracts['OracleManager'], abis.OracleManagerInterface, user);
    const monitor = new VaultMonitorService(oracleManagerForMonitor, (addr) => new ethers.Contract(addr, abis.VaultInterface, provider));
    
    const liquidationManager = new ethers.Contract(contracts['LiquidationManager'], abis.LiquidationManagerInterface, bot);
    const agent = new LiquidationAgentService(liquidationManager, logger);

    const liquidationManagerForEvents = new ethers.Contract(contracts['LiquidationManager'], abis.LiquidationManagerInterface, provider);
    await discovery.start();
    const liquidationPromise = new Promise<any>(resolve => {
      liquidationManagerForEvents.once('AuctionStarted', (id) => resolve({ id }));
    });

    // Step 5: Trigger Liquidation by dropping price
    const priceFeed = new ethers.Contract(contracts['WETH/USD Price Feed (Mock)'], abis.MockV3Aggregator.abi, user);
    await (await priceFeed.updateAnswer(ethers.parseUnits('700', 8), { nonce: userNonce++ })).wait();
    
    // Step 6: Run the bot's main loop once
    await runOnce({ discovery, monitor, agent });

    // Assert
    const result = await liquidationPromise;
    expect(result.id).toBe(1n);
  });
});