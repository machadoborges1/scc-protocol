# 6. Oracle Management (`OracleManager.sol`)

This document describes the design and implementation of the `OracleManager.sol` contract, responsible for aggregating and providing reliable and decentralized prices for the collateral assets used in the SCC protocol. The goal is to abstract the complexity of external data sources and provide a secure, standardized, and robust interface for other protocol contracts, such as `Vault` and `LiquidationManager`.

## 6.1. Main Architecture

The `OracleManager` is a singular contract, designed to be the single source of truth for asset prices within the protocol. It uses the OpenZeppelin `AccessControl` pattern for granular and secure permission management.

*   **Access Control (RBAC):**
    *   **`DEFAULT_ADMIN_ROLE`:** Main administrator role, with permission to execute critical functions like `setPriceFeed()`. The ownership of this role is intended for the governance `TimelockController` contract.
    *   **`AUTHORIZER_ROLE`:** Secondary role whose only permission is to call the `setAuthorization()` function. This role is intended for the `VaultFactory` contract, allowing it to authorize the `Vaults` it creates without receiving any other administrative permissions.
*   **Feed Mapping:** The contract maintains a mapping (`s_priceFeeds`) from the address of a collateral asset (e.g., WETH) to the address of its respective Chainlink Price Feed (`AggregatorV3Interface`).
*   **Decimal Standardization:** All returned prices are standardized to **18 decimal places** (`PRICE_DECIMALS`).

## 6.2. Main Functions

### `getPrice(address _asset) external view onlyAuthorized returns (uint256)`

*   **Purpose:** Main read function, used by other contracts (like `Vault` and `LiquidationManager`) to get the price of an asset.
*   **Security:** Only authorized addresses (`isAuthorized[msg.sender] == true`) can call it. It includes security checks for stale (`STALE_PRICE_TIMEOUT`) or invalid (`answer <= 0`) prices.
*   **Return:** The asset price in USD, with 18 decimals.

### `setPriceFeed(address _asset, address _feed) external onlyRole(DEFAULT_ADMIN_ROLE)`

*   **Purpose:** Administrative function for governance to manage price feeds.
*   **Security:** Only accounts with the `DEFAULT_ADMIN_ROLE` (governance) can call this function.

### `setAuthorization(address _user, bool _authorized) external onlyRole(AUTHORIZER_ROLE)`

*   **Purpose:** Grants or revokes permission for an address (`_user`) to call the `getPrice()` function.
*   **Security:** Only accounts with the `AUTHORIZER_ROLE` (e.g., `VaultFactory`) can call this function.

## 6.3. Critical Security Mechanisms

The `OracleManager` implementation strictly incorporates the following security practices to mitigate the risks associated with oracles:

### 6.3.1. Access Control (`onlyAuthorized`)

*   The `getPrice` function can only be called by addresses that have been explicitly authorized via `setAuthorization`. This prevents unauthorized contracts or arbitrary users from querying the oracle, adding a layer of security.

### 6.3.2. Stale Price Check

*   The contract has an immutable `STALE_PRICE_TIMEOUT` variable (set in the constructor). When querying a price feed, the returned `updatedAt` is compared with `block.timestamp`. If the price is older than `STALE_PRICE_TIMEOUT`, the transaction reverts with the `StalePrice(asset, updatedAt)` error, protecting against the use of outdated data.

### 6.3.3. Invalid Price Validation

*   The price (`answer`) returned by the oracle is validated to ensure it is strictly greater than zero. If `answer <= 0`, the transaction reverts with the `InvalidPrice(asset, answer)` error, preventing the use of malicious or incorrect prices.

### 6.3.4. Governance-Managed Feeds

*   Only governance (holder of the `DEFAULT_ADMIN_ROLE`) can change the price feed addresses through the `setPriceFeed` function, ensuring that only trusted entities can configure critical data sources.

## 6.4. Events

*   **`PriceFeedUpdated(address indexed asset, address indexed feed)`:** Emitted whenever a price feed is added or updated, allowing for off-chain monitoring of governance activities.
*   **`AuthorizationSet(address indexed user, bool authorized)`:** Emitted when an address is authorized or de-authorized to call `getPrice`.

## 6.5. Future Iterations

*   **Fallback Oracles:** Implementation of a fallback mechanism to query secondary oracles if the primary Chainlink feed is outdated or fails.
*   **Deviation Validation:** Addition of checks to prevent price updates that deviate significantly from the previous price in a short period, as a protection against manipulation or oracle failures.
