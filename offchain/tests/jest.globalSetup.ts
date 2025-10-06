import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

const ANVIL_PORT = 8545;
const ANVIL_URL = `http://127.0.0.1:${ANVIL_PORT}`;
const TEMP_DIR = path.join(__dirname, '.temp');
const ANVIL_CONFIG_PATH = path.join(TEMP_DIR, 'anvil.json');

export default async function () {
  await fs.mkdir(TEMP_DIR, { recursive: true });

  const anvilProcess: ChildProcess = spawn('anvil', [], {
    detached: true, // Allows the process to run independently of the parent
    stdio: 'ignore',
  });

  // Store process and connection info for teardown and client connection
  const config = {
    pid: anvilProcess.pid,
    url: ANVIL_URL,
  };
  await fs.writeFile(ANVIL_CONFIG_PATH, JSON.stringify(config));

  // A simple wait mechanism to ensure Anvil is ready to accept connections
  await new Promise(resolve => setTimeout(resolve, 3000));
}