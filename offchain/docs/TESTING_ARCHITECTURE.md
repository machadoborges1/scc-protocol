# Testing Architecture (Off-chain with Jest)

**Status:** Revised and Stabilized

## 1. Overview

This document describes the testing architecture for the `offchain` project, which uses **Jest** as the testing framework and **Anvil** as the local development blockchain. The architecture was designed to be stable, fast, and to outline a clear separation between unit tests and integration tests.

---

## 2. Test Environment Management (Anvil)

One of the main challenges faced was the instability of the test environment, caused by "zombie" Anvil processes that were not terminated correctly, leading to `Address already in use` errors.

### 2.1. Anvil Lifecycle

-   **`jest.globalSetup.ts`**: A script executed **only once** before all tests. It has multiple responsibilities to ensure robustness:
    1.  **Port Cleanup:** Forces the termination of any process occupying port 8545 to avoid conflicts.
    2.  **Anvil Initialization:** Starts a single Anvil process in the background.
    3.  **Readiness Check:** Enters a waiting loop, actively checking if the Anvil node is ready to accept RPC connections before allowing tests to begin.

-   **`jest.globalTeardown.ts`**: Executed **only once** after all tests, ensuring that the Anvil process is properly terminated.

### 2.2. Shared Viem Client

-   **`lib/viem.ts`**: This file creates and exports a **single instance** of the `viem` client (`testClient`).
-   **Rule:** **All** tests (unit and integration) **must** import and use this shared instance to ensure consistency.

---

## 3. Unit Test Architecture

Unit tests (`src/**/*.test.ts`) are designed to be fast and stateless.

-   **Isolation:** They **must not** make real RPC calls. All blockchain interactions are simulated (mocked).
-   **Mocking Pattern:** The adopted pattern is the use of `jest.spyOn(testClient, 'methodName')` to intercept and simulate the responses of `testClient` functions.
-   **Cleanup:** An `afterEach` hook in each test file ensures the call to `jest.restoreAllMocks()` to clear simulations between tests.

## 4. Integration Test Architecture

Integration tests (`test/integration/**/*.test.ts`) are designed to test the full flow of interaction with a real blockchain (Anvil).

-   **State Management:** As these tests modify the blockchain state (e.g., creating contracts, sending transactions), they need an isolation mechanism.
-   **Local Implementation:** The isolation logic is implemented **locally** within each integration test file, using Jest hooks:
    -   **`beforeEach`**: Before each test, a `testClient.snapshot()` call is made to save the current blockchain state.
    -   **`afterEach`**: After each test, a `testClient.revert()` call is made to instantly restore the blockchain to the saved state, ensuring that each test starts with a clean and identical environment.