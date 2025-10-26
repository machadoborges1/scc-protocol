
import { createWalletClient, createPublicClient, http, parseEther, type WalletClient, type PublicClient, type Transport, type Chain, type Account } from 'viem';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';
import path from 'path';
import fs from 'fs';

// --- ABIs ---
const erc20Abi = JSON.parse(fs.readFileSync(path.join(__dirname, '../abis/ERC20.json'), 'utf8')).abi;

// --- Helper to get addresses ---
const getDeploymentAddress = (contractName: string): `0x${string}` => {
    const artifactPath = path.join(process.cwd(), './contracts/broadcast/Deploy.s.sol/31337/run-latest.json');
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const contract = artifact.transactions.find(
        (tx: any) => tx.transactionType === 'CREATE' && tx.contractName === contractName
    );
    if (!contract) throw new Error(`Contract ${contractName} not found`);
    return contract.contractAddress as `0x${string}`;
};

// --- Constants ---
const WETH_ADDRESS = getDeploymentAddress('MockERC20');
const SCC_GOV_ADDRESS = getDeploymentAddress('SCC_GOV');
const DEPLOYER_PK = (process.env.ANVIL_KEY_1 as `0x${string}`) ?? '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const USER_ADDRESS = '0xf5b2d89a301E82db54404b2227545be858008121'; // Random address

describe('Fund User Account', () => {
  jest.setTimeout(60000);

  let publicClient: ReturnType<typeof createPublicClient>;
  let deployer: PrivateKeyAccount;
  let walletClient: ReturnType<typeof createWalletClient>;

  beforeAll(() => {
    deployer = privateKeyToAccount(DEPLOYER_PK);
    publicClient = createPublicClient({ chain: anvil, transport: http() });
    walletClient = createWalletClient({ account: deployer, chain: anvil, transport: http() });
  });

  it('should send WETH and SCC-GOV to the user account', async () => {
    // 1. Send WETH
    console.log(`Sending 1 WETH to ${USER_ADDRESS}...`);
    const wethHash = await walletClient.writeContract({
        address: WETH_ADDRESS,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [USER_ADDRESS, parseEther('1')],
    });
    const wethReceipt = await publicClient.waitForTransactionReceipt({ hash: wethHash });
    expect(wethReceipt.status).toBe('success');
    console.log(`    - WETH transfer sent: ${wethHash}`);

    // 2. Send SCC-GOV
    console.log(`Sending 10,000 SCC-GOV to ${USER_ADDRESS}...`);
    const govHash = await walletClient.writeContract({
        address: SCC_GOV_ADDRESS,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [USER_ADDRESS, parseEther('10000')],
    });
    const govReceipt = await publicClient.waitForTransactionReceipt({ hash: govHash });
    expect(govReceipt.status).toBe('success');
    console.log(`    - SCC-GOV transfer sent: ${govHash}`);
  });
});
