## User Story Documentation – SCC Protocol

### 1. End User Stories (Consumer)

Stories focused on the perspective of a user interacting with the system through a front-end interface.

---

#### **Role: Investor / Stablecoin Holder**

**Story 1: Minting Stablecoin**

> **As an** investor, **I want to** deposit my collateral (WETH) into a Vault and mint the SCC_USD stablecoin, **so that** I can have dollar liquidity without needing to sell my assets.

*   **Priority:** High
*   **Acceptance Criteria:**
    *   The user must be able to create a new Vault, which is represented as an NFT in their wallet.
    *   The user must be able to deposit WETH into their Vault.
    *   The system must allow the user to mint SCC_USD up to the limit determined by the minimum collateralization ratio (150%).
    *   The transaction must fail if the user tries to mint more SCC_USD than allowed.
    *   The minted SCC_USD must be transferred to the user's wallet.
*   **Components Involved:**
    *   Contracts: `VaultFactory`, `Vault`, `SCC_USD`, `OracleManager`.
    *   Services: Front-end (UI to manage the vault).

**Story 2: Burning Stablecoin to Redeem Collateral**

> **As an** investor, **I want to** repay my SCC_USD debt to be able to redeem my collateral (WETH), **so that** I can realize profits or exit my position.

*   **Priority:** High
*   **Acceptance Criteria:**
    *   The user must be able to burn their SCC_USD through their Vault.
    *   The amount of SCC_USD to be burned cannot be greater than the existing debt in the Vault.
    *   After burning the debt, the user must be able to withdraw a proportional (or total) amount of their collateral, as long as the minimum collateralization ratio is maintained.
    *   The withdrawn collateral (WETH) must be transferred back to the user's wallet.
*   **Components Involved:**
    *   Contracts: `Vault`, `SCC_USD`, `OracleManager`.
    *   Services: Front-end (UI).

---

#### **Role: Staker / Yield Farmer**

**Story 3: Staking Governance Tokens**

> **As an** ecosystem participant, **I want to** stake my governance tokens (SCC_GOV), **so that** I can receive rewards in SCC_USD and help secure the protocol.

*   **Priority:** Medium
*   **Acceptance Criteria:**
    *   The user must first approve the `StakingPool` contract to spend their SCC_GOV.
    *   The user must be able to call the `stake()` function to deposit the desired amount of SCC_GOV.
    *   The contract must correctly record the amount of staked tokens for that user.
    *   The front-end must display the total amount the user has staked and the accumulated rewards.
*   **Components Involved:**
    *   Contracts: `StakingPool`, `SCC_GOV` (token).
    *   Services: Front-end (staking UI), Subgraph (to display staking data).

---

#### **Role: Governance Member**

**Story 4: Voting on Proposals**

> **As a** SCC_GOV token holder, **I want to** vote on governance proposals (for, against, or abstain), **so that** I can actively participate in the decisions that affect the future of the protocol.

*   **Priority:** Medium
*   **Acceptance Criteria:**
    *   The interface must list all active governance proposals.
    *   The user must be able to see the details of each proposal (description, what it executes, etc.).
    *   The user must be able to submit their vote (For, Against, Abstain) through a transaction.
    *   The system must record the vote and the user's "voting power" (amount of tokens) at that time.
    *   Voting should not be allowed if the proposal is not in the voting period.
*   **Components Involved:**
    *   Contracts: `SCC_Governor`, `SCC_GOV` (to check voting power).
    *   Services: Front-end (governance UI), Subgraph (to display proposals and results).

***

### 2. Protocol / Infrastructure Stories

Stories focused on the perspective of the systems and operators that keep the protocol running securely and autonomously.

---

#### **Role: Operator / Keeper Bot**

**Story 5: Liquidation of Unhealthy Vaults**

> **As a** Keeper (bot), **I want to** continuously monitor the health of all Vaults and initiate a liquidation auction for any vault that falls below the minimum collateralization ratio, **so that** the protocol remains solvent and the risk of bad debt is minimized.

*   **Priority:** High
*   **Acceptance Criteria:**
    *   The bot must query the blockchain (or a subgraph) at regular intervals to get the list of all vaults.
    *   For each vault with debt, the bot must calculate its collateralization ratio using the latest oracle price.
    *   If the ratio is less than 150%, the bot must call the `startAuction()` function in the `LiquidationManager` contract.
    *   The bot must have logic to not attempt to liquidate a vault for which an auction is already active.
    *   The bot must manage its own gas (ETH) and have a strategy for handling transaction failures.
*   **Components Involved:**
    *   Services: **Keeper Bot** (`offchain` service).
    *   Contracts: `Vault`, `OracleManager`, `LiquidationManager`.

---

#### **Role: Indexer / The Graph Service**

**Story 6: Indexing Data for the Front-end**

> **As an** indexing service (The Graph), **I want to** listen to all events emitted by the protocol's contracts (VaultCreated, Staked, AuctionStarted, etc.), **so that** the front-end can query this data quickly and efficiently through a GraphQL API, without needing to query the blockchain directly.

*   **Priority:** High
*   **Acceptance Criteria:**
    *   The subgraph must have a "handler" for each relevant event emitted by the contracts.
    *   When a `VaultCreated` event is received, the `Vault` entity must be created and the `totalVaults` counter in the `Protocol` entity must be incremented.
    *   When an `AuctionStarted` event is received, the `LiquidationAuction` entity must be created with the status "Active" and the `activeAuctions` counter must be incremented.
    *   When an `AuctionClosed` event is received, the status of the `LiquidationAuction` must be updated and the `activeAuctions` counter must be decremented.
    *   The data must be available in the subgraph's API within a few seconds of the event's confirmation on the blockchain.
*   **Components Involved:**
    *   Services: **Subgraph** (`subgraph` service), Graph Node, IPFS.
    *   Contratos: All main contracts that emit events.