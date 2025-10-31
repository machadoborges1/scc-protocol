# Oracle Manager Mechanism

Status: Implemented

## 1. Introduction

This document describes the design and implementation of the `OracleManager.sol` contract, responsible for aggregating and providing reliable and decentralized prices for the collateral assets used in the SCC protocol. The goal is to abstract the complexity of external data sources and provide a secure, standardized, and robust interface for other protocol contracts, such as `Vault` and `LiquidationManager`.

## 2. Main Architecture

The `OracleManager` is a singular contract, designed to be the single source of truth for asset prices within the protocol.

- **Access Control (RBAC):** The contract uses the OpenZeppelin `AccessControl` pattern for granular and secure permission management.
    - **`DEFAULT_ADMIN_ROLE`**: This is the main administrator role. Only addresses with this role can execute the most critical functions, such as `setPriceFeed()`. The ownership of this role is intended for the governance `TimelockController` contract.
    - **`AUTHORIZER_ROLE`**: A secondary role whose only permission is to call the `setAuthorization()` function. This role is intended for the `VaultFactory` contract, allowing it to authorize the `Vaults` it creates without receiving any other administrative permissions.
- **Feed Mapping:** The contract will maintain a mapping from the address of a collateral asset (e.g., WETH) to the address of its respective Chainlink Price Feed (`AggregatorV3Interface`).
- **Decimal Standardization:** All returned prices are standardized to **18 decimal places**.

## 3. Main Functions

### `getPrice(address _asset) external view returns (uint256)`

This is the main read function, used by other contracts (like `Vault`) to get the price of an asset. Only authorized addresses can call it.

### `setPriceFeed(address _asset, address _feed) external onlyRole(DEFAULT_ADMIN_ROLE)`

Administrative function for governance to manage price feeds.

### `setAuthorization(address _user, bool _authorized) external onlyRole(AUTHORIZER_ROLE)`

Function that grants or revokes permission for an address (`_user`) to call the `getPrice()` function.

## 4. Critical Security Mechanisms

The implementation must strictly follow the following security practices to mitigate the risks associated with oracles.

### 4.1. Access Control (`onlyAuthorized`)

- **Mechanism:** The `getPrice` function can only be called by addresses (contracts or users) that have been explicitly authorized.
- **Implementation:** The `getPrice` function uses the `onlyAuthorized` modifier, which checks if `isAuthorized[msg.sender]` is `true`. Authorization is managed by the `setAuthorization(address, bool)` function, which can only be called by the `owner` (governance via `Timelock`).
- **Usage Pattern:** Governance grants the authorization capability to trusted system contracts, such as the `VaultFactory`. The `VaultFactory`, in turn, grants authorization to each new `Vault` it creates.

### 4.2. Stale Price Check

- **Mechanism:** The `getPrice` function **must** check the timestamp of the last price update.
- **Implementation:**
    - The contract will have an immutable `STALE_PRICE_TIMEOUT` variable (e.g., 24 hours).
    - When calling `latestRoundData()`, the returned `updatedAt` value will be compared with `block.timestamp`.
    - If `block.timestamp - updatedAt > STALE_PRICE_TIMEOUT`, the transaction **must** revert with a custom error: `StalePrice(asset, updatedAt)`.

### 4.3. Invalid Price Validation

- **Mechanism:** The `getPrice` function **must** validate the price returned by the oracle.
- **Implementation:**
    - The price (`answer`) returned by `latestRoundData()` must be strictly greater than zero.
    - If `answer <= 0`, the transaction **must** revert with a custom error: `InvalidPrice(asset, answer)`.

### 4.4. Governance-Managed Feeds

- **Mechanism:** Only governance can change the feed addresses.
- **Implementation:** The `setPriceFeed` function uses the `onlyOwner` modifier from OpenZeppelin.

## 5. Events

### `event PriceFeedUpdated(address indexed asset, address indexed feed)`

Emitted whenever a price feed is added or updated, allowing for off-chain monitoring of governance activities.

## 6. Future Iterations

- **Fallback Oracles:** A future version could include a fallback mechanism. If the primary Chainlink feed is outdated, the contract could try to query a secondary oracle (e.g., a TWAP from an AMM) before reverting.
- **Deviation Validation:** A check could be implemented to prevent price updates that deviate more than a certain percentage from the previous price in a short period, as a protection against manipulation or oracle failures.
