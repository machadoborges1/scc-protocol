# Subgraph Architecture - SCC Protocol

**Status:** Proposed

## 1. Overview

The SCC Protocol Subgraph serves as the data indexing layer, responsible for transforming raw blockchain events and states into a structured, performant, and easily queryable GraphQL API. It is the backbone for obtaining data for the DApp (frontend), protocol analysis, and external monitoring.

The design is based on listening to events emitted by the core smart contracts and updating a set of data entities that represent the state of the protocol.

## 2. Data Model (`schema.graphql`)

The following entities form the core of our data model. They are designed to be efficient and provide a complete view of the protocol.

### Main Entities

-   **`Protocol` (Singleton):**
    -   Description: A unique entity that aggregates global protocol statistics.
    -   Fields: `id`, `totalVaults`, `totalCollateralValueUSD`, `totalDebt`, `activeAuctions`, `totalStakedGOV`.

-   **`User`:**
    -   Description: Represents a user account that interacts with the protocol.
    -   Fields: `id` (user address), `vaults` (`@derivedFrom` relationship), `stakingPosition` (relationship), `votes` (`@derivedFrom` relationship).

-   **`Token`:**
    -   Description: Represents a token used in the system (Collateral, SCC-USD, SCC-GOV).
    -   Fields: `id` (token address), `symbol`, `name`, `decimals`, `totalStaked` (if applicable).

-   **`Vault`:**
    -   Description: The central entity, representing a Collateralized Debt Position (CDP).
    -   Fields: `id` (vault address), `owner` (relationship with `User`), `collateralToken` (relationship with `Token`), `collateralAmount`, `debtAmount`, `createdAtTimestamp`, `updates` (`@derivedFrom` relationship).

-   **`VaultUpdate`:**
    -   Description: Records a historical event for a specific `Vault` (deposit, withdrawal, mint, burn).
    -   Fields: `id` (tx hash + log index), `vault` (relationship), `type` (enum: DEPOSIT, WITHDRAW, MINT, BURN), `amount`, `timestamp`.

### Module Entities

-   **`LiquidationAuction`:**
    -   Description: Tracks the state of a liquidation auction.
    -   Fields: `id` (auction ID), `vault` (relationship), `status` (enum: Active, Closed), `collateralAmount`, `debtToCover`, `startTime`, `startPrice`, `buyer` (if applicable).

