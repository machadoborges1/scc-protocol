# 2. SCC Protocol Smart Contracts

This section details the main smart contracts that make up the on-chain core of the SCC Protocol. Each contract is responsible for a specific functionality, and the interaction between them ensures the secure and decentralized operation of the `SCC-USD` stablecoin.

## 2.1. `VaultFactory.sol`

*   **Purpose:** Factory contract responsible for creating and managing new `Vault` instances for users.
*   **Key Features:**
    *   `createNewVault()`: Creates a new `Vault` contract (implemented as a proxy to allow for future upgrades) and transfers ownership (NFT) to the caller. It also authorizes the new `Vault` to interact with the `OracleManager` and grants it the `MINTER_ROLE` in the `SCC_USD` contract.
*   **Interactions:** Interacts with `Vault.sol`, `OracleManager.sol`, and `SCC_USD.sol` during the creation of a new `Vault`.

## 2.2. `Vault.sol`

*   **Purpose:** Represents a user's Collateralized Debt Position (CDP) as an NFT (ERC721). Each `Vault` holds a user's collateral and tracks their debt in `SCC-USD`.
*   **Key Features:**
    *   `depositCollateral(uint256 _amount)`: Allows the `Vault` owner to deposit collateral (e.g., WETH).
    *   `withdrawCollateral(uint256 _amount)`: Allows the owner to withdraw collateral, as long as the Collateralization Ratio (CR) does not fall below the minimum.
    *   `mint(uint256 _amount)`: Allows the owner to issue `SCC-USD` against the collateral, checking the minimum CR.
    *   `burn(uint256 _amount)`: Allows the owner to burn `SCC-USD` to reduce debt.
    *   `transferCollateralTo(address _to, uint256 _amount)`: Function restricted to the `LiquidationManager` to transfer collateral during a liquidation.
    *   `reduceDebt(uint256 _amount)`: Function restricted to the `LiquidationManager` to reduce the `Vault`'s debt after a liquidation.
*   **Interactions:** Interacts with `OracleManager.sol` to get prices, `SCC_USD.sol` for minting/burning, and `LiquidationManager.sol` during the liquidation process.

## 2.3. `SCC_USD.sol`

*   **Purpose:** The implementation of the `SCC-USD` stablecoin token (ERC20), with mint and burn functionalities controlled by roles.
*   **Key Features:**
    *   `mint(address to, uint256 amount)`: Issues new `SCC-USD` tokens to a specific address. Restricted to addresses with the `MINTER_ROLE` (such as `Vault` contracts).
    *   `burnFrom(address from, uint256 amount)`: Burns `SCC-USD` tokens from a specific address. Restricted to addresses with the `BURNER_ROLE` (such as `Vault` contracts).
*   **Interactions:** Mainly with `Vault.sol` for managing the `SCC-USD` supply.

## 2.4. `SCC_GOV.sol`

*   **Purpose:** The implementation of the `SCC-GOV` governance token (ERC20Votes), which confers voting power to its holders.
*   **Key Features:**
    *   `delegate(address delegatee)`: Allows `SCC-GOV` holders to delegate their voting power to themselves or another address.
    *   `getVotes(address account, uint256 blockNumber)`: Returns the voting power of an account at a specific block, crucial for governance.
*   **Interactions:** Used by `SCC_Governor.sol` to determine voting power in proposals.

## 2.5. `OracleManager.sol`

*   **Purpose:** Manages Chainlink price feeds for the SCC protocol, providing a standardized and secure interface for obtaining asset prices.
*   **Key Features:**
    *   `getPrice(address _asset)`: Returns the latest price of an asset, standardized to 18 decimals, with security checks for stale (`STALE_PRICE_TIMEOUT`) or invalid prices. Access is restricted to authorized addresses.
    *   `setPriceFeed(address _asset, address _feed)`: Sets or updates the Chainlink price feed address for an asset. Only the `DEFAULT_ADMIN_ROLE` (governance) can call this.
    *   `setAuthorization(address _user, bool _authorized)`: Authorizes or de-authorizes an address to call the `getPrice` function. Only the `AUTHORIZER_ROLE` (e.g., `VaultFactory`) can call this.
*   **Interactions:** Queried by `Vault.sol` and `LiquidationManager.sol` to get collateral prices.

## 2.6. `SCC_Parameters.sol`

*   **Purpose:** Stores and manages global configurable parameters of the SCC protocol, such as the Minimum Collateralization Ratio and auction parameters.
*   **Key Features (only for the `owner` - governance):**
    *   `setMinCollateralizationRatio(uint256 _newRatio)`: Updates the Minimum Collateralization Ratio.
    *   `setPriceDecayHalfLife(uint256 _newHalfLife)`: Updates the price decay half-life for auctions.
    *   `setStartPriceMultiplier(uint256 _newMultiplier)`: Updates the starting price multiplier for auctions.
*   **Interactions:** Queried by `Vault.sol` and `LiquidationManager.sol` to get the current protocol parameters.

## 2.7. `LiquidationManager.sol`

*   **Purpose:** Manages the liquidation process of unhealthy `Vaults` through Dutch Auctions, where the collateral price starts high and decays over time.
*   **Key Features:**
    *   `startAuction(address _vaultAddress)`: Starts an auction for an under-collateralized `Vault`. Anyone can call this, but the `Vault` must be below the minimum CR. It calculates the initial auction price based on the oracle price and a multiplier.
    *   `buy(uint256 _auctionId, uint256 _collateralToBuy)`: Allows a buyer to acquire collateral from an ongoing auction, paying in `SCC-USD`. The function manages the atomic transfer of `SCC-USD` and collateral, and updates the state of the `Vault` and the auction.
    *   `getCurrentPrice(uint256 _auctionId)`: Calculates the current price of the collateral in an auction, using a linear decay model.
    *   `isVaultLiquidatable(address _vaultAddress)`: Checks if a `Vault` is below the minimum CR and is eligible for liquidation.
*   **Interactions:** Interacts with `Vault.sol` to transfer collateral and reduce debt, `OracleManager.sol` to get prices, and `SCC_Parameters.sol` to get auction parameters.

## 2.8. `SCC_Governor.sol`

*   **Purpose:** The central governance contract, based on the OpenZeppelin Governor, which orchestrates the process of voting on and executing proposals.
*   **Key Features:**
    *   Manages the creation, voting, and queuing of proposals.
    *   Defines `votingDelay`, `votingPeriod`, `proposalThreshold`, and `quorum`.
    *   Interacts with the `TimelockController` for the secure execution of approved proposals.
*   **Interactions:** Interacts with `SCC_GOV.sol` for voting power and with the `TimelockController` for proposal execution.

## 2.9. `TimelockController.sol`

*   **Purpose:** Acts as a time-locked safe, being the owner of critical protocol contracts. It ensures a security delay between the approval of a governance proposal and its execution.
*   **Key Features:**
    *   `queue(address target, uint256 value, bytes memory data, bytes32 predecessor, bytes32 salt, uint256 delay)`: Queues an operation to be executed after a `delay`.
    *   `execute(address target, uint256 value, bytes memory data, bytes32 predecessor, bytes32 salt)`: Executes a queued operation after the `delay` has passed.
*   **Interactions:** Receives calls from `SCC_Governor.sol` and executes actions on other protocol contracts (e.g., `VaultFactory`, `OracleManager`, `LiquidationManager`, `StakingPool`, `SCC_Parameters`).
