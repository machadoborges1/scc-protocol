# 2. Stablecoin Mechanism (SCC-USD)

This document details the fundamental mechanisms that govern the issuance, burning, and stability maintenance of the `SCC-USD` stablecoin within the SCC protocol. The system is designed to ensure that all `SCC-USD` in circulation is always over-collateralized, maintaining its peg to the US dollar.

## 2.1. Fundamental Concepts

### Vault

A `Vault` is an individual smart contract (represented as an ERC721 NFT) where a user deposits their collateral and generates debt in the form of `SCC-USD`. Each `Vault` is a collateralized debt position (CDP) that the user owns and manages.

### Collateralization Ratio (CR)

The `CR` is the ratio between the value of the collateral deposited in the `Vault` (valued in USD) and the amount of `SCC-USD` issued (debt).

`CR = (Value of Collateral in USD) / (Debt in SCC-USD)`

### Minimum Collateralization Ratio (MCR)

The `MCR` is the lowest `CR` a `Vault` can have to be considered solvent. If a `Vault`'s `CR` falls below the `MCR`, it becomes eligible for liquidation. This is a configurable parameter via governance (e.g., 150%).

### Stability Fee

An annualized interest rate, paid in `SCC-USD`, on the issued debt. This fee acts as a mechanism to control the supply/demand of `SCC-USD` and is a source of revenue for the protocol. It is a governance parameter.

## 2.2. Minting Process (Creating SCC-USD)

The process of creating `SCC-USD` involves the following steps, as implemented in the `mint` function of the `Vault.sol` contract:

1.  **Vault Creation:** The user interacts with the `VaultFactory` to create a new `Vault`, receiving an NFT that represents their position.
2.  **Collateral Deposit:** The user deposits an approved collateral asset (e.g., ETH) into their `Vault` through the `depositCollateral` function.
    *   **Implementation (`Vault.sol`):** The `depositCollateral` function transfers the `_amount` of `collateralToken` from the `msg.sender` to the `Vault` and updates `collateralAmount`.
3.  **SCC-USD Issuance:** The user specifies the amount of `SCC-USD` they wish to issue. The system, through the `mint` function in `Vault.sol`, checks if the `Vault`'s `CR` will remain above the `MCR` after issuance.
    *   **Implementation (`Vault.sol`):** The `mint` function calculates the `collateralValue` using the `OracleManager`, checks if the resulting `collateralizationRatio` is greater than `sccParameters.minCollateralizationRatio()`. If valid, `debtAmount` is updated and `sccUsdToken.mint` is called to create the tokens and transfer them to the `owner()` of the `Vault`.
4.  **Receiving SCC-USD:** If the check is successful, the requested amount of `SCC-USD` is created and transferred to the user's wallet, and the debt is recorded in the `Vault`.

## 2.3. Burning Process (Debt Repayment)

To recover their collateral, the user needs to repay their debt. This process is managed by the `burn` function in `Vault.sol`:

1.  **SCC-USD Approval and Deposit:** The user approves the `Vault` contract to spend their `SCC-USD` and calls the `burn` function to repay the debt.
2.  **SCC-USD Burning:** The amount is transferred to the contract and burned (removed from circulation) via `sccUsdToken.burnFrom`, and the `Vault`'s `debtAmount` is reduced.
3.  **Collateral Withdrawal:** After repaying the debt, the user can withdraw part or all of their collateral using the `withdrawCollateral` function. The system checks that the `Vault`'s `CR` will not fall below the `MCR` after the withdrawal.
    *   **Implementation (`Vault.sol`):** The `withdrawCollateral` function checks the `collateralizationRatio` after the withdrawal. If the debt is greater than zero and the `CR` falls below the `MCR`, the transaction is reverted. Otherwise, `collateralAmount` is updated and the collateral is transferred back to the `owner()` of the `Vault`.

## 2.4. Liquidation Mechanism

Liquidation is a critical process that ensures the system's solvency when the value of a `Vault`'s collateral falls, making it under-collateralized. This process is managed by the `LiquidationManager` and interacts with the `Vault` through specific functions.

1.  **Trigger:** A `Vault` becomes eligible for liquidation when its `CR` falls below the `MCR`. Any external entity (such as a "keeper" or "liquidator bot") can initiate the liquidation process for a `Vault` in this condition.
2.  **Collateral Seizure:** The `LiquidationManager` takes control of the collateral in the liquidated `Vault` through the `transferCollateralTo` function.
    *   **Implementation (`Vault.sol`):** The `transferCollateralTo` function is `external` and `onlyLiquidationManager`, allowing only the `LiquidationManager` to transfer the collateral to itself or another address, reducing `collateralAmount` in the `Vault`.
3.  **Debt Coverage:** A portion of the collateral is sold to cover the outstanding `SCC-USD` debt, plus a liquidation penalty fee.
4.  **Dutch Auctions:** The protocol uses Dutch Auctions to sell the collateral. The price of the collateral starts high and decreases linearly over time. The first participant to buy the collateral at an acceptable price acquires it. This creates demand for `SCC-USD` and removes "bad" debt from the system. The amount raised above the debt is returned to the original `Vault` owner.
    *   **Implementation (`Vault.sol`):** The `reduceDebt` function is `external` and `onlyLiquidationManager`, allowing the `LiquidationManager` to reduce the `Vault`'s `debtAmount` after liquidation.

For more in-depth technical details on the implementation of the liquidation mechanism, refer to the `07-liquidation-mechanism.md` document in the Architecture and Technical Design section.
