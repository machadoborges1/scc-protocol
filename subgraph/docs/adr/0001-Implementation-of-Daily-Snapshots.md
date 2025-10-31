# ADR 0001: Implementation of Daily Snapshots in the Subgraph for Historical Analysis

**Status:** Proposed

**Date:** 2025-10-14

## Context

The protocol's frontend needs to display historical data in the form of charts, such as the evolution of the Total Value Locked (TVL) and the system's average collateralization ratio. The current subgraph design only stores the most recent state of these metrics in the `Protocol` entity, which makes it impossible to query time-series data and build historical charts.

## Decision

To enable historical analysis, we will adopt the "Daily Snapshots" pattern in the subgraph. This decision consists of:

1.  **Creation of New Entities:** For each main entity that requires historical tracking (e.g., `Protocol`, `Vault`), a corresponding daily data entity will be created (e.g., `ProtocolDayData`, `VaultDayData`).

2.  **Snapshot Entity Structure:** Each snapshot entity will have a composite ID, usually based on the day's timestamp (e.g., `timestamp / 86400`), and will store the aggregated metrics for that period (TVL, volume, total debt, etc.).

3.  **Aggregation Logic in Mappings:** The event handlers in the subgraph (`mappings`) will be updated. In addition to modifying the main entity with the current state, they will also be responsible for loading or creating the current day's snapshot and updating its aggregated metrics.

4.  **Frontend Querying:** The frontend will now query these snapshot entities over a date range to obtain the data needed to populate the chart components.

## Consequences

### Positive

-   **Historical Analysis Capability:** Allows for the visualization and analysis of the protocol's performance over time, an essential feature for users and stakeholders.
-   **Alignment with Market Standards:** This is the standard approach used by large and successful DeFi protocols (such as Uniswap, Aave) for displaying data in their DApps.
-   **Frontend Performance:** The data already arrives at the frontend pre-aggregated by day, simplifying the logic for building charts and improving performance.

### Negative

-   **Increased Subgraph Complexity:** The logic in the mappings becomes more complex, as it needs to handle the creation and updating of daily entities.
-   **Larger Data Volume:** The subgraph will store a significantly larger volume of data, which may impact infrastructure costs and synchronization time on public networks.
-   **Refactoring Effort:** Requires a considerable development effort to modify the schema and refactor all relevant mappings.
