# Frontend Requirements for the SCC Protocol

This document details the technical and functional requirements for building the user interface (dApp) of the SCC protocol. It is generated from the analysis of the protocol's source code and documentation to serve as a blueprint for the development team.

## 1. Frontend Overview and Objectives

The main objective of the dApp is to provide a secure, intuitive, and reactive interface for users to interact with all the functionalities of the SCC protocol. The application should allow users to:

- Manage their collateralized debt positions (Vaults).
- Participate in the security and revenue of the protocol through staking.
- Participate in on-chain governance by voting on proposals.
- Monitor the overall health of the protocol and their own positions.
- Participate in liquidation auctions.

## 2. UI Architecture and Routes

The application will be a Single Page Application (SPA) with the following main routes and components:

| Route | Page | Key Components | Main Data (Subgraph) |
| :--- | :--- | :--- | :--- |
| `/` or `/dashboard` | Main Dashboard | `ProtocolStats`, `UserSummary`, `ActiveAuctionsPreview` | `protocol`, `user` |
| `/vaults` | My Vaults | `VaultsTable`, `CreateVaultButton` | `user.vaults` |
| `/vaults/[id]` | Vault Management | `VaultManagementPanel`, `VaultHealthChart`, `VaultHistory` | `vault`, `vault.updates` |
| `/auctions` | Liquidation Auctions | `AuctionsList` | `liquidationAuctions` |
| `/staking` | SCC-GOV Staking | `StakingPanel`, `UserRewardsSummary` | `stakingPosition` |
| `/governance` | Governance Proposals | `ProposalsList` | `governanceProposals` |
| `/governance/[id]` | Proposal Details | `ProposalDetails`, `VoteButtons`, `VotersList` | `governanceProposal`, `proposal.votes` |

## 3. Detailed User Flows

### 3.1. Vault Creation and Management
1.  **Connection:** User connects their wallet via the `ConnectWallet` button.
2.  **Creation:** On the `/vaults` page, the user clicks "Create New Vault". This triggers a transaction to `VaultFactory.createNewVault()`. After confirmation, the user is redirected to the new vault's page `/vaults/[new_vault_address]`.
3.  **Collateral Deposit:** On the vault page, the user enters an amount in the deposit form. They first sign an `approve()` transaction for the collateral token (WETH) and then sign the `vault.depositCollateral(amount)` transaction.
4.  **Debt Issuance (Mint):** The user enters an amount of SCC-USD to be issued. The UI calculates and displays the resulting CR (Collateralization Ratio) in real-time. If the CR is above the minimum, the user signs `vault.mint(amount)`.
5.  **Debt Repayment (Burn):** The user enters an amount of SCC-USD to be repaid. They first sign `approve()` for the SCC-USD token and then sign `vault.burn(amount)`.
6.  **Collateral Withdrawal:** The user enters an amount of collateral to be withdrawn. The UI validates that the withdrawal will not leave the vault undercollateralized. If valid, the user signs `vault.withdrawCollateral(amount)`.

### 3.2. SCC-GOV Staking
1.  **Navigation:** User accesses the `/staking` page.
2.  **Stake:** The user enters the amount of SCC-GOV to stake. They sign `approve()` for the SCC-GOV token and then `stakingPool.stake(amount)`.
3.  **Reward Redemption:** The UI displays the accumulated rewards. The user clicks "Redeem" and signs `stakingPool.getReward()`.
4.  **Unstake:** The user enters the amount to be withdrawn and signs `stakingPool.unstake(amount)`.

### 3.3. Participation in Auctions
1.  **Navigation:** User accesses the `/auctions` page.
2.  **View:** The UI displays a list of active auctions, showing the collateral for sale and the current price (which decays over time).
3.  **Purchase:** The user selects an auction, enters the amount of collateral they want to buy, signs `approve()` for SCC-USD, and then signs `liquidationManager.buy(auctionId, amount)`.

