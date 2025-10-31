# 5. SCC Protocol Subgraph

The SCC Protocol Subgraph is an essential component for indexing and querying blockchain data. It transforms the raw events and states of smart contracts into an easily queryable GraphQL API, serving as the main data source for the frontend (DApp) and for analysis.

## 5.1. Overview

The Subgraph monitors the main contracts of the SCC protocol, such as `VaultFactory`, `SCC_USD`, `SCC_GOV`, `LiquidationManager`, `StakingPool`, `SCC_Governor`, and `TimelockController`. By listening to events emitted by these contracts, it persists the relevant data in a database, which can be accessed via GraphQL queries. This allows the frontend to display updated and historical information about the protocol without needing to directly query the blockchain for each piece of data.

## 5.2. Subgraph Components

A Subgraph is defined by three main files:

*   **`subgraph.yaml` (Subgraph Manifest):** The central configuration file. It defines which contracts to monitor, which events to listen to, which ABI files to use, and which mapping handler functions to execute for each event. This is where the network (e.g., `localhost`, `mainnet`) and contract addresses are configured.
*   **`schema.graphql` (Data Schema Definition):** Defines the data model (entities) that will be stored and queried. Each entity corresponds to a table in the Subgraph's database. The schema is crucial for the structure of the GraphQL API.
*   **`src/mappings/*.ts` (Mapping Files):** Contain the TypeScript logic (compiled to WebAssembly) that processes blockchain events and transforms them into entities defined in `schema.graphql`. Each contract event is mapped to a function that extracts the relevant data and saves it in the entity format.

## 5.3. Data Model (`schema.graphql`)

The `schema.graphql` defines the following main entities for the SCC protocol:

*   **`Protocol`:** A singleton entity that stores aggregated protocol data, such as `totalVaults`, `totalCollateralValueUSD`, `totalDebtUSD`, `activeAuctions`, `totalStakedGOV`, and governance parameters (`minCollateralizationRatio`, `priceDecayHalfLife`, `startPriceMultiplier`).
*   **`Token`:** Represents the ERC20 tokens involved in the protocol (e.g., `SCC-USD`, `SCC-GOV`, collateral tokens). Stores `symbol`, `name`, `decimals`, and the contract address.
*   **`TokenPrice`:** Records the price of a token in USD, with `lastUpdateBlockNumber` and `lastUpdateTimestamp`.
*   **`User`:** Represents a protocol user, with their wallet address as their ID. Contains references to the `Vaults` they own, their `StakingPosition`, and their `votes`.
*   **`Vault`:** Represents an individual `Vault`. Stores `owner`, `collateralToken`, `debtToken`, `status` (`Active`, `Liquidating`, `Liquidated`), `collateralAmount`, `collateralValueUSD`, `debtAmount`, `debtValueUSD`, `collateralizationRatio`, `createdAtTimestamp`, and references to `VaultUpdate` and `LiquidationAuction`.
*   **`VaultUpdate`:** Records each significant update to a `Vault` (e.g., `DEPOSIT`, `WITHDRAW`, `MINT`, `BURN`), with the `amount` and `timestamp`.
*   **`LiquidationAuction`:** Details of a liquidation auction, including `vault`, `status` (`Active`, `Bought`, `Closed`), `collateralAmount`, `debtToCover`, `startTime`, `startPrice`, `buyer`, `collateralBought`, `debtPaid`, and `closedAtTimestamp`.
*   **`StakingPosition`:** A user's staking position, with `user`, `stakingToken`, `amountStaked`, `rewardsClaimed`, `createdAtTimestamp`, `lastUpdatedAtTimestamp`, and `rewardEvents`.
*   **`RewardEvent`:** Records reward events for a `StakingPosition`.
*   **`GovernanceProposal`:** Details of a governance proposal, including `proposer`, `status` (`Pending`, `Active`, `Canceled`, `Defeated`, `Succeeded`, `Queued`, `Expired`, `Executed`), `targets`, `values`, `calldatas`, `description`, `forVotes`, `againstVotes`, `abstainVotes`, `createdAtTimestamp`, `executedAtTimestamp`, `canceledAtTimestamp`, and `votes`.
*   **`Vote`:** Records an individual vote on a governance proposal, with `proposal`, `voter`, `support` (`For`, `Against`, `Abstain`), `weight`, and `reason`.

## 5.4. Directory Structure (`subgraph/src/`)

The `subgraph/src/` directory contains:

*   **`generated/`:** Contains the TypeScript code automatically generated from `schema.graphql` and the contract ABIs. This code provides classes for interacting with the Subgraph's entities and events in a typed way.
*   **`mappings/`:** Contains the AssemblyScript files (compiled to WebAssembly) that implement the mapping logic. Each mapping file processes events from one or more contracts, extracting the relevant data and creating/updating the entities defined in `schema.graphql`.

## 5.5. Local Configuration and Development

Local Subgraph development involves configuring `subgraph.yaml` to monitor contracts on a local development network (like Anvil), generating code (`graph codegen`), building the Subgraph (`graph build`), and deploying it to a local Graph Node (`graph deploy`). This allows for testing and debugging the mappings before deploying to public networks.

## 5.6. Best Practices

To ensure the efficiency and maintainability of the Subgraph, the following best practices are followed:

*   **Entity Optimization:** Keep entities lean, storing only essential data.
*   **`@derivedFrom`:** Use this directive in `schema.graphql` to create virtual fields that derive from other entities, avoiding data duplication.
*   **Efficient Mappings:** Optimize the logic in the mapping files to minimize read/write operations to the database.
*   **`startBlock`:** Set the `startBlock` as high as possible (the contract's deployment block) to speed up the initial synchronization.
*   **Tests:** Write tests for the mappings to ensure the correct processing of events.