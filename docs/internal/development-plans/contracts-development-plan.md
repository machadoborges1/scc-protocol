# Development Plan - SCC Contracts

This document tracks the development progress of the SCC protocol's smart contracts. Tasks will be marked with `[x]` when completed.

## Milestone 1: Project Setup and Core Contracts

**Status:** Completed

- [x] **Task 1.1:** Initialize Foundry Project in the `/contracts` directory.
- [x] **Task 1.2:** Install dependencies (OpenZeppelin) via `forge install`.
- [x] **Task 1.3:** Create the `SCC_USD.sol` (ERC20) contract skeleton in `src/tokens/`.
- [x] **Task 1.4:** Create the `SCC_GOV.sol` (ERC20) contract skeleton in `src/tokens/`.
- [x] **Task 1.5:** Create initial deploy and configuration tests for the tokens in `test/tokens/`.

## Milestone 2: Main Vault Logic

**Status:** Completed

- [x] **Task 2.1:** Create the `Vault.sol` (ERC721) contract skeleton in `src/`.
- [x] **Task 2.2:** Implement collateral deposit and withdrawal logic.
- [x] **Task 2.3:** Implement SCC-USD `mint` logic (debt creation).
- [x] **Task 2.4:** Implement `burn` logic (debt repayment).
- [x] **Task 2.5:** Add integration tests for the Vault functions.

## Milestone 3: Vault Factory and Liquidation Logic

**Status:** Completed

- [x] **Task 3.1:** Create the `VaultFactory.sol` contract.
- [x] **Task 3.2:** Implement the `createNewVault` function in the factory.
- [x] **Task 3.3:** Create the `LiquidationManager.sol` contract.
- [x] **Task 3.4:** Refactor `LiquidationManager` to use Dutch Auctions.
    - [x] *Phase 1: Implement health check and the `startAuction` function.*
    - [x] *Phase 2: Implement price decay logic in `getCurrentPrice`.*
    - [x] *Phase 3: Implement the atomic `buy` function, replacing `bid` and `claim`.*
- [x] **Task 3.5:** Add integration tests.
    - [x] *Factory tests completed.*
    - [x] *Liquidation check tests completed.*
    - [x] *Tests for the new Dutch Auction system completed.*

## Milestone 4: On-Chain Governance

**Status:** Completed

- [x] **Task 4.1:** Create documentation for the Governance Mechanism.
- [x] **Task 4.2:** Update `SCC_GOV.sol` to support voting (ERC20Votes).
- [x] **Task 4.3:** Create the `SCC_Governor.sol` contract.
- [x] **Task 4.4:** Implement the `TimelockController` and the governance deploy script.
- [x] **Task 4.5:** Add integration tests for the lifecycle of a governance proposal.

## Milestone 5: Staking Pool and Revenue Sharing

**Status:** Completed

- [x] **Task 5.1:** Staking Mechanism Documentation.
    - Create `contracts/docs/STAKING_MECHANISM.md` detailing the stake, unstake, and reward distribution logic.
- [x] **Task 5.2:** `StakingPool.sol` Contract Implementation.
    - Create and implement the `src/StakingPool.sol` contract with stake, unstake, reward deposit, and reward redemption functionalities.
- [x] **Task 5.3:** Add Comprehensive Tests for the Reward Logic.
    - Write unit and integration tests for all `StakingPool` reward calculation, deposit, and redemption functionalities.
- [x] **Task 5.4:** Integration with Governance.
    - Configure the `StakingPool` to be owned by the `TimelockController` and allow parameter management via governance.

## Milestone 6: Oracle Manager

**Status:** Completed

- [x] **Task 6.1:** Oracle Manager Documentation.
    - Create `contracts/docs/ORACLE_MANAGER.md` detailing the architecture, data sources (Chainlink), and fallback mechanisms.
- [x] **Task 6.2:** `OracleManager.sol` Contract Skeleton.
    - Create the `src/OracleManager.sol` file with basic interfaces and state variables.
- [x] **Task 6.3:** Integration with Chainlink Price Feeds.
    - Implement functions to fetch collateral asset prices using Chainlink oracles.
- [x] **Task 6.4:** Price Feed Management.
    - Implement functions to add, remove, and update price feed addresses (e.g., `setPriceFeed`).
- [x] **Task 6.5:** Access Control.
    - Ensure that only authorized contracts (e.g., `Vault`, `LiquidationManager`) can query prices.
- [x] **Task 6.6:** Add Comprehensive Tests.
    - Write unit and integration tests for all `OracleManager` functionalities, including price fetching and feed management.
- [x] **Task 6.7:** Integration with Governance.
    - Configure the `OracleManager` to be owned by the `TimelockController` and allow parameter management via governance.

---
*This document will be updated as tasks are completed.*

## Milestone 7: Final Oracle Integration and Refactoring

**Status:** Completed

- [x] **Task 7.1:** Refactor `Vault.sol` and `LiquidationManager.sol` to use `OracleManager` instead of `MockOracle`.
- [x] **Task 7.2:** Update constructors and `VaultFactory.sol` to inject the `OracleManager` dependency.
- [x] **Task 7.3:** Update the test suites (`Vault.t.sol`, `LiquidationManager.t.sol`, `VaultFactory.t.sol`) to reflect the new architecture with `OracleManager`.
- [x] **Task 7.4:** Run all tests and ensure that 100% of the suite passes.

## Milestone 8: Deploy Infrastructure

**Status:** Completed

