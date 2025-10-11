/**
 * @file jest.globalTeardown.ts
 * @description Global teardown script for Jest. Terminates the Anvil process started by globalSetup
 * and cleans up any temporary files.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const TEMP_DIR = path.join(__dirname, '.temp');
const ANVIL_CONFIG_PATH = path.join(TEMP_DIR, 'anvil.json');

export default async function globalTeardown() {
  try {
    const configContent = await fs.readFile(ANVIL_CONFIG_PATH, 'utf-8');
    const { pid } = JSON.parse(configContent);

    if (pid) {
      try {
        // Forcefully and synchronously kill the process to ensure it's gone.
        execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
      } catch (e) {
        // Ignore errors, which can happen if the process is already gone.
      }
    }
  } catch (error) {
    // Suppress errors if the config file doesn't exist or is malformed (e.g., if setup failed)
  } finally {
    // Clean up the temporary directory and its contents
    await fs.rm(TEMP_DIR, { recursive: true, force: true });
  }
}
