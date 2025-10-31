# Development Plan - Subgraph

**Status:** In Progress

This document describes the phased development plan for the implementation of the SCC protocol's Subgraph.

## Milestone 1: Project Structure and Vault Indexing

**Objective:** Have a functional subgraph that can track the creation and basic state of all Vaults.

-   [x] **Task 1.1:** Initialize the Subgraph project (`package.json`, `tsconfig.json`).
-   [x] **Task 1.2:** Define the initial `schema.graphql` with the `Protocol`, `User`, `Token`, and `Vault` entities.
-   [x] **Task 1.3:** Configure `subgraph.yaml` with the `VaultFactory` data source and a `template` for the `Vaults`.
-   [x] **Task 1.4:** Implement the `handleVaultCreated` handler in `src/vault-factory.ts` to create the `Vault` and `User` entities, and instantiate the dynamic template.
-   [x] **Task 1.5:** Implement the `Vault` template handlers (`handleDepositCollateral`, `handleWithdrawCollateral`, `handleMint`, `handleBurn`) in `src/vault.ts` to update the `Vault`'s state.
-   [x] **Task 1.6:** Write unit tests for the Milestone 1 handlers.

## Milestone 2: Liquidation Indexing

**Objective:** Track the entire lifecycle of liquidations.

-   [x] **Task 2.1:** Add the `LiquidationAuction` entity to `schema.graphql`.
-   [x] **Task 2.2:** Add the `LiquidationManager` as a data source in `subgraph.yaml`.
-   [x] **Task 2.3:** Implement the `handleAuctionStarted` handler to create the `LiquidationAuction` entity and link it to the corresponding `Vault`.
-   [x] **Task 2.4:** Implement the `handleAuctionBought` handler to update the auction's state (buyer, amount paid).
-   [x] **Task 2.5:** Implement the `handleAuctionClosed` handler to mark the auction as finished.
-   [x] **Task 2.6:** Write unit tests for the liquidation handlers.

## Milestone 3: Staking and Reward Indexing

**Objective:** Provide data on SCC-GOV staking and distributed rewards.

-   [x] **Task 3.1:** Add the `StakingPosition` and `RewardEvent` entities to `schema.graphql`.
-   [x] **Task 3.2:** Add the `StakingPool` as a data source in `subgraph.yaml`.
-   [x] **Task 3.3:** Implement the `handleStaked` and `handleUnstaked` handlers to create and update a user's `StakingPosition` entity.
-   [x] **Task 3.4:** Implement the `handleRewardPaid` handler to record reward redemption events.
- [x] **Task 3.5:** Write unit tests for the staking handlers.

## Milestone 4: Governance Indexing

**Objective:** Track the on-chain governance process.

- [x] **Task 4.1:** Add the `GovernanceProposal` and `Vote` entities to `schema.graphql`.
- [x] **Task 4.2:** Add the `SCC_Governor` as a data source in `subgraph.yaml`.
- [x] **Task 4.3:** Implement the `handleProposalCreated` handler to create the `GovernanceProposal` entity.
- [x] **Task 4.4:** Implement the `handleVoteCast` handler to create the `Vote` entity and update the counters in the proposal.
- [x] **Task 4.5:** Implement handlers for the final states of the proposal (`ProposalCanceled`, `ProposalExecuted`).
- [x] **Task 4.6:** Write unit tests for the governance handlers.

## Milestone 5: Integration Testing and Deployment

**Objective:** Ensure the robustness of the Subgraph and prepare it for production.

-   [x] **Task 5.1:** Configure the local integration testing environment.
    -   [x] Add the `graph-node`, `ipfs`, and `postgres` services to the project's main `docker-compose.yml`.
    -   [x] Ensure that the services communicate correctly with the Anvil network.
-   [x] **Task 5.2:** Automate the address configuration of `subgraph.yaml`.
    -   [x] Create a `subgraph.template.yaml` file that uses placeholders for contract addresses and the deploy block.
    -   [x] Create a script (e.g., `prepare-subgraph.js`) that reads the Hardhat/Foundry deployment artifacts (`run-latest.json`) and generates the final `subgraph.yaml`.
    -   [x] Add an `npm run prepare:subgraph` command in `package.json` to run the script.
-   [x] **Task 5.3:** Implement the integration tests.
    -   [x] Configure a test runner (e.g., Jest) to orchestrate the tests.
    -   [x] Write test scripts that:
        1.  Deploy the contracts on the Anvil network.
        2.  Run the `prepare:subgraph` script.
        3.  Deploy the subgraph to the local `graph-node`.
        4.  Perform on-chain transactions (e.g., create a vault, deposit collateral).
        5.  Query the `graph-node`'s GraphQL API to validate that the data was indexed correctly.
-   [x] **Task 5.4:** Document the local testing and deployment workflow.
-   [ ] **Task 5.5:** Prepare for deployment on a Testnet (e.g., Sepolia).
-   [ ] **Task 5.6:** Deploy on Mainnet.

## Milestone 6: Schema Improvements and Refinements

**Objective:** Improve the entities to provide more comprehensive data aligned with business requirements.

-   [x] **Task 6.1:** Add the `debtToken` field to the `Vault` entity in `schema.graphql`.
-   [x] **Task 6.2:** Add the `status` field and the `VaultStatus` enum to the `Vault` entity in `schema.graphql`.
-   [x] **Task 6.3:** Update `vault-factory.ts` to set the initial `debtToken` and `status` on new vault creation.
-   [x] **Task 6.4:** Update `liquidation-manager.ts` to change the vault's `status` during the liquidation lifecycle.
-   [x] **Task 6.5:** Update the integration tests to verify the new Vault fields.
-   [x] **Task 6.6:** Add the `stakingToken`, `createdAtTimestamp`, and `lastUpdatedAtTimestamp` fields to the `StakingPosition` entity in `schema.graphql`.
-   [x] **Task 6.7:** Update `staking-pool.ts` to populate and update the new fields in the `StakingPosition` entity.
-   [x] **Task 6.8:** Update the integration tests to verify the new `StakingPosition` fields.
-   [ ] **Task 6.9:** Debug and fix the failure in creating the `StakingPosition` entity.
