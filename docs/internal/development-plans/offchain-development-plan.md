# Development Plan - Off-chain Keeper Bot (Revised)

This document tracks the development progress of the SCC protocol's off-chain services, starting with the liquidation bot (Keeper).

## Milestone 1: TypeScript Project Setup and Quality Tools

**Status:** Completed

-   [x] **Task 1.1:** Add development dependencies.
-   [x] **Task 1.2:** Add production dependencies.
-   [x] **Task 1.3:** Create and configure the `tsconfig.json` file.
-   [x] **Task 1.4:** Add scripts to `package.json`.
-   [x] **Task 1.5:** Configure linter (ESLint) and formatter (Prettier).

## Milestone 2: Main Structure and Connectivity

**Status:** Completed

-   [x] **Task 2.1:** Create the `src` directory structure and the main `index.ts` file.
-   [x] **Task 2.2:** Implement the logic for connecting to an Ethereum node (`rpc` and `contracts`).
-   [x] **Task 2.3:** Implement a main orchestrator in `index.ts`.
-   [x] **Task 2.4:** Add a structured logging system (`pino`).
-   [x] **Task 2.5:** Implement error handling with **exponential backoff** for RPC calls.
-   [x] **Task 2.6:** Add logic for graceful shutdown (`SIGINT`/`SIGTERM`).
-   [x] **Task 2.7:** Code Documentation (JSDoc/TSDoc).
-   [x] **Task 2.8:** Create `offchain/docs/ARCHITECTURE.md`.

## Milestone 3: Efficient Vault Monitoring (Producer/Consumer)

**Status:** Completed

-   [x] **Task 3.1:** Implement `vaultDiscovery.ts` to find vaults via `VaultCreated` events.
-   [x] **Task 3.2:** Implement `vaultMonitor.ts` to read the state of Vaults and calculate the CR.
-   [x] **Task 3.3:** Implement a queue system (in-memory or external) for communication between `vaultDiscovery` and `vaultMonitor`.
-   [x] **Task 3.4:** Implement a local cache (in `vaultMonitor`) for Vault states and prices to optimize RPC calls.
-   [x] **Task 3.5:** **(Advanced)** Make `vaultDiscovery` listen for state change events (e.g., `CollateralDeposited`) to reprioritize vaults in the queue.
-   [x] **Task 3.6:** Implement the removal of inactive vaults from the monitoring list (listen for events like `AuctionClosed`).

## Milestone 4: Liquidation Strategy Module (`LiquidationStrategy`)

**Status:** Completed

-   [x] **Task 4.1:** Create the `liquidationStrategy.ts` service.
-   [x] **Task 4.2:** Implement the logic to receive liquidation candidates from `vaultMonitor`.
-   [x] **Task 4.3:** Implement **profitability analysis**, comparing the liquidation benefit with the estimated gas cost.
-   [x] **Task 4.4:** Add a check to not liquidate `Vaults` that already have an active auction (handled in the smart contract).
-   [x] **Task 4.5:** Implement a throttling or queue mechanism to limit the number of simultaneous liquidations sent to the `TransactionManager`.

## Milestone 5: Transaction Execution Module (`TransactionManager`)

**Status:** Completed

-   [x] **Task 5.1:** Create the `transactionManager.ts` service.
-   [x] **Task 5.2:** Implement an interface to receive execution orders from `LiquidationStrategy`.
-   [x] **Task 5.3:** Implement **explicit nonce management** for the keeper's wallet.
-   [x] **Task 5.5:** Implement transaction simulation (`viem` does this by default).
-   [x] **Task 5.4:** Implement a **dynamic gas price strategy** (EIP-1559 with adjustable `maxFee perGas` and `maxPriorityFeePerGas`).
-   [x] **Task 5.6:** Implement monitoring of sent transactions and logic to **replace stuck transactions** with a higher gas price.
-   [x] **Task 5.7:** Add robust error handling and detailed logs for each execution step.

## Milestone 6: Testing, Observability, and Deployment

**Status:** Completed

-   [x] **Task 6.1:** Write unit tests for critical functions (e.g., CR calculation, profitability analysis).
-   [x] **Task 6.2:** Write and fix integration tests for the full flow on a local blockchain (Anvil).
-   [x] **Task 6.7:** Implement a resilient integration test architecture with Anvil and Jest.
-   [x] **Task 6.3:** Configure a metrics endpoint (Prometheus) in `index.ts`.
-   [x] **Task 6.4:** Define and expose key metrics for each module.
-   [x] **Task 6.5:** Integrate with an alert system (e.g., PagerDuty, Telegram).
-   [x] **Task 6.6:** Document the bot deployment process via Docker.

## Milestone 7: Developer Experience (DX)

**Status:** Completed

-   [x] **Task 7.1:** Automate the local development environment setup by creating a script (`prepare:env`) that generates the `.env` file from the deployment artifacts, eliminating the need for manual address updates.
