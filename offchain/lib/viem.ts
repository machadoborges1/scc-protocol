import { createTestClient, http, publicActions, walletActions } from 'viem';
import { foundry } from 'viem/chains';
import { readFileSync } from 'fs';
import path from 'path';

// Synchronously read the anvil config file written by globalSetup
// This is an acceptable use of sync I/O as the test suite cannot proceed without it.
const configPath = path.join(__dirname, '..', 'tests', '.temp', 'anvil.json');
const config = JSON.parse(readFileSync(configPath, 'utf-8'));

const transport = http(config.url);

// A single, all-powerful client for all test interactions
export const testClient = createTestClient({
  chain: foundry,
  mode: 'anvil',
  transport,
})
.extend(publicActions)
.extend(walletActions);
