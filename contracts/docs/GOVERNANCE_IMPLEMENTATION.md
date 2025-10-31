# Technical Implementation of Governance

**Status:** Documented

## 1. Introduction

This document serves as a technical guide for developers on the implementation of the governance system in the SCC protocol. It complements the high-level architecture document, focusing on implementation details, the configuration flow during deployment, and the specific functions controlled by governance in each contract.

## 2. Main Components

Governance is composed of three OpenZeppelin contracts that work together:

-   **`SCC_GOV` (`ERC20Votes`):** The governance token. Its `Votes` functionality allows for the delegation of voting power and the capture of voter balance "snapshots" at the time of proposal creation, preventing the purchase of tokens to influence ongoing votes.
-   **`SCC_Governor` (`Governor`):** The brain of governance. It orchestrates the voting process, including proposal creation, the voting period, vote counting, and quorum. It is the only one with permission to queue proposals in the `TimelockController`.
-   **`TimelockController` (`TimelockController`):** The executor and guardian of the protocol. This contract is the **owner** of all other system contracts. It enforces a mandatory time delay between the approval of a proposal and its execution, acting as a critical safeguard for the protocol's security.

## 3. Configuration Flow in Deployment (`Deploy.s.sol`)

The deploy script (`Deploy.s.sol`) is responsible for correctly configuring the entire governance chain of command. The flow is as follows:

1.  **Contract Deployment:** All protocol contracts (`OracleManager`, `VaultFactory`, `LiquidationManager`, `StakingPool`, etc.) are deployed.
2.  **Governance Contract Deployment:** `SCC_GOV`, `TimelockController`, and `SCC_Governor` are deployed.
3.  **Timelock Configuration:**
    *   The Timelock's `PROPOSER_ROLE` is granted to the `SCC_Governor`.
    *   The Timelock's `EXECUTOR_ROLE` is granted to `address(0)` (anyone).
    *   The `TIMELOCK_ADMIN_ROLE` (the administrator of the Timelock itself) is renounced by the deployer and transferred to the Timelock itself. From this point on, only the Timelock can reconfigure itself, through a governance proposal.
4.  **Ownership Transfer:** The ownership of each protocol contract is transferred to the `TimelockController`'s address.
5.  **Granting Special Permissions:** The script grants specific permissions necessary for the system's operation, such as giving the `VaultFactory` the `AUTHORIZER_ROLE` in the `OracleManager` and the `MINTER_GRANTER_ROLE` in the `SCC_USD`.

At the end of the script, no external wallet (EOA) has administrative control over the protocol. Full control resides in the `TimelockController`, which in turn is controlled by the `SCC_Governor`.

## 4. Table of Governable Functions

The following table consolidates the main administrative functions that governance (via `TimelockController`) can execute on the protocol's contracts.

| Contract | Governable Function | Action Description |
| :--- | :--- | :--- |
| **`OracleManager`** | `setPriceFeed(address asset, address feed)` | Adds or updates the price oracle address for a collateral asset. |
| | `setAuthorization(address user, bool authorized)` | Authorizes or de-authorizes a contract (like a `Vault`) to use the `getPrice` function. |
| **`LiquidationManager`** | `withdrawFees(address recipient, uint256 amount)` | Withdraws the `SCC-USD` fees accumulated in the contract (from liquidations) to a destination address (e.g., `StakingPool`). |
| **`StakingPool`** | `notifyRewardAmount(uint256 reward, uint256 duration)` | Starts a new reward distribution period, depositing `SCC-USD` and setting the distribution duration. |
| **`SCC_USD`** | `grantRole(bytes32 role, address account)` | Grants access roles, such as `MINTER_ROLE` or `MINTER_GRANTER_ROLE`. |
| | `revokeRole(bytes32 role, address account)` | Revokes access roles. |
| **`VaultFactory`** | `N/A` | The `VaultFactory` is immutable by design. To change its parameters, governance must deploy a new factory and update the integrations. |
| **`SCC_Governor`** | `setVotingDelay(uint256 newVotingDelay)` | Changes the delay between proposal creation and the start of voting. |
| | `setVotingPeriod(uint256 newVotingPeriod)` | Changes the duration of the voting period. |
| | `setProposalThreshold(uint256 newProposalThreshold)` | Changes the minimum amount of `SCC_GOV` required to create a proposal. |
| | `setQuorumNumerator(uint256 newQuorumNumerator)` | Changes the quorum required for a vote to be valid. |