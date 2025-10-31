# Development Plan - SCC Protocol Frontend

**Status:** Updated

This document describes the phased development plan for the implementation and finalization of the SCC protocol's DApp (Frontend).

## Milestone 1: Project Foundation and Core UI (Completed)

**Objective:** Set up the project structure, install dependencies, and build the base application layout with essential UI components.

-   [x] **Task 1.1:** Create the project with Vite, React, TypeScript, TailwindCSS, and ESLint.
-   [x] **Task 1.2:** Install UI dependencies: `shadcn/ui`, `recharts`, `react-router-dom`.
-   [x] **Task 1.3:** Configure `shadcn/ui` and the base theme (dark/light mode).
-   [x] **Task 1.4:** Implement the main layout components: `Header` (with navigation) and page structure.
-   [x] **Task 1.5:** Create the pages and UI components for all main sections (Dashboard, Vaults, Staking, etc.) with mocked data.
-   [x] **Task 1.6:** Create the initial project documentation.

## Milestone 2: Web3 Connectivity and Data Reading

**Objective:** Integrate the frontend with the blockchain and the Subgraph to display real data from the protocol and the user.

-   [ ] **Task 2.1:** Install and configure `wagmi`, `viem`, and `RainbowKit`. *(Partially completed, requires local network configuration)*.
-   [ ] **Task 2.2:** Implement the `ConnectWallet` button in the Header. *(Partially completed)*.
-   [ ] **Task 2.3:** Implement a GraphQL service to communicate with the Subgraph API. *(Completed)*.
-   [x] **Task 2.4:** Replace the mocked data in the Dashboard Module (ProtocolStats). *(Completed, auction counter bug fixed)*.
-   [x] **Task 2.4.1 (Subgraph):** Add `collateralValueUSD` and `debtValueUSD` fields to the `Vault` entity. *(Completed)*.
-   [x] **Task 2.4.2 (Subgraph):** Create integration tests to validate the new `Vault` entity fields. *(Completed)*.
-   [ ] **Task 2.5:** Replace the mocked data in the Vaults Module with real data from the Subgraph (`useUserVaults`).
-   [ ] **Task 2.6:** Connect the Auctions page to the real data from the Subgraph.
-   [ ] **Task 2.7:** Connect the Staking page to the real data from the Subgraph.
-   [ ] **Task 2.8:** Connect the Governance page to the real data from the Subgraph.
-   [ ] **Task 2.9:** Connect the "Recent Activity" feed on the Dashboard.

## Milestone 3: On-chain Interaction (Writing) (Completed)

**Objective:** Enable user interaction with the smart contracts, allowing for the modification of the blockchain state.

-   [x] **Task 3.1:** Implement the **Vault creation** functionality (call to `VaultFactory.createNewVault()`). *(Completed)*
-   [x] **Task 3.2:** Implement the forms and transaction logic for **Vault management**: *(Completed)*
    -   [x] Deposit and Withdraw Collateral (`depositCollateral`, `withdrawCollateral`).
    -   [x] Generate (Mint) and Repay (Burn) Debt (`mint`, `burn`).
-   [x] **Task 3.3:** Implement the Staking Module: *(Completed)*
    -   [x] Logic for `stake`, `unstake`, and `getReward` in the `StakingPool`.
-   [x] **Task 3.4:** Implement the Auctions Module: *(Completed)*
    -   [x] Logic for `buy` in the `LiquidationManager`.
-   [x] **Task 3.5:** Implement the Governance Module: *(Completed)*
    -   [x] Logic for `delegate` and `castVote`.
-   [x] **Task 3.6:** Implement a notification system (`toasts`) for transaction feedback (pending, success, error). *(Completed)*

## Milestone 4: Testing and Deployment

**Objective:** Ensure code quality, prepare the DApp for production, and automate the deployment process.

-   [ ] **Task 4.1:** Configure the project on Vercel or a similar platform.
-   [ ] **Task 4.2:** Create a CI/CD workflow in GitHub Actions to run `lint` and `build` on each PR.
-   [ ] **Task 4.3:** Add unit tests for critical hooks and components.
-   [ ] **Task 4.4:** Perform full integration tests for all user flows.
-   [ ] **Task 4.5:** Final review of the documentation and UI responsiveness.

## Milestone 5: Historical Analysis and Advanced Data (Proposed)

**Objective:** Enrich the dashboard with charts and historical data, implementing a more advanced subgraph architecture.

-   [ ] **Task 5.1:** Refactor the Subgraph schema (`schema.graphql`) to include daily snapshot entities (e.g., `ProtocolDayData`, `VaultDayData`).
-   [ ] **Task 5.2:** Implement the daily aggregation logic in the subgraph mappings to populate the new entities.
-   [ ] **Task 5.3:** Connect the Dashboard's chart components (TVL, CR, etc.) to consume the new daily snapshot data.
