import { exec, spawn, ChildProcess } from 'child_process';
import { ethers } from 'ethers';
import * as util from 'util';
import * as abis from '../../src/contracts/abis';
import { runOnce } from '../../src/index';
import { VaultDiscoveryService } from '../../src/services/vaultDiscovery';
import { VaultMonitorService } from '../../src/services/vaultMonitor';
import { LiquidationAgentService } from '../../src/services/liquidationAgent';
import logger from '../../src/logger';

const execAsync = util.promisify(exec);

describe('Integration: Bot Liquidation Flow', () => {
  const anvilUrl = 'http://127.0.0.1:8545';
  let contracts: Record<string, string> = {};
  let deployerSigner: ethers.Wallet;
  let discovery: VaultDiscoveryService;

  jest.setTimeout(90000);

  beforeAll(async () => {
    // Reset the external anvil instance to a clean state before the test
    const provider = new ethers.JsonRpcProvider(anvilUrl);
    try {
      await provider.send('anvil_reset', []);
    } catch (e) {
      throw new Error(`Could not reset Anvil. Please ensure a local Anvil instance is running on ${anvilUrl}.`);
    }

    // Re-initialize signer after reset
    deployerSigner = new ethers.Wallet(process.env.ANVIL_KEY_1!, provider);
    
    // Deploy contracts
    const { stdout } = await execAsync(
      `cd ../contracts && forge script script/Deploy.s.sol:Deploy --rpc-url ${anvilUrl} --broadcast --private-key ${deployerSigner.privateKey}`
    );
    stdout.split('\n').forEach(line => {
      const [key, value] = line.split(':').map(s => s.trim());
      if (key && value && key.length < 30) contracts[key] = value;
    });

    // Mint WETH to the deployer/user account
    const wethContract = new ethers.Contract(contracts['WETH (Mock Collateral)'], abis.MockERC20.abi, deployerSigner);
    await wethContract.mint(deployerSigner.address, ethers.parseEther('100'));
  });

  afterAll(() => {
    if (discovery) {
      discovery.stop();
    }
  });

  // No afterAll needed as we are using an external Anvil instance

  it('should liquidate an unhealthy vault', async () => {
    // Step 1: Create Vault
    let provider1 = new ethers.JsonRpcProvider(anvilUrl);
    let user1 = new ethers.Wallet(process.env.ANVIL_KEY_1!, provider1);
    const vaultFactory = new ethers.Contract(contracts['VaultFactory'], abis.VaultFactoryInterface, user1);
    const tx = await vaultFactory.createNewVault();
    const receipt = await tx.wait();
    const vaultCreatedEvent = receipt!.logs.find((log: ethers.Log | ethers.EventLog): log is ethers.EventLog => log instanceof ethers.EventLog && log.eventName === 'VaultCreated');
    if (!vaultCreatedEvent) throw new Error('VaultCreated event not found');
    const vaultAddress = vaultCreatedEvent.args[0];

    // Step 2: Approve and Deposit Collateral
    let provider2 = new ethers.JsonRpcProvider(anvilUrl);
    let user2 = new ethers.Wallet(process.env.ANVIL_KEY_1!, provider2);
    const weth = new ethers.Contract(contracts['WETH (Mock Collateral)'], abis.MockERC20.abi, user2);
    await weth.approve(vaultAddress, ethers.parseEther('10'));
    
    let provider3 = new ethers.JsonRpcProvider(anvilUrl);
    let user3 = new ethers.Wallet(process.env.ANVIL_KEY_1!, provider3);
    const vault = new ethers.Contract(vaultAddress, abis.VaultInterface, user3);
    await vault.depositCollateral(ethers.parseEther('10'));

    // Step 3: Mint SCC_USD
    let provider4 = new ethers.JsonRpcProvider(anvilUrl);
    let user4 = new ethers.Wallet(process.env.ANVIL_KEY_1!, provider4);
    const vault_user4 = new ethers.Contract(vaultAddress, abis.VaultInterface, user4);

    const oracleManager = new ethers.Contract(contracts['OracleManager'], abis.OracleManagerInterface, user4);
    const wethPrice = await oracleManager.getPrice(contracts['WETH (Mock Collateral)']);
    console.log(`[DEBUG] WETH Price from Oracle: ${wethPrice}`);
    console.log(`[DEBUG] Vault Collateral Amount before mint: ${await vault_user4.collateralAmount()}`);
    console.log(`[DEBUG] Vault Debt Amount before mint: ${await vault_user4.debtAmount()}`);

    await vault_user4.mint(ethers.parseEther('10000'));

    // Step 4: Run Bot Logic
    const testProvider = new ethers.JsonRpcProvider(anvilUrl);
    const user = new ethers.Wallet(process.env.ANVIL_KEY_1!, testProvider);
    const bot = new ethers.Wallet(process.env.ANVIL_KEY_2!, testProvider);

    discovery = new VaultDiscoveryService(new ethers.Contract(contracts['VaultFactory'], abis.VaultFactoryInterface, user), testProvider);
    const monitor = new VaultMonitorService(new ethers.Contract(contracts['OracleManager'], abis.OracleManagerInterface, user), (addr) => new ethers.Contract(addr, abis.VaultInterface, testProvider));
    const liquidationManager = new ethers.Contract(contracts['LiquidationManager'], abis.LiquidationManagerInterface, bot);
    const agent = new LiquidationAgentService(liquidationManager, logger);
    
    await discovery.start();
    const liquidationPromise = new Promise<any>(resolve => {
      liquidationManager.on('AuctionStarted', (id) => resolve({ id }));
    });
    const priceFeed = new ethers.Contract(contracts['WETH/USD Price Feed (Mock)'], abis.MockV3Aggregator.abi, user);
    await priceFeed.updateAnswer(ethers.parseUnits('700', 8));
    await runOnce({ discovery, monitor, agent }, bot);

    // Assert
    const result = await liquidationPromise;
    expect(result.id).toBe(1n);
  });
});
