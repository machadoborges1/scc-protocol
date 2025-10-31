# Vault and VaultFactory Mechanism

**Status:** Implemented
**Affected Contracts:** `Vault.sol`, `VaultFactory.sol`

## 1. Introduction

The Vault system is the heart of the SCC protocol. Each `Vault` functions as an individual Collateralized Debt Position (CDP) for a user, allowing them to borrow the SCC-USD stablecoin against a deposited collateral asset. To ensure uniqueness and ownership, each Vault is represented as an NFT (ERC721 standard).

## 2. VaultFactory

The `VaultFactory` is a simple contract whose sole responsibility is to create new instances of the `Vault` contract.

### `createNewVault()`

- **What it does:** When a user calls this function, the factory deploys a new `Vault` contract.
- **Ownership:** The ownership of the new `Vault` (the corresponding NFT) is immediately transferred to the `msg.sender` (the user who called the function).
- **Parameters:** The factory is already configured with the addresses of the main contracts (Collateral Token, SCC-USD, OracleManager) and passes them to the new `Vault`'s constructor.
- **Authorization (Capability):** After creating the `Vault`, the factory calls `oracleManager.setAuthorization(address(newVault), true)`. This grants the new `Vault` the "capability" to query prices, an essential step for its operation.
- **Event:** Emits a `VaultCreated` event with the new Vault's address and the owner's address.

## 3. Vault

The `Vault` contract manages the collateral and debt of a single position.

### 3.1. Collateral Management Functions

- **`depositCollateral(uint256 _amount)`:**
  - Allows the Vault owner to deposit more collateral into the contract. The user must first approve the Vault contract to transfer the collateral tokens.

- **`withdrawCollateral(uint256 _amount)`:**
  - Allows the Vault owner to withdraw a portion of their collateral. 
  - **Security Check:** The function checks if the withdrawal will not leave the Vault under-collateralized (below the `MIN_COLLATERALIZATION_RATIO`). If the Vault has no debt, all collateral can be withdrawn.

### 3.2. Debt Management Functions

- **`mint(uint256 _amount)`:**
  - Creates (mints) new SCC-USD units and sends them to the Vault owner, increasing their debt.
  - **Security Check:** This is a critical function. It first queries the `OracleManager` to get the current collateral price, calculates the new collateralization ratio that would result from the `mint`, and only proceeds if the new ratio is greater than the `MIN_COLLATERALIZATION_RATIO`.

- **`burn(uint256 _amount)`:**
  - Allows the Vault owner to repay their debt. The user must first approve the Vault contract to spend their SCC-USD.
  - The SCC-USD tokens are transferred from the user and burned, decreasing the Vault's debt and the total supply of the stablecoin.

### 3.3. Interaction with Liquidation

- **`transferCollateralTo(address _to, uint256 _amount)`:**
  - This is a restricted function that can only be called by the `LiquidationManager`.
  - During an auction, it allows the `LiquidationManager` to transfer the Vault's collateral to the auction buyer.

---

## 4. Critical Vulnerability: User-Controlled Liquidation Manager

**Status:** Fixed

-   **Contract:** `Vault.sol`
-   **Function:** `setLiquidationManager(address _manager) external onlyOwner`
-   **Problem Description:** The function allows the `Vault` owner (the end-user) to specify any address as the `LiquidationManager`. A malicious user could point to an empty contract address or a contract that does not execute the liquidation logic, effectively making their `Vault` immune to liquidation.
-   **Impact:** **Critical.** This flaw compromises the protocol's main solvency guarantee. If `Vaults` cannot be liquidated, `SCC-USD` could become under-collateralized throughout the system.
-   **Required Action (Fix):**
    1.  Remove the `setLiquidationManager` function from the `Vault.sol` contract.
    2.  Add the `LiquidationManager` address as an `immutable` variable in `Vault.sol`.
    3.  Update the `Vault.sol` constructor to accept the `LiquidationManager` address.
    4.  Update `VaultFactory.sol` so that it passes the `LiquidationManager` address (which it should know) to the constructor of each new `Vault` that it creates. This ensures that all `Vaults` point to the single, correct `LiquidationManager` of the system, with no possibility of alteration by the user.