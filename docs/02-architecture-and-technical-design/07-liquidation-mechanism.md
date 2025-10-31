# 7. Liquidation Mechanism (Dutch Auction)

This document describes the liquidation mechanism implemented in the SCC Protocol, which uses a **Dutch Auction** model to ensure the system's solvency. This mechanism is managed by the `LiquidationManager.sol` contract and is crucial for maintaining the over-collateralization of `SCC-USD`.

## 7.1. Dutch Auction Overview

The Dutch Auction inverts the price discovery process compared to a traditional English auction. Instead of the price increasing with bids, it starts high and decreases linearly over time until a buyer intervenes. This model is inspired by reference protocols like MakerDAO, aiming for greater capital efficiency, lower gas costs for participants, and a faster, more deterministic liquidation process.

### 7.1.1. Auction Flow

1.  **Start (`startAuction`):** When a `Vault` becomes under-collateralized (its CR falls below the `minCollateralizationRatio` defined in `SCC_Parameters`), anyone (usually a Keeper Bot) can call the `startAuction()` function in `LiquidationManager.sol` to start an auction.
    *   The collateral price starts high, calculated based on the current oracle price (`OracleManager`) and a multiplier (`startPriceMultiplier` from `SCC_Parameters`).
    *   A new `Auction` is created, recording the `collateralAmount`, `debtToCover`, `vaultAddress`, `startTime`, and `startPrice`.
2.  **Price Decay:** The collateral price decreases linearly over time. The `getCurrentPrice()` function calculates the current price based on the auction's `startTime` and the `priceDecayHalfLife` (defined in `SCC_Parameters`).
3.  **Buy (`buy`):** A participant (buyer) monitors the auction off-chain. When the price reaches a level they consider fair or profitable, they call the `buy()` function in `LiquidationManager.sol`.

### 7.1.2. The `buy()` Function

The `buy()` function is atomic and allows the buyer to acquire collateral and pay the debt in a single transaction:

1.  The buyer specifies the `_auctionId` and the amount of collateral (`_collateralToBuy`) they wish to acquire.
2.  The contract calculates the `currentPrice` and the `debtRequiredForDesiredCollateral` (cost in `SCC-USD`).
3.  The `SCC-USD` is transferred from the buyer's wallet to the `LiquidationManager` contract.
4.  The collateral is transferred from the liquidated `Vault` to the buyer's wallet (using `vault.transferCollateralTo()`).
5.  The `Vault`'s state is updated, reducing its debt (`vault.reduceDebt()`).
6.  The auction's state (`auction.collateralAmount` and `auction.debtToCover`) is updated.
7.  If the auction is completed (debt covered or collateral depleted), any remaining collateral is returned to the original `Vault` owner, and the auction is finalized (`_closeAuction()`).

## 7.2. Advantages of the Dutch Auction Model

*   **Capital and Gas Efficiency:** A buyer executes only one transaction to secure their purchase, optimizing gas usage.
*   **Speed:** Liquidations can be completed much more quickly, as soon as a buyer is willing to pay the current price.
*   **User Simplicity:** The process is straightforward: call `buy()` and receive the asset instantly.
*   **Predictability:** The price path is deterministic, making it easier to program liquidator bots.

## 7.3. Key Functions of `LiquidationManager.sol`

*   **`startAuction(address _vaultAddress)`:** Starts an auction for an under-collateralized `Vault`. It checks if the `Vault` is liquidatable and not already in an auction. It calculates the initial auction price.
*   **`buy(uint256 _auctionId, uint256 _collateralToBuy)`:** Allows the purchase of collateral from an ongoing auction. It performs the atomic exchange of `SCC-USD` for collateral and updates the states.
*   **`getCurrentPrice(uint256 _auctionId)`:** `view` function that calculates the current price of the collateral in an auction, based on the elapsed time and decay parameters.
*   **`isVaultLiquidatable(address _vaultAddress)`:** `view` function that checks if a `Vault` is below the `minCollateralizationRatio` and is eligible for liquidation.
*   **`withdrawFees(address _recipient, uint256 _amount)`:** `onlyOwner` function that allows governance to withdraw the `SCC-USD` fees accumulated in the `LiquidationManager` contract (a fix for a critical issue identified in the initial version).

## 7.4. Liquidation Parameters (Configurable via Governance)

The following parameters, stored in `SCC_Parameters.sol`, directly influence the behavior of the auctions and are controlled by governance:

*   **`minCollateralizationRatio`:** The minimum CR that a `Vault` must maintain. Below this value, the `Vault` is liquidatable.
*   **`priceDecayHalfLife`:** The time in seconds for the auction price to decay by half.
*   **`startPriceMultiplier`:** A multiplier applied to the oracle price to set the initial auction price (e.g., 150% of the market price).

## 7.5. Interactions

The `LiquidationManager` interacts with:

*   **`Vault.sol`:** To transfer collateral and reduce the debt of the liquidated `Vault`.
*   **`OracleManager.sol`:** To get the updated prices of collateral assets.
*   **`SCC_Parameters.sol`:** To query the configurable auction parameters.
*   **`SCC_USD.sol`:** To receive `SCC-USD` payments from buyers.
