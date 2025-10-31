# Deployment and Testing Workflow

**Status:** Documented

## 1. Overview

This document describes the standard processes for the deployment and testing of the SCC protocol's smart contracts, covering both deployment via Foundry scripts and the off-chain integration testing architecture with Jest.

---

## 2. Deployment via Foundry Scripts

This method is ideal for manual deployments on test networks or for the initial deployment of the development environment.

### Step 1: Verify the Environment

-   **Action:** Ensure that a blockchain node (Anvil for local development, or a testnet/mainnet node) is active and accessible.

### Step 2: Locate or Create the Deploy Script

-   **Action:** Inspect the `contracts/script/` directory for a deploy script (e.g., `Deploy.s.sol`).
-   **Details:** A Foundry deploy script automates the deployment and configuration of all protocol contracts in the correct order of dependency.

### Step 3: Run the Deploy Script

-   **Action:** Use the `forge script` command to run the script.
-   **Example Command:** `forge script <ScriptName> --rpc-url <RPC_URL> --private-key <PRIVATE_KEY> --broadcast`
-   **Result:** The contract creation transactions are sent, and the blockchain state is updated.

### Step 4: Collect and Use the Addresses

-   **Action:** The output of the deploy script will provide the addresses of the newly created contracts.
-   **Utility:** These addresses are crucial for configuring the off-chain services (e.g., in the Keeper Bot's `.env` file).
