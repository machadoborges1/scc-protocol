import { createWalletClient, createPublicClient, http, parseEther, decodeEventLog, type WalletClient, type PublicClient, keccak256, toHex, Log } from 'viem';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { anvil } from 'viem/chains';
import axios from 'axios';
import path from 'path';
import fs from 'fs';

// --- Type for logs with topics ---
type LogWithTopics = Log & { topics: `0x${string}`[] };

// --- ABIs ---
const governorAbi = JSON.parse(fs.readFileSync(path.join(__dirname, '../abis/SCC_Governor.json'), 'utf8')).abi;
const sccGovAbi = JSON.parse(fs.readFileSync(path.join(__dirname, '../abis/SCC_GOV.json'), 'utf8')).abi;

// --- Helper to get addresses ---
const getDeploymentAddress = (contractName: string): `0x${string}` => {
    const artifactPath = path.join(__dirname, '../../contracts/broadcast/Deploy.s.sol/31337/run-latest.json');
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    const contract = artifact.transactions.find(
        (tx: any) => tx.transactionType === 'CREATE' && tx.contractName === contractName
    );
    if (!contract) throw new Error(`Contract ${contractName} not found`);
    return contract.contractAddress as `0x${string}`;
};

// --- Constants ---
const GRAPH_API_URL = 'http://localhost:8000/subgraphs/name/scc/scc-protocol';
const GOVERNOR_ADDRESS = getDeploymentAddress('SCC_Governor');
const SCC_GOV_ADDRESS = getDeploymentAddress('SCC_GOV');
const DEPLOYER_PK = (process.env.ANVIL_KEY_1 as `0x${string}`) ?? '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const VOTER_PK = (process.env.ANVIL_KEY_2 as `0x${string}`) ?? '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Subgraph Governance Integration Test', () => {
  jest.setTimeout(120000);

  let publicClient: any;
  let deployer: PrivateKeyAccount;
  let voter: PrivateKeyAccount;
  let deployerClient: any;
  let voterClient: any;
  let proposalId: bigint;

  beforeAll(async () => {
    deployer = privateKeyToAccount(DEPLOYER_PK);
    voter = privateKeyToAccount(VOTER_PK);

    publicClient = createPublicClient({ chain: anvil, transport: http() });
    deployerClient = createWalletClient({ account: deployer, chain: anvil, transport: http() });

    console.log(`Funding voter account ${voter.address}...`);
    const fundEthHash = await deployerClient.sendTransaction({ to: voter.address, value: parseEther('10') });
    const transferHash = await deployerClient.writeContract({
        address: SCC_GOV_ADDRESS,
        abi: sccGovAbi,
        functionName: 'transfer',
        args: [voter.address, parseEther('50000')],
        chain: anvil,
        account: deployer,
    });
    await publicClient.waitForTransactionReceipt({ hash: fundEthHash });
    await publicClient.waitForTransactionReceipt({ hash: transferHash });
    console.log('Voter account funded.');
  });

  it('should correctly index the entire governance proposal lifecycle', async () => {
    voterClient = createWalletClient({ account: voter, chain: anvil, transport: http() });

    console.log('Delegating votes for voter...');
    const delegateHash = await voterClient.writeContract({
        address: SCC_GOV_ADDRESS,
        abi: sccGovAbi,
        functionName: 'delegate',
        args: [voter.address],
        chain: anvil,
        account: voter,
    });
    await publicClient.waitForTransactionReceipt({ hash: delegateHash });
    console.log('Votes delegated.');

    console.log('Creating new proposal...');
    const description = "Proposal to test subgraph indexing";
    const proposeHash = await deployerClient.writeContract({
        address: GOVERNOR_ADDRESS,
        abi: governorAbi,
        functionName: 'propose',
        args: [[SCC_GOV_ADDRESS], [0n], ['0x'], description],
        chain: anvil,
        account: deployer,
    });
    const proposeReceipt = await publicClient.waitForTransactionReceipt({ hash: proposeHash });

    const eventSignature = 'ProposalCreated(uint256,address,address[],uint256[],string[],bytes[],uint256,uint256,string)';
    const eventTopic = keccak256(toHex(eventSignature));
    const proposalLog = proposeReceipt.logs.find(log => (log as LogWithTopics).topics[0] === eventTopic) as LogWithTopics | undefined;
    if (!proposalLog) throw new Error('ProposalCreated log not found!');

    const decodedLog = decodeEventLog({ abi: governorAbi, data: proposalLog.data, topics: proposalLog.topics as any, eventName: 'ProposalCreated', strict: false });
    proposalId = (decodedLog.args as any).proposalId;
    console.log(`Proposal created with ID: ${proposalId}`);

    await sleep(8000); // Increased wait time
    let query = `{ governanceProposal(id: "${proposalId}") { id status } }`;
    let response = await axios.post(GRAPH_API_URL, { query });
    expect(response.data.data.governanceProposal.status).toBe('Pending');
    console.log('Subgraph correctly indexed proposal as Pending.');

    const votingDelay = await publicClient.readContract({ address: GOVERNOR_ADDRESS, abi: governorAbi, functionName: 'votingDelay' }) as bigint;
    console.log(`Mining ${votingDelay + 1n} blocks to activate proposal...`);
    await deployerClient.request({ method: 'anvil_mine', params: [`0x${(votingDelay + 1n).toString(16)}`, '0x0'] });

    console.log('Casting vote...');
    const voteHash = await voterClient.writeContract({
        address: GOVERNOR_ADDRESS,
        abi: governorAbi,
        functionName: 'castVote',
        args: [proposalId, 1], // 1 = For
        chain: anvil,
        account: voter,
    });
    await publicClient.waitForTransactionReceipt({ hash: voteHash });
    console.log('Vote cast successfully on-chain.');

    await sleep(8000); // Increased wait time
    query = `{ governanceProposal(id: "${proposalId}") { forVotes } }`;
    response = await axios.post(GRAPH_API_URL, { query });
    const forVotes = response.data.data.governanceProposal.forVotes;
    expect(forVotes).toBe("50000000000000000000000");
    console.log('Subgraph correctly indexed the new vote count.');
  });
});