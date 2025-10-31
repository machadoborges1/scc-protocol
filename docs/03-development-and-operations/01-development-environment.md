# 1. Development Environment

This document details the configuration of the development environment for the SCC Protocol, using `pnpm workspaces` to manage the monorepo and `Docker Compose` to orchestrate a consistent and isolated local environment. The goal is to provide a complete guide for configuring, starting, and interacting with all the protocol's components in a development environment.

## 1.1. Prerequisites

Before starting, make sure you have the following tools installed:

1.  **Git:** For version control.
2.  **Foundry:** For smart contract development and testing (includes `forge`, `anvil`, `cast`).
3.  **pnpm:** For managing the dependencies of JavaScript/TypeScript packages.
4.  **Docker & Docker Compose:** For orchestrating and running the local development environment.

## 1.2. Local Environment Structure (Docker Compose)

The development environment is orchestrated via `docker-compose.yml` and consists of the following services:

*   **`anvil`:** An extremely fast local blockchain node (part of Foundry), simulating the Ethereum network for testing and debugging. Accessible via RPC at `http://localhost:8545`.
*   **`keeper`:** The Docker container that runs the off-chain service (liquidator bot). It monitors the blockchain and interacts with the smart contracts, connecting to `anvil` via `http://anvil:8545`.
*   **`postgres`:** Database for the Subgraph.
*   **`ipfs`:** IPFS node to host Subgraph metadata.
*   **`graph-node`:** The indexer that synchronizes with the blockchain and exposes the GraphQL API.
*   **`prometheus`:** For collecting metrics from the services.

## 1.3. Essential Commands

All commands must be run from the project root (`/home/humberto/Projects/scc-protocol`).

### 1.3.1. Docker Environment Management

*   **Start the entire environment (in the background):**
    ```bash
    docker compose up -d
    ```
*   **Stop the entire environment:**
    ```bash
    docker compose down
    ```
*   **Stop and remove all data (for a clean restart):**
    ```bash
    docker compose down -v
    ```
*   **View the logs of a service (e.g., `keeper`):**
    ```bash
    docker compose logs -f keeper
    ```

### 1.3.2. Dependency Management (pnpm)

*   **Install all monorepo dependencies:**
    ```bash
    pnpm install
    ```
*   **Add a dependency to a specific package (e.g., `ethers` to `offchain`):**
    ```bash
    pnpm --filter @scc/offchain add ethers
    ```

### 1.3.3. Testing and Verification

*   **Verify and Test the Environment (full integration):**
    ```bash
    pnpm test:integration
    ```
    This command waits for the services to initialize, deploys the contracts to the Anvil network, prepares and deploys the subgraph, and runs the subgraph's integration tests. A success indicates that the entire environment is configured and working.
*   **Test only the contracts:**
    ```bash
    pnpm contracts:test
    ```
*   **Test only the subgraph mappings (unit tests):**
    ```bash
    pnpm test:subgraph
    ```

### 1.3.4. Accessing the Services

With the environment up, you can access the main services:

*   **GraphQL (Subgraph):** `http://localhost:8000/subgraphs/name/scc/scc-protocol`
*   **Blockchain RPC (Anvil):** `http://localhost:8545`
*   **Prometheus (Metrics):** `http://localhost:9090`

## 1.4. Example Configuration Script (`configurar_protocolo.sh`)

The `configurar_protocolo.sh` script demonstrates a flow for configuring and interacting with the protocol in a local environment. It performs the following steps:

1.  **Reads Deploy Addresses:** Extracts the addresses of the `VaultFactory` and `WETH` (MockERC20) contracts from the deployment artifact file.
2.  **Creates New Vault:** Uses `cast send` to call the `createNewVault()` function in `VaultFactory`, creating a new `Vault` for the user.
3.  **Gets New Vault Address:** Extracts the address of the newly created `Vault` from the transaction logs.
4.  **Mints WETH:** Mints an amount of WETH to the `Vault` owner's address.
5.  **Approves WETH:** Approves the `Vault` to spend an amount of WETH as collateral.
6.  **Deposits Collateral:** Calls `depositCollateral()` in the `Vault` to deposit WETH.
7.  **Generates Debt:** Calls `mint()` in the `Vault` to generate `SCC-USD` as debt.
8.  **Verifies Vault Data:** Queries the `Vault` to display the amount of collateral and debt.

This script is a useful tool for quickly setting up a test scenario and verifying the basic functionality of the protocol after a local deployment.
