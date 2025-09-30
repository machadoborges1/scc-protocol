// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Vault.sol";

/**
 * @title VaultFactory
 * @dev A factory contract to deploy new Vault instances for users.
 */
contract VaultFactory {
    // --- Events ---
    event VaultCreated(address indexed vaultAddress, address indexed owner);

    // --- State Variables ---
    address public immutable collateralToken;
    address public immutable sccUsdToken;
    address public immutable oracle;

    constructor(
        address _collateralToken,
        address _sccUsdToken,
        address _oracle
    ) {
        collateralToken = _collateralToken;
        sccUsdToken = _sccUsdToken;
        oracle = _oracle;
    }

    /**
     * @notice Creates a new Vault for the caller and transfers ownership to them.
     * @return vaultAddress The address of the newly created Vault.
     */
    function createNewVault() external returns (address vaultAddress) {
        // Deploy a new Vault contract, passing the necessary addresses.
        // The owner of the new Vault will be the person who called this function.
        Vault newVault = new Vault(msg.sender, collateralToken, sccUsdToken, oracle);
        
        vaultAddress = address(newVault);

        emit VaultCreated(vaultAddress, msg.sender);
    }
}