- [x] **Task 8.1:** Create the `Deploy.s.sol` script file in the `script/` directory.
- [x] **Task 8.2:** Implement the deploy logic for the core contracts (Tokens, Oracle, Factory, LiquidationManager).
- [x] **Task 8.3:** Implement the deploy logic for the Governance and Staking contracts.
- [x] **Task 8.4:** Test the deploy script in a local environment (Anvil) and ensure that all contracts are deployed and configured correctly.

## Milestone 9: Access Control Refactoring and Test Fixes

**Status:** Completed

- [x] **Task 9.1:** Document the hybrid access control architecture and the refined authorization flow.
    - [x] *Sub-task:* Create `ACCESS_CONTROL_ARCHITECTURE.md`.
    - [x] *Sub-task:* Update `ORACLE_MANAGER.md`, `VAULT_MECHANISM.md`, and `SYSTEM_ARCHITECTURE_AND_FLOW.md`.
- [x] **Task 9.2:** Refactor `OracleManager.sol` to use `AccessControl` (RBAC) instead of `Ownable`.
    - [x] *Sub-task:* Introduce `AUTHORIZER_ROLE` to securely delegate the authorization capability.
- [x] **Task 9.3:** Update the deploy script (`Deploy.s.sol`) for the new RBAC flow.
    - [x] *Sub-task:* Grant `AUTHORIZER_ROLE` to the `VaultFactory`.
    - [x] *Sub-task:* Transfer `DEFAULT_ADMIN_ROLE` to the `Timelock`.
- [x] **Task 9.4:** Fix the test suite to align with the new architecture.
    - [x] *Sub-task:* Fix compilation failure related to the OpenZeppelin version (use `_grantRole`).
    - [x] *Sub-task:* Fix the `VaultFactory` test (`test_CreateNewVault`) by adjusting the RBAC permissions in the `setUp`.
- [x] **Task 9.5:** Run all tests and ensure that 100% of the suite passes.

## Milestone 10: Vulnerability Fixes and Design Improvements

**Status:** Completed

- [x] **Task 10.1:** Fix liquidation manager vulnerability in `Vault.sol`.
    - [x] *Sub-task:* Remove the `setLiquidationManager` function.
    - [x] *Sub-task:* Make the `LiquidationManager` address `immutable` and set it in the constructor.
    - [x] *Sub-task:* Update `VaultFactory.sol` to inject the `LiquidationManager` on `Vault` creation.
    - [x] *Sub-task:* Update all tests and deploy scripts to reflect the new architecture.
- [x] **Task 10.2:** Fix `burn` vulnerability in `SCC_USD.sol`.
- [x] **Task 10.3:** Fix the problem of trapped funds in `LiquidationManager.sol`.
- [x] **Task 10.4:** Improve the flexibility of `StakingPool.sol` with dynamic reward duration.
- [x] **Task 10.5:** Run all tests and ensure that 100% of the suite passes.

## Milestone 11: Re-liquidation Bug Fix and Tests

**Status:** Completed

- [x] **Task 11.1:** Implement `reduceCollateral` and `reduceDebt` functions in `Vault.sol`.
- [x] **Task 11.2:** Call `vault.reduceCollateral` and `vault.reduceDebt` in `LiquidationManager.buy()`.
- [x] **Task 11.3:** Add unit tests for `Vault.reduceCollateral` and `Vault.reduceDebt`.
- [x] **Task 11.4:** Add integration tests for the full liquidation flow, verifying the `Vault` state update and non-re-liquidation.
- [x] **Task 11.5:** Run all tests and ensure that 100% of the suite passes.

## Milestone 12: Liquidation Bug Debugging and Fixing

**Status:** Completed

- [x] **Task 12.1:** Investigate and fix compilation failures in the `LiquidationManager.t.sol` test suite.
    - [x] *Sub-task:* Fix incorrect access to `struct` members in the tests.
    - [x] *Sub-task:* Add the `isVaultLiquidatable` function to assist the tests.
- [x] **Task 12.2:** Add detailed logs to the `buy` function to track the execution flow and state.
- [x] **Task 12.3:** Identify and fix the accounting bug in `LiquidationManager.sol` that caused inconsistency in the `Vault`'s balance after collateral return.
- [x] **Task 12.4:** Refactor the fragile tests (`test_buy_DebtDustHandling` and others) to validate the correct contract behavior, considering the precision of integer math.
- [x] **Task 12.5:** Run the full test suite and ensure that 100% of the tests pass.

## Milestone 13: Increase Security and Integration Test Coverage

**Status:** In Progress

- [x] **Task 13.1:** Implement re-entrancy test in `Vault.sol`.
    - [x] *Sub-task:* Create the `test/VaultSecurity.t.sol` file.
    - [x] *Sub-task:* Develop a malicious ERC20 token that attempts a re-entrant call during debt burning (`burn`).
    - [x] *Sub-task:* Validate that the `onlyOwner` protection of the `Vault` successfully prevents the attack.
- [ ] **Task 13.2:** Implement fee lifecycle test (End-to-End).
    - *Sub-task:* Create a test that simulates liquidation, fee collection, transfer via governance to the `StakingPool`, and reward redemption by a staker.
- [x] **Task 13.3:** Implement limit tests for `LiquidationManager`.
    - [x] *Sub-task:* Create a test for the case where the remaining debt is *exactly* equal to `DEBT_DUST`.
    - [x] *Sub-tarefa:* Create a test for the case where the auction price decays to zero during a `buy` transaction.
- [ ] **Task 13.4:** Implement governance attack test on `OracleManager`.
    - *Sub-task:* Simulate a malicious proposal that swaps a valid price feed for a fake oracle to test the system's defenses.
- [ ] **Task 13.5:** Update `docs/TESTING_OVERVIEW.md` as new tests are completed.
