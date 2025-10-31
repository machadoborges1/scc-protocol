# 1. SCC System Architecture

This document describes the technical architecture of the SCC protocol, detailing the on-chain (smart contracts) and off-chain (auxiliary services) components and how they interact to form a cohesive and robust system. The goal is to provide a clear view of the system's structure, its data flows, and the technologies used.

## 1.1. Architecture Diagram

```mermaid
graph TD
    subgraph User
        A[Frontend DApp]
    end

    subgraph Off-Chain Services
        B[Indexing Service (The Graph)]
        C[Keeper Bot (Liquidations)]
    end

    subgraph Blockchain (RPC Node)
        D[Blockchain Node]
    end

    subgraph On-Chain Contracts
        E[VaultFactory]
        F[Vault]
        G[OracleManager]
        H[LiquidationManager]
        I[SCC_USD]
        J[SCC_GOV]
        K[StakingPool]
        L[SCC_Governor]
        M[Timelock]
    end

    A -- "Reads data via GraphQL" --> B
    A -- "Sends transactions (mint, stake, etc)" --> D
    B -- "Indexes contract events" --> D
    C -- "Monitors Vaults and calls `startAuction`" --> D
    D -- "Interacts with" --> E
    D -- "Interacts with" --> F
    D -- "Interacts with" --> H
    D -- "Interacts with" --> K
    D -- "Interacts with" --> L

    F -- "Queries price" --> G
    H -- "Queries price" --> G
    F -- "Creates/Burns" --> I
    L -- "Executes proposals via" --> M
    M -- "Manages" --> E
    M -- "Manages" --> G
    M -- "Manages" --> H
    M -- "Manages" --> K

    style A fill:#cde4ff
    style B fill:#d2ffd2
    style C fill:#d2ffd2
    style D fill:#ffe4b5

```

## 1.2. On-Chain Architecture

The on-chain system is composed of a set of modular and upgradeable smart contracts (using the UUPS/Proxy pattern), deployed on the Ethereum network. They form the core of the protocol, managing the logic of collateralization, stablecoin issuance, oracles, and governance.

| Contract                 | Standard    | Main Responsibility                                                              |
| :----------------------- | :---------- | :-------------------------------------------------------------------------------------- |
| **VaultFactory**         | Custom      | Factory to create and track new Vaults.                                             |
| **Vault**                | ERC721      | Individual contract that holds a user's collateral and debt. Ownership is an NFT.     |
| **SCC_USD**              | ERC20       | The stablecoin token implementation, with mint/burn permissions for the Vaults.          |
| **SCC_GOV**              | ERC20       | The governance token implementation.                                                 |
| **OracleManager**        | Custom      | Aggregates and provides the prices of collateral assets, abstracting the source (e.g., Chainlink). |
| **LiquidationManager**   | Custom      | Manages the collateral auction process for insolvent Vaults.                       |
| **SCC_Governor**         | Governor    | Governor contract (based on OpenZeppelin Governor). Allows voting.            |
| **TimelockController**   | Timelock    | Manages the delayed execution of proposals approved by governance.                    |
| **StakingPool**          | Custom      | Allows users to stake SCC-GOV to receive a portion of the protocol's revenue.  |

### Interaction Flow (Example: Minting SCC-USD)

1.  **User** calls the `createNewVault()` function in `VaultFactory`.
2.  `VaultFactory` deploys a new `Vault` (proxy) and transfers ownership (NFT) to the **User**.
3.  **User** calls `deposit(amount)` in their `Vault`, transferring the collateral (e.g., WETH) to the contract.
4.  **User** calls `mint(amount)` in their `Vault`.
5.  The `Vault` queries the `OracleManager` to get the current price of the collateral.
6.  The `Vault` calculates the resulting CR and checks if it is above the MCR.
7.  If valid, the `Vault` calls the `mint(user, amount)` function in the `SCC_USD` contract.
8.  `SCC_USD` creates the amount of tokens and transfers them to the **User**.

## 1.3. Off-Chain Architecture

Components that run outside the blockchain but are essential for the operation, monitoring, and usability of the protocol:

1.  **Keepers (Bots):**
    *   **Responsibility:** Monitor the state of all Vaults and ensure the protocol's solvency.
    *   **Action:** When a Vault becomes insolvent (CR < MCR), the bot calls the `startAuction()` function in the `LiquidationManager` to start the auction.
    *   **Technology:** TypeScript/Node.js with `viem`/`ethers.js`.

2.  **Indexing Service (The Graph):**
    *   **Responsibility:** Provide a fast and efficient way to query historical and real-time data from the protocol.
    *   **Action:** Listens to contract events (e.g., `VaultCreated`, `CollateralDeposited`, `Liquidated`) and stores them in a GraphQL API.
    *   **Technology:** The Graph.

3.  **Frontend (DApp):**
    *   **Responsibility:** User interface for interacting with the protocol.
    *   **Action:** Reads data via the indexing service (GraphQL); Sends transactions via the user's wallet (RPC).
    *   **Technology:** React/Next.js with `viem`/`ethers.js`.

## 1.4. Data Flow and Interactions

The data flow in the SCC protocol is bidirectional, involving on-chain and off-chain interactions:

*   **User to Blockchain:** The Frontend (DApp) allows the user to send transactions (mint, stake, etc.) directly to the Blockchain via an RPC node.
*   **Blockchain to Off-Chain Services:** Events emitted by the smart contracts are captured by the Indexing Service (The Graph) and the Keeper Bot. The Keeper also queries the state of the blockchain via RPC.
*   **Off-Chain Services to Blockchain:** The Keeper Bot, upon identifying specific conditions (e.g., insolvent Vault), sends transactions to the Blockchain (e.g., `startAuction`).
*   **Off-Chain Services to Frontend:** The Frontend queries the Indexing Service (The Graph) via GraphQL to display historical and real-time data to users.

## 1.5. Technology Stack

The SCC protocol is built on a modern and robust technology stack:

*   **Smart Contracts:** Solidity, Foundry (Forge, Anvil).
*   **Off-Chain Development (Keeper):** TypeScript, Node.js, Viem, Pino (logging), Prom-client (metrics), Docker.
*   **Indexing (Subgraph):** The Graph Protocol, GraphQL, AssemblyScript (for mappings).
*   **Frontend (DApp):** React/Next.js, Viem.
*   **Infrastructure:** Docker, Docker Compose, Prometheus.

## 1.6. Security Considerations

Security is the highest priority of the SCC protocol. All layers of the architecture are designed with a focus on resilience and protection against vulnerabilities. For a detailed analysis of testing methodologies, audits, access control, and key management, refer to the `08-security.md` document.