-   **`StakingPosition`:**
    -   Description: Tracks a user's staking position in the `StakingPool`.
    -   Campos: `id` (staker's address), `user` (relationship), `amountStaked`, `rewardsClaimed`.

-   **`GovernanceProposal`:**
    -   Description: Tracks the lifecycle of a governance proposal.
    -   Fields: `id` (proposal ID), `proposer` (relationship with `User`), `status` (enum: Pending, Active, Succeeded, Defeated, Executed), `description`, `forVotes`, `againstVotes`, `abstainVotes`.

-   **`Vote`:**
    -   Description: Tracks an individual vote on a proposal.
    -   Fields: `id` (proposer ID + voter address), `proposal` (relationship), `voter` (relationship with `User`), `support` (enum: For, Against, Abstain), `weight`.

# Subgraph Architecture - SCC Protocol

**Status:** In Progress

## 1. Overview

The SCC Protocol Subgraph serves as the data indexing layer, responsible for transforming raw blockchain events and states into a structured, performant, and easily queryable GraphQL API. It is the backbone for obtaining data for the DApp (frontend), protocol analysis, and external monitoring.

The design is based on listening to events emitted by the core smart contracts and updating a set of data entities that represent the state of the protocol.

## 2. Data Model (`schema.graphql`)

The following entities form the core of our data model. They are designed to be efficient and provide a complete view of the protocol.

### Main Entities

-   **`Protocol` (Singleton):**
    -   Description: A unique entity that aggregates global protocol statistics.
    -   Fields: `id`, `totalVaults`, `totalCollateralValueUSD`, `totalDebt`, `activeAuctions`, `totalStakedGOV`.

-   **`User`:**
    -   Description: Represents a user account that interacts with the protocol.
    -   Fields: `id` (user address), `vaults` (`@derivedFrom` relationship), `stakingPosition` (relationship), `votes` (`@derivedFrom` relationship).

-   **`Token`:**
    -   Description: Represents a token used in the system (Collateral, SCC-USD, SCC-GOV).
    -   Fields: `id` (token address), `symbol`, `name`, `decimals`, `totalStaked` (if applicable).

-   **`Vault`:**
    -   Description: The central entity, representing a Collateralized Debt Position (CDP).
    -   Fields: `id` (vault address), `owner` (relationship with `User`), `collateralToken` (relationship with `Token`), `collateralAmount`, `debtAmount`, `createdAtTimestamp`, `updates` (`@derivedFrom` relationship).

-   **`VaultUpdate`:**
    -   Description: Records a historical event for a specific `Vault` (deposit, withdrawal, mint, burn).
    -   Fields: `id` (tx hash + log index), `vault` (relationship), `type` (enum: DEPOSIT, WITHDRAW, MINT, BURN), `amount`, `timestamp`.

### Module Entities

-   **`LiquidationAuction`:**
    -   Description: Tracks the state of a liquidation auction.
    -   Fields: `id` (auction ID), `vault` (relationship), `status` (enum: Active, Closed), `collateralAmount`, `debtToCover`, `startTime`, `startPrice`, `buyer` (if applicable).

-   **`StakingPosition`:**
    -   Description: Tracks a user's staking position in the `StakingPool`.
    -   Fields: `id` (staker's address), `user` (relationship), `amountStaked`, `rewardsClaimed`.

-   **`GovernanceProposal`:**
    -   Description: Tracks the lifecycle of a governance proposal.
    -   Fields: `id` (proposal ID), `proposer` (relationship with `User`), `status` (enum: Pending, Active, Succeeded, Defeated, Executed), `description`, `forVotes`, `againstVotes`, `abstainVotes`.

-   **`Vote`:**
    -   Description: Tracks an individual vote on a proposal.
    -   Fields: `id` (proposer ID + voter address), `proposal` (relationship), `voter` (relationship with `User`), `support` (enum: For, Against, Abstain), `weight`.

## 3. Data Sources and Mappings (`subgraph.yaml`)

The Subgraph uses a combination of static and dynamic data sources (templates) to efficiently index all aspects of the protocol. Each data source is associated with a mapping file in `src/mappings/` that contains the data transformation logic.

### `src/mappings/vault-factory.ts`

-   **Monitored Contract:** `VaultFactory`
-   **Responsibility:** Entry point for the discovery of new Vaults.
-   **Main Handler:** `handleVaultCreated(event: VaultCreated)`
-   **Logic:**
    1.  Creates or updates the `Protocol` singleton entity, incrementing the `totalVaults` counter.
    2.  Creates a `User` entity for the Vault owner, if it does not already exist.
    3.  Creates the main `Vault` entity, associating it with the owner and setting its initial values.
    4.  **Critical Action:** Starts the dynamic indexing of the new `Vault` contract using `VaultTemplate.create()`. This allows the subgraph to listen for specific events from that individual Vault.

### `src/mappings/vault.ts` (Template)

-   **Monitored Contract:** Individual `Vault` instances (created dynamically).
-   **Responsibility:** Track the lifecycle and state changes of a single Vault.
-   **Handlers:**
    -   `handleCollateralDeposited` and `handleCollateralWithdrawn`: Update the `collateralAmount` field of the `Vault` entity.
    -   `handleSccUsdMinted` and `handleSccUsdBurned`: Update the `debtAmount` field of the `Vault` entity.
-   **Common Logic:** All handlers in this file also create a `VaultUpdate` entity for each event, recording an immutable history of all operations performed on the Vault.

### `src/mappings/liquidation-manager.ts`

-   **Monitored Contract:** `LiquidationManager`
-   **Responsibility:** Index the complete lifecycle of liquidation auctions.
-   **Handlers:**
    -   `handleAuctionStarted`: Creates a new `LiquidationAuction` entity, sets its status to `Active`, and associates it with the corresponding `Vault` entity.
    -   `handleAuctionBought`: Updates an existing `LiquidationAuction`, recording the buyer (`buyer`), the amount of collateral purchased, and the debt paid.
    -   `handleAuctionClosed`: Finalizes the auction, updating its status to `Closed` and recording the closing timestamp.

### `src/mappings/staking-pool.ts`

-   **Monitored Contract:** `StakingPool`
-   **Responsibility:** Track staking positions and reward redemptions.
-   **Handlers:**
    -   `handleStaked` and `handleUnstaked`: Create or update a user's `StakingPosition` entity, adjusting the `amountStaked` field.
    -   `handleRewardPaid`: Updates the total `rewardsClaimed` in the `StakingPosition` and creates a `RewardEvent` entity for the historical record.

### Future Mappings

-   **`governance.ts`:** Will be responsible for indexing the creation of proposals, votes, and the governance lifecycle, as defined in Milestone 4 of the development plan.