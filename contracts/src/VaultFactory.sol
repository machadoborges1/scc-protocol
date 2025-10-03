// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Vault.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VaultFactory
 * @author Humberto
 * A factory contract to deploy new Vault instances for users.
 * @custom:security-contact security@example.com
 * @custom:legacy The previous version of this contract did not include a factory pattern.
 */
contract VaultFactory is Ownable {
    // --- Events ---
    /**
     * @notice Emitted when a new Vault contract is successfully created.
     * @param vaultAddress The address of the newly deployed Vault contract.
     * @param owner The address of the owner of the new Vault.
     */
    event VaultCreated(address indexed vaultAddress, address indexed owner);

    // --- State Variables ---
    /**
     * @notice The address of the ERC20 token used as collateral for new vaults.
     */
    address public immutable collateralToken;
    /**
     * @notice The address of the SCC-USD stablecoin token to be used in new vaults.
     */
    address public immutable sccUsdToken;
    /**
     * @notice The address of the OracleManager contract to be used in new vaults.
     */
    address public immutable oracleManager;

    /**
     * @notice Initializes the VaultFactory contract.
     * @param _initialOwner The initial owner of the factory contract.
     * @param _collateralToken The address of the ERC20 token to be used as collateral for new vaults.
     * @param _sccUsdToken The address of the SCC-USD stablecoin token to be used in new vaults.
     * @param _oracleManager The address of the OracleManager contract to be used in new vaults.
     */
    constructor(
        address _initialOwner,
        address _collateralToken,
        address _sccUsdToken,
        address _oracleManager
    ) Ownable(_initialOwner) {
        collateralToken = _collateralToken;
        sccUsdToken = _sccUsdToken;
        oracleManager = _oracleManager;
    }

    /**
     * @notice Creates a new Vault for the caller and transfers ownership to them.
     * @return vaultAddress The address of the newly created Vault.
     */
    function createNewVault() external returns (address vaultAddress) {
        // Deploy a new Vault contract, passing the necessary addresses.
        // The owner of the new Vault will be the person who called this function.
        Vault newVault = new Vault(msg.sender, collateralToken, sccUsdToken, oracleManager);

        vaultAddress = address(newVault);

        // Authorize the newly created Vault to use the OracleManager
        OracleManager(oracleManager).setAuthorization(vaultAddress, true);

        emit VaultCreated(vaultAddress, msg.sender);
    }
}
