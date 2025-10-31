# Token Permission Flow (Mint and Burn)

**Status:** Implemented / Vulnerability Identified

## 1. Context and Problem (Minting)

During the integration tests of the off-chain bot, a revert error was identified in the `vault.mint()` call. The analysis revealed the root cause: a newly created `Vault` did not have the necessary permission (`MINTER_ROLE`) to mint new `SCC_USD` tokens.

The original deploy script configured the permissions for the `OracleManager`, but did not establish a flow for the `Vaults` to receive the minting permission, a requirement of the architecture.

## 2. Design Solution (Minting)

To solve the problem, a solution was implemented that mirrors the secure design pattern already used for the `OracleManager` permissions, ensuring architectural consistency and adhering to the **Principle of Least Privilege**.

The solution is based on a three-step power delegation:

### 2.1. Step 1: Modification of the `SCC_USD.sol` Contract

A new access role (`bytes32`) was introduced in the `SCC_USD` contract:

- **`MINTER_GRANTER_ROLE`**: An administrative role whose sole purpose is to manage who has the `MINTER_ROLE`.

In the `SCC_USD` constructor, the `_setRoleAdmin(MINTER_ROLE, MINTER_GRANTER_ROLE)` function is called. This establishes that only an account with the `MINTER_GRANTER_ROLE` can grant or revoke the `MINTER_ROLE` from other accounts.

### 2.2. Step 2: Update of the `Deploy.s.sol` Script

The deploy script was updated to orchestrate the new role configuration:

1.  After the deployment of `SCC_USD` and `VaultFactory`, the script grants the `MINTER_GRANTER_ROLE` to the `VaultFactory`'s address.
2.  The `DEFAULT_ADMIN_ROLE` (general administrator role) of `SCC_USD` is, as before, transferred to the `TimelockController` for final governance control.

This ensures that the `VaultFactory` has only the specific and limited permission it needs.

### 2.3. Step 3: Update of the `VaultFactory.sol` Contract

The `createNewVault` function was modified. In addition to authorizing the new vault in the `OracleManager`, it now also performs the following action:

- **Permission Granting:** The factory calls `sccUsdToken.grantRole(MINTER_ROLE, address(newVault))`, using its `MINTER_GRANTER_ROLE` to give the newly created `Vault` the ability to mint `SCC-USD`.

---

## 3. Critical Vulnerability in the Burn Flow

**Status:** Fixed

-   **Contract:** `SCC_USD.sol`
-   **Function:** `burn(address account, uint256 amount) public onlyRole(MINTER_ROLE)`
-   **Problem Description:** The token burning function was implemented in a way that allows any address with `MINTER_ROLE` to burn tokens from any `account`. Since each created `Vault` receives the `MINTER_ROLE`, each individual `Vault` has the permission to destroy the `SCC-USD` balance of any other user or contract in the system.
-   **Impact:** **Critical.** This is an overly broad and dangerous permission. A bug or vulnerability in a single `Vault` could be exploited to burn the funds of other users, causing direct and irreparable financial losses. It breaks the isolation and security that individual `Vaults` should have.
-   **Required Action (Fix):**
    1.  **Remove** the `burn(address account, uint256 amount)` function from the `SCC_USD.sol` contract.
    2.  Make `SCC_USD.sol` inherit from the OpenZeppelin `ERC20Burnable.sol` contract. This will provide two secure and standardized functions:
        - `burn(uint256 amount)`: Burns tokens from the `msg.sender`.
        - `burnFrom(address account, uint256 amount)`: Burns tokens from an `account` using the `allowance` (approval) system.
    3.  Update the `burn` function in the `Vault.sol` contract. Instead of calling the dangerous function, it should use `sccUsdToken.burnFrom(owner(), _amount)`. This will require the user to first approve the `Vault` contract to spend their `SCC-USD`, which is the standard and secure flow for token interactions.