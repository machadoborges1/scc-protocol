# SCC Protocol Smart Contracts

This directory contains all the Solidity smart contracts that form the core of the SCC Protocol, developed using the Foundry framework.

## Overview

The smart contracts manage the central logic of the protocol, including:

*   **Vaults:** Creation and management of collateralized debt positions.
*   **Stablecoin (`SCC-USD`):** Minting and burning of the stablecoin.
*   **Governance Token (`SCC-GOV`):** Enables decentralized governance.
*   **Oracles:** Management of price feeds for collateral assets.
*   **Liquidations:** Dutch Auction mechanism for under-collateralized Vaults.
*   **Staking:** Pool for staking `SCC-GOV` and distributing rewards.
*   **Governance:** Contracts for voting on and executing proposals.

## Tools Used (Foundry)

*   **Forge:** Testing and development framework.
*   **Cast:** Command-line tool for interacting with the EVM.
*   **Anvil:** Local Ethereum node for development.

## Essential Commands

*   **Compile contracts:**
    ```bash
    forge build
    ```
*   **Run tests:**
    ```bash
    forge test
    ```
*   **Local deploy (via monorepo):**
    ```bash
    pnpm deploy:contracts
    ```

## Dive into the Documentation

For a detailed analysis of each contract, its architecture, security mechanisms, and deployment flow, refer to the [complete project documentation](../docs/README.md).
