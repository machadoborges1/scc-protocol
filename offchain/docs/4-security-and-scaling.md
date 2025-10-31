# 4. Security and Scalability (Post-MVP)

**Status:** Proposed

This document describes future architectural improvements to increase the security, efficiency, and scalability of the Keeper Bot, focusing on production-level topics.

## 1. MEV Awareness: Protection Against Front-Running

### 1.1. The Current Risk

The current `TransactionManager` sends `startAuction` transactions to the public mempool. This exposes the bot to MEV (Maximal Extractable Value) strategies, primarily **front-running**. A "searcher" bot can detect our transaction, copy it with a higher gas fee, and initiate the auction before us, capturing any associated profit opportunity.

### 1.2. Proposed Solution: Private Transactions

To mitigate this risk, the `TransactionManager` should be modified to support sending transactions through a **private relay**, such as [Flashbots](https://docs.flashbots.net/).

-   **Implementation Flow:**
    1.  Integrate a private relay client (e.g., `flashbots-ethers-provider-bundle` or a customized implementation with `viem`).
    2.  Modify the `startAuction` function in `TransactionManager` to, instead of `walletClient.writeContract`, build and send a transaction "bundle" to the Flashbots endpoint.
    3.  The bundle would contain our liquidation transaction and a tip transaction for the miner.
    4.  This ensures that our transaction is not visible in the public mempool, making front-running impossible.

## 2. Key Management: Secure Key Management

### 2.1. The Current Risk

Currently, the keeper's private key is read from an `.env` file. In a production environment, if the server is compromised, the key is instantly stolen, giving the attacker full control over the keeper's funds and functions.

### 2.2. Proposed Solution: Secrets Vault

The correct practice is that the private key should **never** be in plain text in the same environment as the application.

-   **Recommended Architecture:**
    1.  **Storage:** The private key should be stored in a centralized and secure vault service, such as **AWS KMS**, **Azure Key Vault**, or **HashiCorp Vault**.
    2.  **Signing Logic:** The `TransactionManager` should be refactored. Instead of using `privateKeyToAccount` to load the key into memory, it would use the vault service's SDK to **request a transaction signature**.
    3.  The `TransactionManager` would build the unsigned transaction, send it to the vault service, and the service would return it signed, without ever exposing the private key to the application.

-   **Advantages:**
    -   **Maximum Security:** The private key never leaves the secure vault environment.
    -   **Auditing:** All attempts to access and use the key are logged and auditable in the vault service.

## 3. Decentralized Alternatives for Key Management (Advanced Post-MVP)

While a centralized vault is the industry standard for protecting bot operators, the Web3 ecosystem offers decentralized solutions for key management, suitable for the highest levels of security.

### 3.1. MPC (Multi-Party Computation)

-   **What is it?** MPC is a cryptographic technique where a single private key is split into multiple "shards," and each shard is stored by a different computer. To sign a transaction, a predefined quorum of these computers needs to cooperate in an **off-chain** communication protocol. The crucial point is that the complete private key is **never** reconstructed in a single place.
-   **Who Uses It?** Institutional custodians (Fireblocks, Copper), wallet providers (ZenGo, Coinbase WaaS), and cross-chain bridges.
-   **Application in the Project:** We could replace the single keeper key with a "ring" of multiple servers running an MPC node. A liquidation would only be signed if, for example, 3 out of 5 servers agreed, eliminating the risk of a single server being compromised.

### 3.2. DVT (Distributed Validator Technology)

-   **What is it?** DVT is a technology focused on solving a similar problem for Proof-of-Stake validators. It distributes the responsibilities and the key of a single validator among a cluster of nodes that must reach a consensus before signing a message. It is a hybrid solution, with **on-chain** contracts to manage clusters and **off-chain** communication between nodes.
-   **Who Uses It?** Liquid Staking protocols (Lido) and infrastructure projects focused on DVT (SSV Network, Obol Network).
-   **Application in the Project:** Although more focused on validators, DVT principles could be adapted to create a decentralized committee of keepers, where actions are coordinated and validated on-chain before execution. It is a more complex approach, but fully aligned with the philosophy of decentralization.