import { spawn, execSync, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const ANVIL_PORT = 8545;
const ANVIL_URL = `http://127.0.0.1:${ANVIL_PORT}`;
const TEMP_DIR = path.join(__dirname, '.temp');
const ANVIL_CONFIG_PATH = path.join(TEMP_DIR, 'anvil.json');

// Helper function to check if Anvil is ready by making a basic RPC call
const isAnvilReady = async () => {
  try {
    const response = await fetch(ANVIL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'eth_chainId', params: [], id: 1 }),
    });
    const data = await response.json();
    if (data.result) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

export default async function () {
  // 1. Kill any process that might be listening on the port
  try {
    console.log(`Checking for and killing existing process on port ${ANVIL_PORT}...`);
    execSync(`lsof -t -i:${ANVIL_PORT} | xargs kill -9`);
    console.log('Process killed.');
  } catch (e) {
    // Ignore errors, which will happen if no process is on the port
    console.log('No existing process found.');
  }

  await fs.mkdir(TEMP_DIR, { recursive: true });

  // 2. Spawn a new Anvil instance
  const anvilProcess: ChildProcess = spawn('anvil', [], {
    detached: true,
    stdio: 'inherit',
  });

  anvilProcess.on('error', (err) => {
    console.error('Failed to start Anvil:', err);
  });

  // Store process and connection info for teardown
  const config = {
    pid: anvilProcess.pid,
    url: ANVIL_URL,
  };
  await fs.writeFile(ANVIL_CONFIG_PATH, JSON.stringify(config));

  // 3. Robustly wait for Anvil to be ready
  console.log('Waiting for Anvil to start...');
  const maxRetries = 15; // 15 seconds max wait
  const retryInterval = 1000; // 1 second

  for (let i = 0; i < maxRetries; i++) {
    if (await isAnvilReady()) {
      console.log('Anvil is ready.');
      return;
    }
    await new Promise(resolve => setTimeout(resolve, retryInterval));
  }

  // If Anvil is not ready, kill the process and throw
  if (anvilProcess.pid) {
    process.kill(anvilProcess.pid);
  }
  throw new Error(`Anvil did not become ready after ${maxRetries} seconds.`);
}