### 3.4. Governance
1.  **Delegation:** If it's their first time, the UI should allow the user to delegate their voting power to their own address via `sccGOV.delegate(self)`.
2.  **View:** User accesses `/governance` and sees the list of proposals and their statuses.
3.  **Voting:** User clicks on an active proposal, reads the details, and clicks "For", "Against", or "Abstain", which triggers the `governor.castVote(proposalId, support)` transaction.

## 4. On-chain Interactions (Contracts)

The frontend will need interfaces to call the following smart contract functions:

-   **VaultFactory:** `createNewVault()`
-   **Vault:** `depositCollateral(uint256)`, `withdrawCollateral(uint256)`, `mint(uint256)`, `burn(uint256)`
-   **LiquidationManager:** `buy(uint256, uint256)`
-   **StakingPool:** `stake(uint256)`, `unstake(uint256)`, `getReward()`
-   **SCC_Governor:** `castVote(uint256, uint8)`, `delegate(address)`
-   **ERC20 Tokens (WETH, SCC-GOV, SCC-USD):** `approve(address, uint256)`, `balanceOf(address)`

## 5. Data Requirements (The Graph)

The frontend should use the Subgraph's GraphQL API to fetch data.

-   **Dashboard:** Query for the `protocol(id: "scc-protocol")` entity to get `totalVaults`, `totalCollateralValueUSD`, `totalDebtUSD`.
-   **Vaults Page:** Query for `user(id: "[user_address]").vaults` to list the user's vaults. Each vault should include `id`, `collateralAmount`, `debtAmount`, `collateralizationRatio`.
-   **Auctions Page:** Query for `liquidationAuctions(where: {status: "Active"})` to list active auctions.
-   **Staking Page:** Query for `stakingPosition(id: "[user_address]")` to get `amountStaked` and `rewardsClaimed`.
-   **Governance Page:** Query for `governanceProposals` ordered by `createdAtTimestamp`.
-   **Proposal Details:** Query for `governanceProposal(id: "[proposal_id]")` and `votes(where: {proposal: "[proposal_id]"})`.

## 6. UX and Security Patterns for dApps

-   **Transaction Feedback:** Every transaction should display clear feedback with its status: "Pending", "Confirmed", or "Failed", ideally with a link to the block explorer.
-   **Loading States:** The UI should display loading indicators (`spinners`, `skeletons`) while data from the subgraph or blockchain is being fetched.
-   **Formatting:** Addresses should be shortened (e.g., `0x1234...5678`), and large numerical values should be formatted for easy reading (e.g., `1,500,000.00 SCC-USD`).
-   **Input Validation:** Forms should have validation to prevent users from entering invalid values (e.g., withdrawing more collateral than allowed).
-   **Wallet Connection:** The UI should prominently display the connected address, network, and ETH balance. It should alert the user if they are on an incorrect network.

## 7. Technology Suggestions

-   **Framework:** Next.js (with App Router)
-   **Language:** TypeScript
-   **Web3 Interaction:** `wagmi` and `viem`
-   **UI Kit:** `shadcn/ui`
-   **Wallet Connection:** RainbowKit or Web3Modal
-   **Charts:** Recharts or Tremor
-   **Styling:** Tailwind CSS
-   **State Management:** Zustand or Jotai for simple global state.

## 8. Implementation and Validation Checklist

-   [ ] Wallet Connection module implemented and functional.
-   [ ] Dashboard correctly displays protocol statistics.
-   [ ] Vault creation flow (`createNewVault` transaction) works.
-   [ ] Collateral deposit and withdrawal flow works, with validations.
-   [ ] Debt issuance and repayment flow (mint/burn) works, with validations.
-   [ ] Staking page allows stake, unstake, and reward redemption.
-   [ ] Auctions page displays active auctions.
-   [ ] Governance page displays proposals.
-   [ ] Proposal voting flow works.
-   [ ] All inputs are validated and all loading/error states are handled.
