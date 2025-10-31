# Test Strategy - Subgraph

**Status:** Proposed

## 1. Overview

Testing the logic of a subgraph is crucial to ensure the integrity and the correctness of the data served by the GraphQL API. Our testing strategy is divided into two main categories: Unit Tests for mapping logic and Integration Tests for the end-to-end flow.

## 2. Unit Tests with `matchstick-as`

Unit tests are the first line of defense and focus on validating the logic of each `handler` function in isolation.

-   **Tool:** We will use the `matchstick-as` library, the standard of The Graph community for testing mappings in AssemblyScript.
-   **Location:** Test files will reside in the `subgraph/tests/` directory.
-   **Command:** `graph test`

### Unit Test Workflow

For each handler function (e.g., `handleVaultCreated`), the test will follow these steps:

1.  **Arrange (Preparation):**
    -   Create a mock event (e.g., `newVaultCreatedEvent`) with example parameters.
    -   Use `matchstick-as` functions to simulate the "store" state before the event, if necessary (e.g., check if a `User` entity already exists).

2.  **Act (Action):**
    -   Call the handler function with the mock event as an argument (e.g., `handleVaultCreated(event)`).

3.  **Assert (Verification):**
    -   Use `matchstick-as` assertion functions to verify the "store" state after the handler's execution.
    -   Check if an entity was created (`assert.entityCount("Vault", 1)`).
    -   Check if the entity fields were correctly populated (`assert.fieldEquals("Vault", "0x...", "owner", "0x...")`).
    -   Check if an entity was updated or removed.

### Coverage

-   Each handler function in the `src/` directory must have its own corresponding test file in `tests/`.
-   We must test both "happy paths" and edge cases (e.g., an event that creates an entity vs. one that updates an existing one).

## 3. Integration Tests

Integration tests validate the complete system, from the event emission on the blockchain to data querying via GraphQL.

-   **Environment:** We will use the project's `docker-compose` environment, which should be extended to include a `graph-node`, `ipfs-node`, and `postgres` for the subgraph.
-   **Process:**
    1.  **Local Deploy:** Start the Docker environment. Contracts are deployed to Anvil. The Subgraph is compiled and deployed to the local `graph-node`.
    2.  **Event Generation:** Run a script (e.g., a Jest test or a `ts-node` script) that interacts with the contracts on Anvil to emit the events we want to test (create a vault, deposit collateral, etc.).
    3.  **Synchronization:** Wait a brief period for the `graph-node` to detect new blocks and execute the mapping handlers.
    4.  **Validation:** Send a GraphQL query to the local `graph-node` endpoint (`http://localhost:8000/subgraphs/name/scc/scc-protocol`).
    5.  **Assertion:** Verify that the GraphQL query response contains the expected data, confirming that the event was processed and stored correctly.

This approach ensures that `subgraph.yaml`, `schema.graphql`, and the mappings work correctly together.