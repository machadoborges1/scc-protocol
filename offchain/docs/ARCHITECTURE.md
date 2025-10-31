# Off-chain Keeper Bot Architecture (Production Level)

**Status:** Revised and Updated

## 1. Introduction

This document describes the production-level architecture for the Keeper Bot. The design evolves from a simple loop script to a robust, scalable, and profitable system, clearly separating the responsibilities of discovery, monitoring, strategy, and execution. All blockchain interaction is done using the `viem` library to ensure performance and maintainability.

## 2. Directory Structure (Proposed)

The service structure will be more granular to reflect the separation of responsibilities.

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
│   └── logger.ts               # Logging module
└── docs/
```

## 3. Components and Responsibilities

The `config`, `rpc`, `contracts`, and `logger` components retain their original responsibilities.

### 3.1. `services/vaultDiscovery.ts` - Vault Discovery

-   **Responsibility:** Act as the data **Producer**. Discovers all existing and future `Vaults` and adds them to a processing queue.
-   **Strategy:**
    -   On initialization, fetches all `VaultCreated` events to populate the initial list.
    -   Continuously listens for new `VaultCreated` events to add new `Vaults` to the queue.
    -   Listens for events that change a `Vault`'s health (e.g., `CollateralDeposited`) to add the corresponding `Vault` to a high-priority queue.

### 3.2. `services/vaultMonitor.ts` - Health Monitoring

-   **Responsibility:** Act as the queue **Consumer**. Processes `Vaults` to check their health.
-   **Strategy:**
    -   Consumes `Vault` addresses from the work queue.
    -   Calculates the Collateralization Ratio (CR) of each `Vault`.
    -   If a `Vault` is below the MCR, it is not liquidated immediately. Instead, it is passed to the next stage as a "liquidation candidate."

### 3.3. `services/liquidationStrategy.ts` - Liquidation Strategy

-   **Responsibility:** The bot's **brain**. Decides if a liquidation is profitable and strategic at the current moment.
-   **Strategy:**
    -   Receives a "liquidation candidate" from `vaultMonitor`.
    -   Performs a **profitability analysis**, comparing the liquidation benefit with the estimated gas cost.
    -   Estimates network gas fees (EIP-1559) for cost-benefit analysis.
    -   May include additional logic (e.g., do not liquidate if the network is extremely congested, even if profitable).
    -   **Manages an internal liquidation queue to process candidates one by one (throttling), avoiding sending concurrent transactions.**
    -   If the decision is positive, sends a liquidation order to the `transactionManager`.

### 3.4. `services/transactionManager.ts` - Transaction Manager

-   **Responsibility:** The bot's **muscle**. Ensures that transactions are executed reliably.
-   **Strategy:**
    -   Receives execution orders from `liquidationStrategy`.
    -   Manages the Keeper account's **nonce** explicitly.
    -   Implements a **dynamic gas price strategy** (EIP-1559) to optimize transaction inclusion in a block.
    -   **Monitors transactions sent:** If a transaction gets "stuck" in the mempool, it will resend it with a higher gas price, using the same nonce.
    -   Manages retries and low-level error handling (e.g., RPC failure).

### 3.5. `index.ts` - Main Orchestrator

-   **Responsibility:** Initialize all modules and orchestrate the data flow between them.
-   **Strategy:**
    -   Configures all components.
    -   Gerencia a fila de trabalho entre o `vaultDiscovery` (produtor) e o `vaultMonitor` (consumidor).
    -   Ensures that liquidation candidates from `vaultMonitor` are passed to `liquidationStrategy`.
    -   Ensures that liquidation orders from `liquidationStrategy` are sent to `transactionManager`.

## 4. Execution Flow (Production Level)

1.  `index.ts` initializes all modules and the work queue.
2.  `vaultDiscovery` populates the queue with all `Vaults` and starts listening for new events.
3.  `vaultMonitor` consumes `Vaults` from the queue, calculates their health, and sends liquidation candidates to `liquidationStrategy`.
4.  `liquidationStrategy` analyzes each candidate, checks profitability based on current gas, and, if approved, sends a liquidation order to `transactionManager`.
5.  `transactionManager` receives the order, manages the nonce and gas, sends the transaction, and monitors it until confirmation, resending it if necessary.
6.  `logger` records all decisions, actions, and errors at each stage of the process.

## 5. Post-MVP Evolution: Scaling to Multiple Keepers

The current design functions as a "single-worker" model. To scale the system and increase its resilience, we can evolve to a "multi-worker" architecture.

### 5.1. Challenges

-   **Redundant Work:** Multiple independent keepers would monitor the same vaults and attempt to liquidate the same position simultaneously.
-   **Nonce Collision:** If all keepers used the same private key, they would create a chaotic race to use the same nonce, where only one transaction would succeed.

### 5.2. Proposed Solution: Centralized Queue and Workers

A more robust architecture would separate roles more clearly, using an external message queue (e.g., Redis) for coordination.

```mermaid
graph TD
    subgraph Producer
        A[Vault Discovery Service]
    end
    subgraph Queue
        B[Vaults Queue (Redis)]
    end
    subgraph Consumers
        C1[Keeper Worker 1]
        C2[Keeper Worker 2]
        C3[Keeper Worker N...]
    end
    subgraph SingletonService
        D[Transaction Signer Service]
    end

    A -- "Adds Vaults" --> B
    C1 -- "Gets Vault" --> B
    C2 -- "Gets Vault" --> B
    C3 -- "Gets Vault" --> B
    C1 -- "Sends Liquidation Order" --> D
    C2 -- "Sends Liquidation Order" --> D
    C3 -- "Sends Liquidation Order" --> D
    D -- "Sends Transaction (Managed Nonce)" --> E[Blockchain]
```

-   **Producer (`Vault Discovery Service`):** A single service remains responsible for finding vaults and adding them to the centralized queue in Redis.
-   **Workers (`Keeper Worker`):** Multiple keeper instances act as workers. Each picks up a job (a vault address) from the queue. The queue system ensures that a job is delivered to only one worker at a time, eliminating redundant work.
-   **Transaction Signer (Optional, but ideal):** To resolve nonce collision, workers would not have private keys. Upon deciding to liquidate, they would submit a "liquidation order" to a single centralized service, the `Transaction Signer`. This would be the only component with access to the private key, responsible for managing the nonce and sending transactions in series to the blockchain.
