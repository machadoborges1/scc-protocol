# SCC Protocol Subgraph

This Subgraph is responsible for indexing the events and states of the SCC Protocol's smart contracts, transforming raw blockchain data into an easily queryable GraphQL API. It serves as the main data source for the frontend (DApp) and for analytics.

## Overview

The Subgraph monitors the main contracts of the SCC protocol (such as `VaultFactory`, `SCC_USD`, `LiquidationManager`, etc.). By listening to events emitted by these contracts, it persists the relevant data in a database, which can be accessed via queries GraphQL. This allows the frontend to display updated and historical information about the protocol efficiently.

## Main Components

A Subgraph is defined by three main files:

*   **`subgraph.yaml` (Manifest):** Configures which contracts to monitor, which events to listen to, and which mapping functions to execute.
*   **`schema.graphql` (Data Schema):** Defines the data model (entities) that will be stored and queried via GraphQL.
*   **`src/mappings/*.ts` (Mapping Files):** Contain the TypeScript logic that processes blockchain events and transforms them into entities defined in `schema.graphql`.

## Local Development

To set up and run the Subgraph locally:

1.  **Prerequisites:** Node.js, pnpm, The Graph CLI, and Docker/Docker Compose (for Anvil).
2.  **Install dependencies:**
    ```bash
    pnpm install
    ```
3.  **Generate code and build:**
    ```bash
    graph codegen
    graph build
    ```
4.  **Local deploy (with local Graph Node):**
    ```bash
    graph deploy --node http://localhost:8020/ --ipfs http://localhost:5001/ --output-dir build scc-protocol-subgraph
    ```

## Querying the Subgraph

After deployment and synchronization, you can query your local Subgraph via GraphQL at `http://localhost:8000/subgraphs/name/scc-protocol-subgraph/graphql`.

## Dive into the Documentation

For a detailed analysis of the Subgraph's architecture, its data model, best practices, and development workflow, refer to the [complete project documentation](../docs/README.md).