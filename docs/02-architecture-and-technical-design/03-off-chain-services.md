# 3. SCC Protocol Off-Chain Services

Off-chain services are crucial components that operate outside the blockchain but interact directly with it to ensure the functionality, monitoring, and usability of the SCC Protocol. They are developed in TypeScript/Node.js and use the `viem` library for efficient interactions with the blockchain.

## 3.1. Keeper Bot (Liquidations)

The Keeper Bot is a robust and scalable system responsible for monitoring the health of `Vaults` and initiating liquidations when necessary. Its architecture is designed to separate responsibilities and ensure the reliable execution of transactions.

### 3.1.1. Directory Structure (`offchain/src/`)

The Keeper Bot's structure reflects the separation of responsibilities:

```
offchain/
├── src/
│   ├── index.ts                # Main bot orchestrator
│   ├── config/                 # Configuration module
│   ├── rpc/                    # RPC client module
│   ├── contracts/              # Contract services module
│   ├── services/               # Business logic modules
│   │   ├── vaultDiscovery.ts     # Logic to discover all Vaults (Producer)
│   │   ├── vaultMonitor.ts       # Logic to monitor the health of Vaults (Consumer)
│   │   ├── liquidationStrategy.ts # Logic to decide IF and WHEN to liquidate (Brain)
│   │   └── transactionManager.ts   # Logic to execute transactions robustly (Muscle)
│   ├── alerter.ts              # Module for sending alerts
│   ├── logger.ts               # Logging module
│   ├── metrics.ts              # Module for collecting metrics
│   └── queue.ts                # Module for internal queue management
└── docs/
```

### 3.1.2. Components and Responsibilities

*   **`index.ts` (Main Orchestrator):** Initializes all modules and orchestrates the data flow between them, managing the work queues.
*   **`config/`:** Module to manage the bot's configurations.
*   **`rpc/`:** Module to manage the connection and RPC calls to the blockchain.
*   **`contracts/`:** Module to interact with the protocol's smart contracts.
*   **`logger.ts`:** Centralized module for logging events and errors.
*   **`metrics.ts`:** Module for collecting and exposing the bot's performance metrics (e.g., for Prometheus).
*   **`alerter.ts`:** Module for sending alerts in case of critical events or errors.
*   **`queue.ts`:** Module for managing internal queues, such as the queue of `Vaults` to be monitored.

#### Service Modules (`services/`)

*   **`vaultDiscovery.ts` (Producer):** Responsible for discovering all existing and future `Vaults`. On initialization, it searches for `VaultCreated` events and continuously listens for new events to add `Vaults` to a processing queue.
*   **`vaultMonitor.ts` (Consumer):** Processes `Vaults` from the work queue, calculates their Collateralization Ratio (CR), and identifies liquidation candidates, passing them to the next stage.
*   **`liquidationStrategy.ts` (Brain):** Receives liquidation candidates and decides if a liquidation is profitable and strategic at the moment. It performs profitability analysis (benefit vs. gas cost) and manages an internal queue to avoid concurrent transactions.
*   **`transactionManager.ts` (Muscle):** Ensures the reliable execution of transactions. It manages the Keeper account's `nonce`, implements a dynamic gas strategy (EIP-1559), and monitors transactions, resubmitting them with higher gas if they get stuck in the mempool.

### 3.1.3. Execution Flow

1.  `index.ts` initializes all modules and the work queue.
2.  `vaultDiscovery` populates the queue with `Vaults` and listens for new events.
3.  `vaultMonitor` consumes `Vaults` from the queue, checks their health, and sends liquidation candidates to `liquidationStrategy`.
4.  `liquidationStrategy` analyzes each candidate, checks for profitability, and, if approved, sends a liquidation order to `transactionManager`.
5.  `transactionManager` manages the `nonce` and gas, sends the transaction, and monitors it until confirmation.
6.  `logger` and `metrics` record all actions, and the `alerter` notifies about critical events.

### 3.1.4. Scalability (Post-MVP)

To scale, the system can evolve into a multi-worker architecture with a centralized queue (e.g., Redis) and a centralized `Transaction Signer` to manage the `nonce` and private keys, allowing multiple keepers to operate without collision.

## 3.2. Indexing Service (The Graph)

*   **Purpose:** Provide a fast and efficient way to query historical and real-time data from the protocol.
*   **Functioning:** The Subgraph listens to events emitted by the protocol's smart contracts (e.g., `VaultCreated`, `CollateralDeposited`, `Liquidated`) and stores them in a database. This data is then exposed through a GraphQL API, which can be queried by applications like the frontend.
*   **Technology:** The Graph Protocol, GraphQL, AssemblyScript (for mappings).
*   **Location:** The Subgraph files are located in the `/subgraph/` directory.

## 3.3. Frontend (DApp)

*   **Purpose:** User interface for interacting with the SCC protocol.
*   **Functioning:** The frontend allows users to create `Vaults`, deposit collateral, mint `SCC-USD`, participate in auctions, stake `SCC-GOV`, and vote on governance proposals.
*   **Interactions:**
    *   **Data Reading:** Queries the Indexing Service (The Graph) via GraphQL to display the current state of the protocol and the transaction history.
    *   **Sending Transactions:** Allows the user to send transactions (mint, stake, etc.) directly to the blockchain via an RPC node, using their wallet (e.g., MetaMask).
*   **Technology:** React/Next.js, Viem.
*   **Location:** The Frontend files are located in the `/frontend/` directory.
