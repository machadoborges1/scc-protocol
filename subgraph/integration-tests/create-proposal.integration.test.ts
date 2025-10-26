import { createWalletClient, createPublicClient, http, encodeFunctionData, parseEther, decodeEventLog, keccak256, toHex, Log } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';
import fs from 'fs';
import path from 'path';

// --- Type for logs with topics ---
type LogWithTopics = Log & { topics: `0x${string}`[] };

// --- Helper to get addresses from deployment artifacts ---
const getDeploymentAddress = (contractName: string): `0x${string}` => {
    const artifactPath = path.join(process.cwd(), './contracts/broadcast/Deploy.s.sol/31337/run-latest.json');
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const contract = artifact.transactions.find(
        (tx: any) => tx.transactionType === 'CREATE' && tx.contractName === contractName
    );
    if (!contract) {
        throw new Error(`Contract ${contractName} not found in deployment artifacts.`);
    }
    return contract.contractAddress as `0x${string}`;
};

// --- ABIs defined inline ---
const sccGovAbi = JSON.parse(fs.readFileSync(path.join(__dirname, '../abis/SCC_GOV.json'), 'utf8')).abi;
const erc20Abi = JSON.parse(fs.readFileSync(path.join(__dirname, '../abis/ERC20.json'), 'utf8')).abi;
const governorAbi = JSON.parse(fs.readFileSync(path.join(__dirname, '../abis/SCC_Governor.json'), 'utf8')).abi;

// --- Config ---
const SCC_GOV_ADDRESS = getDeploymentAddress('SCC_GOV');
const SCC_USD_ADDRESS = getDeploymentAddress('SCC_USD');
const GOVERNOR_ADDRESS = getDeploymentAddress('SCC_Governor');
const DEPLOYER_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const ALICE_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // Anvil account #1

describe('Create Governance Proposal', () => {
  jest.setTimeout(60000);

  it('should create a sample proposal and log its ID', async () => {
    const account = privateKeyToAccount(DEPLOYER_PRIVATE_KEY);
    const publicClient = createPublicClient({ chain: anvil, transport: http() });
    const walletClient = createWalletClient({ account, chain: anvil, transport: http() });

    // 1. Delegate and wait
    console.log('Delegating votes...');
    const delegateHash = await walletClient.writeContract({
      address: SCC_GOV_ADDRESS,
      abi: sccGovAbi,
      functionName: 'delegate',
      args: [account.address],
    });
    await publicClient.waitForTransactionReceipt({ hash: delegateHash });
    console.log('Delegate transaction confirmed.');

    // 2. Mine a block to ensure separation
    await walletClient.request({ method: 'anvil_mine', params: ['0x1', '0x0'] });
    console.log('Mined 1 block after delegation.');

    // 3. Encode calldata
    const amountToTransfer = parseEther('1');
    const transferCalldata = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [ALICE_ADDRESS, amountToTransfer],
    });

    // 4. Create proposal
    console.log('Creating proposal...');
    const proposeHash = await walletClient.writeContract({
      address: GOVERNOR_ADDRESS,
      abi: governorAbi,
      functionName: 'propose',
      args: [
        [SCC_USD_ADDRESS],
        [0n],
        [transferCalldata],
        "Proposal to test creation",
      ],
    });
    const proposeReceipt = await publicClient.waitForTransactionReceipt({ hash: proposeHash });
    console.log('Propose transaction confirmed.');

    // 5. Decode the Proposal ID from the logs
    const eventSignature = 'ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)';
    const eventTopic = keccak256(toHex(eventSignature));
    const proposalCreatedLog = proposeReceipt.logs.find(
      (log) => (log as LogWithTopics).topics[0] === eventTopic
    ) as LogWithTopics | undefined;

    if (!proposalCreatedLog) throw new Error('ProposalCreated event log not found');
    
    const decodedLog = decodeEventLog({ abi: governorAbi, data: proposalCreatedLog.data, topics: proposalCreatedLog.topics });
    const proposalId = (decodedLog.args as any).proposalId;
    console.log(`

>>>-------> PROPOSAL ID: ${proposalId} <-------<<<

`);

    expect(proposalId).toBeDefined();
  });
});