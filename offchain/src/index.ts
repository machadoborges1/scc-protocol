import { createPublicClient, http, defineChain } from 'viem';
import dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.RPC_URL;
const MONITOR_INTERVAL_MS = parseInt(process.env.MONITOR_INTERVAL_MS || '15000', 10);

if (!RPC_URL) {
  console.error('RPC_URL is not defined in the .env file.');
  process.exit(1);
}

// Define a custom chain for our local Anvil instance
const anvilChain = defineChain({
  id: 31337,
  name: 'Anvil',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [RPC_URL],
    },
  },
});

const publicClient = createPublicClient({
  chain: anvilChain,
  transport: http(), // RPC URL is now taken from the chain definition
});

async function monitorVaults() {
  console.log('Checking vaults...');
  // TODO: Implement vault monitoring logic here
}

async function main() {
  console.log('Keeper bot started...');
  console.log('Connected to RPC:', RPC_URL);
  console.log('Monitoring interval:', MONITOR_INTERVAL_MS, 'ms');

  try {
    const blockNumber = await publicClient.getBlockNumber();
    console.log('Current block number:', blockNumber);
  } catch (error) {
    console.error('Error connecting to blockchain:', error);
    process.exit(1); // Exit if cannot connect to blockchain
  }

  // Start the periodic monitoring loop
  const startMonitoring = async () => {
    await monitorVaults();
    setTimeout(startMonitoring, MONITOR_INTERVAL_MS);
  };

  startMonitoring();
}

main();