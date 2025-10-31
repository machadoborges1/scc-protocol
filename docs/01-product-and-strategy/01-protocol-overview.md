# 1. SCC Protocol Overview

This document provides an overview of the **SCC (Crypto-Collateralized Stablecoin)**, a DeFi protocol designed to offer a decentralized stablecoin (`SCC-USD`) pegged to the US dollar and over-collateralized by crypto assets. The main objective is to establish a stable, transparent, and censorship-resistant asset that serves as a robust pillar for the decentralized finance ecosystem.

## 1.1. Purpose and Core Principles

The SCC Protocol aims to allow users to deposit approved volatile assets (such as ETH, wBTC) into "Vaults" to mint (`mint`) `SCC-USD`. Security and decentralization are the cornerstones of this project, ensuring that user funds are protected and that the protocol operates autonomously, with governance progressively transferred to the holders of the `SCC-GOV` token.

**Key Principles:**

*   **Security:** Maximum priority in protecting funds, reflected in the design, implementation, and operational processes.
*   **Decentralization:** Autonomous operation of the protocol, with governance exercised by `SCC-GOV` holders.
*   **Transparency:** All operations, collateral, and the state of the system are publicly verifiable on the blockchain.
*   **Scalability:** Architecture optimized for gas efficiency and integration with other DeFi protocols and networks.

## 1.2. Main Components of the Protocol

The SCC ecosystem is composed of several interconnected modules, each playing a crucial role in the functionality and stability of the protocol:

*   **Stablecoin (`SCC-USD`):** The ERC20 token that represents the stable asset, pegged to the US dollar.
*   **Governance Token (`SCC-GOV`):** A secondary ERC20 token used for protocol governance, encouraging participation and secure management.
*   **Vaults:** Smart contracts where users deposit their collateral assets and manage their debt positions in `SCC-USD`.
*   **Oracle Module:** A robust system, initially integrated with Chainlink, to provide reliable and decentralized prices for collateral assets.
*   **Liquidation Module:** The essential mechanism that ensures the solvency of the system, auctioning collateral from Vaults that become under-collateralized.
*   **Treasury and Governance:** Contracts that manage protocol fees and allow `SCC-GOV` holders to vote on change proposals.
*   **Off-chain Services:** Include bots like the `liquidation-keeper-bot` that monitor the blockchain and execute automated actions (e.g., initiating liquidations), and the **Subgraph** that indexes blockchain data for efficient queries via GraphQL.
*   **Frontend:** An intuitive user interface for interacting with the protocol, allowing the creation of Vaults, minting of `SCC-USD`, staking of `SCC-GOV`, participation in auctions, and voting on governance proposals.

## 1.3. Monorepo Structure

The project is organized as a monorepo using `pnpm workspaces`, which allows for efficient management of multiple packages:

*   **`/contracts`:** Contains all Solidity smart contracts, developed and tested with Foundry.
*   **`/offchain`:** Hosts off-chain services, such as bots and keepers, implemented in TypeScript/Node.js.
*   **`/frontend`:** Contains the user interface for interacting with the protocol.
*   **`/subgraph`:** Defines and implements the subgraph for indexing blockchain data.
*   **`/docs`:** Contains all project documentation, including architecture, product, and operations.

## 1.4. Local Development Environment

The project uses Docker Compose to orchestrate a complete and integrated development environment, which includes:

*   **Anvil:** A local test blockchain.
*   **Postgres:** Database for the Subgraph.
*   **IPFS:** IPFS node to host Subgraph metadata.
*   **Graph Node:** The indexer that synchronizes with the blockchain.
*   **Keeper:** The off-chain bot for liquidations.
*   **Prometheus:** For collecting metrics.

The initialization and verification of the environment are simplified through `docker compose up -d` and `pnpm test:integration` commands, ensuring that all services are configured and working correctly.

## 1.5. Interaction between Keeper and Subgraph

It is important to note the distinction and interaction between the **Keeper** and the **Subgraph**:

*   The **Keeper** acts as a **write** service, actively monitoring the Vaults on the blockchain and sending transactions to the `LiquidationManager` contract when necessary.
*   The **Subgraph** acts as a **read** service, listening to events emitted by the contracts and indexing this data for efficient queries via the GraphQL API, used by the frontend.

In summary, the Keeper **acts** on the state of the blockchain, while the Subgraph **reads** and organizes that state for querying.
