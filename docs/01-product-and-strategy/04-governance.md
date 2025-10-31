# 4. SCC Protocol Governance

This document describes the architecture and operation of the on-chain governance system of the SCC protocol. The goal is to ensure a decentralized, transparent, and secure decision-making process, transferring administrative control from the developers to the holders of the governance token (`SCC-GOV`).

The governance model is based on the robust and secure implementations of the OpenZeppelin Contracts library.

## 4.1. Governance Architecture Diagram

The flow of a governance proposal follows a well-defined cycle, ensuring security and time for community review:

```mermaid
graph TD
    A[Proposer] -- creates --> B(Proposal in SCC_Governor);
    C{SCC_GOV Holders} -- vote --> B;
    B -- if approved --> D{Queue in TimelockController};
    subgraph Voting Period
        C
    end
    subgraph Security Delay
        D
    end
    D -- after delay --> E[Proposal Execution];
    E -- modifies --> F[Protocol Contracts (e.g., LiquidationManager)];
```

## 4.2. Main Components

The governance system is composed of three main contracts that interact to orchestrate the process of voting and executing proposals.

### 4.2.1. Governance Token (`SCC-GOV`)

*   **Standard:** `ERC20Votes` (an extension of ERC20).
*   **Functionality:** `SCC-GOV` incorporates voting functionality, allowing for the registration of balance history "checkpoints". This is crucial for determining a user's voting power at a specific block (usually the block in which the proposal was created), preventing vote manipulation.
*   **Delegation:** For their tokens to be counted in votes, users must delegate their voting power to themselves or another address.

### 4.2.2. Timelock (`TimelockController`)

*   **Standard:** `TimelockController` from OpenZeppelin.
*   **Function:** Acts as the **owner** of all protocol contracts that have administrative functions (e.g., `LiquidationManager`, `VaultFactory`).
*   **Security:** No administrative change is instantaneous. An approved governance proposal must be "queued" in the `TimelockController`. Only after a security period (`minDelay`) can the transaction be "executed". This delay gives the community time to audit the change and react to malicious proposals.

### 4.2.3. Governor Contract (`SCC_Governor`)

*   **Standard:** `Governor` from OpenZeppelin, with extensions like `GovernorCountingSimple`, `GovernorVotes`, `GovernorVotesQuorumFraction`, and `GovernorTimelockControl`.
*   **Function:** It is the central contract that orchestrates the entire voting process and interaction with the `TimelockController`.
*   **Configuration Parameters (defined in `SCC_Governor.sol`):
    *   `INITIAL_VOTING_DELAY`: 1 block (voting starts 1 block after the proposal is created).
    *   `INITIAL_VOTING_PERIOD`: 45818 blocks (approximately 1 week, considering a block time of 12 seconds).
    *   `INITIAL_PROPOSAL_THRESHOLD`: 0 (any `SCC-GOV` holder can create a proposal, although this can be changed via governance).
    *   `INITIAL_QUORUM_PERCENT`: 4% (4% of the total votes must participate for the vote to be valid).
*   **Functionalities:**
    *   **Proposal Creation:** Manages the creation of proposals, which specify the actions to be executed (e.g., changing a parameter in another contract).
    *   **Voting Period:** Controls the time during which `SCC-GOV` holders can vote.
    *   **Quorum and Vote Counting:** Ensures that the vote reaches the minimum quorum and counts the "For", "Against", and "Abstain" votes.
    *   **Execution:** If a proposal is approved, `SCC_Governor` has the exclusive permission to queue the proposal in the `TimelockController` and, after the delay, command its execution.

## 4.3. Proposal Lifecycle

1.  **Creation:** A user with sufficient voting power creates a proposal, detailing the actions to be executed (e.g., `setMinimumCollateralizationRatio(160)` in `SCC_Parameters`).
2.  **Voting:** The proposal enters a voting period. `SCC-GOV` holders (who have delegated their votes) vote.
3.  **Success/Failure:** At the end of the voting period, if the quorum has been reached and the "For" votes exceed the "Against" votes, the proposal is considered successful.
4.  **Queueing (`queue`):** Anyone can call the `queue` function in `SCC_Governor`, which then sends the proposal to the `TimelockController`.
5.  **Execution (`execute`):** After the `TimelockController`'s security delay ends, anyone can call the `execute` function in `SCC_Governor`, which instructs the `TimelockController` to execute the original proposal transaction, applying the changes to the protocol.
