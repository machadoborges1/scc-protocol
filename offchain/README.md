# SCC Protocol Off-chain Services

This directory contains all services and bots that operate outside the blockchain (off-chain) to support the SCC protocol. The main component is the **Keeper Bot**, responsible for monitoring the health of Vaults and initiating liquidation auctions.

## Overview

Off-chain services are crucial for the automation and monitoring of the protocol. The Keeper Bot, developed in TypeScript/Node.js, interacts with the blockchain to:

*   **Monitor Vaults:** Tracks the collateralization ratio of Vaults.
*   **Initiate Liquidations:** Calls the `startAuction` function in the `LiquidationManager` when a Vault becomes under-collateralized.
*   **Manage Transactions:** Handles nonces, gas prices, and transaction resubmission.
*   **Expose Metrics:** Provides data for monitoring via Prometheus.
*   **Alerts:** (Under development) Sends notifications about critical events.

## Architecture

The Keeper Bot is structured into modules such as `VaultDiscoveryService`, `VaultMonitorService`, `LiquidationStrategy`, `TransactionManager`, `Alerter`, and `Metrics`, ensuring a clear separation of responsibilities and robustness.

## Local Development

The easiest way to run the Keeper Bot is through the Docker Compose environment at the monorepo root:

```bash
# At the project root
docker compose up -d
```

To run tests:

```bash
pnpm --filter=@scc/offchain test
```

## Dive into the Documentation

For a detailed analysis of the Keeper Bot's architecture, its components, execution flow, and scalability strategies, refer to the [complete project documentation](../docs/README.md).
