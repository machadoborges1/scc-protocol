// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

import "./Vault.sol";
import "./tokens/SCC_USD.sol";

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
    address public immutable oracleManager;
    address public immutable liquidationManager;
    address public immutable sccParameters;

    constructor(
        address _initialOwner,
        address _collateralToken,
        address _sccUsdToken,
        address _oracleManager,
        address _liquidationManager,
        address _sccParameters
    )
        Ownable(_initialOwner)
    {
        collateralToken = _collateralToken;
        sccUsdToken = _sccUsdToken;
        oracleManager = _oracleManager;
        liquidationManager = _liquidationManager;
        sccParameters = _sccParameters;
    }

    /**
     * @notice Creates a new Vault for the caller and transfers ownership to them.
     * @return vaultAddress The address of the newly created Vault.
     */
    function createNewVault() external returns (address vaultAddress) {
        // Deploy a new Vault contract, passing the necessary addresses.
        // The owner of the new Vault will be the person who called this function.
        Vault newVault = new Vault(msg.sender, collateralToken, sccUsdToken, oracleManager, liquidationManager, sccParameters);

        vaultAddress = address(newVault);

        // Authorize the newly created Vault to use the OracleManager
        OracleManager(oracleManager).setAuthorization(vaultAddress, true);

        // Grant the newly created Vault the role to mint SCC_USD
        SCC_USD(sccUsdToken).grantRole(SCC_USD(sccUsdToken).MINTER_ROLE(), vaultAddress);

        emit VaultCreated(vaultAddress, msg.sender);
    }
}
