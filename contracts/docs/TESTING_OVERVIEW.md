# SCC System Testing Overview

This document provides a summary of the existing test suite for the SCC protocol's smart contracts and offers recommendations for future tests to increase the system's robustness and security.

---

### **Test Coverage by Contract**

The current test suite, implemented with the Foundry framework, focuses on unit and integration tests to validate the business logic and security rules of each protocol component.

#### **1. Token Contracts (`SCC_USD` and `SCC_GOV`)**
*   **Basic Functionality:** Verify that the tokens are deployed with the correct name and symbol.
*   **Access Control and Supply:**
    *   `SCC_USD`: Confirms that only accounts with `MINTER_ROLE` can mint new tokens. It also validates that burning tokens from other accounts (`burnFrom`) requires prior approval, preventing unauthorized destruction of funds.
    *   `SCC_GOV`: Ensures that the entire initial supply of the governance token is correctly sent to the deployer's wallet at the time of deployment.

#### **2. `OracleManager.sol`**
*   **Security and Access:** The tests ensure that only addresses previously authorized by governance can query asset prices, protecting the system from the use of unsanctioned oracles.
*   **Oracle Data Validation:** They verify that the system reverts transactions safely and predictably when the oracle presents problematic data, including:
    *   No price feed configured for the asset.
    *   Stale Price.
    *   Invalid price (zero or negative).
*   **Governance Administration:** They confirm that only the governance account can execute administrative functions, such as adding or updating price feeds.

#### **3. `Vault.sol` and `VaultFactory.sol`**
*   **Vault Creation:** The test for the `VaultFactory` ensures that new `Vaults` are created successfully, the Vault's NFT ownership is assigned to the correct user, and essential permissions (to query the Oracle and to mint `SCC_USD`) are automatically delegated to the new `Vault`.
*   **Position Management (CDP):** The `Vault` tests cover a user's main business flows:
    *   Deposit and withdrawal of collateral.
    *   Creation (`mint`) and repayment (`burn`) of `SCC-USD` debt.
*   **Vault Security:** They validate the most critical business logic: a user cannot withdraw collateral or create new debt if it causes their collateralization ratio to fall below the minimum required by the protocol.
*   **Access Control for Liquidation:** They ensure that only the `LiquidationManager` contract can invoke the internal-use functions to transfer collateral during a liquidation.

#### **4. `LiquidationManager.sol`**
*   **Auction Start:** They verify that a liquidation auction can only be started for a `Vault` that is genuinely under-collateralized and does not have an auction already in progress.
*   **Dutch Auction Logic:**
    *   `test_getCurrentPrice_DecaysLinearly`: Confirms that the collateral price in the auction decays linearly over time, as specified.
    *   **Purchase Flows (`buy`):** They test multiple collateral purchase scenarios, including partial and full purchases. The assertions validate that the state of the auction (remaining collateral, debt to be covered) and the liquidated `Vault` are updated correctly after each purchase.
*   **Bug Fixes:** The tests that were fixed during debugging (`test_buy_MultiplePartialPurchases_VaultStateUpdated` and `test_buy_DebtDustHandling`) now validate that the `Vault`'s accounting is correctly adjusted after liquidation and that the system handles integer math rounding predictably.

#### **5. `StakingPool.sol` and Governance**
*   **Staking Cycle:** The tests cover the three main user actions: deposit (`stake`), withdrawal (`unstake`), and reward redemption (`getReward`).
*   **Reward Calculation:** They validate that `SCC-USD` rewards are calculated and distributed fairly and proportionally to one or multiple stakers, even when rewards are added at different times.
*   **Pool and Protocol Governance:** The tests for `StakingPoolGovernance` and `SCC_Governor` ensure that the administration of the contracts (such as the transfer of ownership to the `Timelock`) and the lifecycle of a governance proposal (proposal -> vote -> queue -> execution) work as expected.

---

### **Recommendations for Future Tests**

To increase the protocol's robustness to a production level, I recommend implementing the following tests, focused on edge cases, security, and complex integration:

1.  **Re-entrancy Test in `Vault.sol`:**
    *   **Scenario:** Create a fake collateral token that, when transferred during a `depositCollateral`, tries to make a re-entrant call to withdraw the same collateral or mint debt before the state is fully updated.
    *   **Objective:** Prove that the contract is immune to re-entrancy attacks, one of the most common attack vectors in DeFi.

2.  **Full Revenue Flow Test (End-to-End):**
    *   **Scenario:** A single test that simulates the entire protocol revenue lifecycle:
        1.  A `Vault` is liquidated, generating fees that are accumulated in the `LiquidationManager`.
        2.  A governance proposal is created, approved, and executed to transfer these fees to the `StakingPool`.
        3.  The `notifyRewardAmount` function of the `StakingPool` is called with the fee funds.
        4.  A staker, who can be any user, redeems their proportional share of the newly distributed fees.
    *   **Objective:** Validate the seamless integration and the complete value flow of the protocol, connecting liquidation, governance, and staking.

3.  **Exact Limit Test in `LiquidationManager.sol`:**
    *   **Cenário:** Force an auction where the collateral purchase results in a remaining debt *exactly* equal to `DEBT_DUST`.
    *   **Objective:** Ensure that the boundary condition (`<=`) in the auction closing logic works as expected, closing the auction.

4.  **Governance Attack Test in `OracleManager.sol`:**
    *   **Scenario:** Simulate a malicious governance proposal that swaps a valid price feed (e.g., WETH/USD) for a fake oracle that reports a zero or extremely inflated price.
    *   **Objective:** Document and understand the impact of a governance takeover, and verify if the defenses (like the `Timelock`, which introduces an execution delay) give the community time to react.