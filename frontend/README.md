# SCC Protocol Frontend

This directory contains the source code of the DApp (Decentralized Application) of the Protocol SCC, which serves as the main interface for users to interact with the SCC ecosystem.

## Overview

The frontend offers an intuitive user experience for:

*   **Managing Vaults:** Create, deposit collateral, mint, and burn `SCC-USD`.
*   **Staking:** Stake `SCC-GOV` and claim rewards.
*   **Auctions:** Participate in liquidation auctions.
*   **Governance:** Vote on proposals and delegate voting power.
*   **Viewing Data:** Monitor the protocol's state and your positions through a dashboard.

## Technology Stack

The DApp is built with a modern stack:

*   **Build Tool:** Vite
*   **Framework:** React 18
*   **Language:** TypeScript
*   **Styling:** TailwindCSS + shadcn/ui
*   **Web3 Integration:** `wagmi` and `viem`

## Local Development

To run the frontend locally, ensure that the monorepo's Docker Compose environment is active (`docker compose up -d`).

1.  **Install dependencies:**
    ```bash
    pnpm install
    ```
2.  **Start the development server:**
    ```bash
    pnpm --filter @scc/frontend dev
    ```

## Dive into the Documentation

For a detailed analysis of the frontend architecture, data flow, and interaction with the protocol, refer to the [complete project documentation](../docs/README.md).
