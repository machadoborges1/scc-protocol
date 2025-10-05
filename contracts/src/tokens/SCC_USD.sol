// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-contracts/contracts/access/AccessControl.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";
import "openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Burnable.sol";

/**
 * @title SCC_USD Stablecoin
 * @author Humberto
 * @dev ERC20 implementation for our stablecoin, using AccessControl for permissions.
 * @custom:security-contact security@example.com
 */
contract SCC_USD is ERC20, AccessControl, Ownable, ERC20Burnable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant MINTER_GRANTER_ROLE = keccak256("MINTER_GRANTER_ROLE");

    /**
     * @notice Constructs the SCC_USD token.
     * @param initialAdmin The address that will receive initial admin and role-granting rights.
     */
    constructor(address initialAdmin) ERC20("SCC Stablecoin", "SCC-USD") Ownable(initialAdmin) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(MINTER_GRANTER_ROLE, initialAdmin);
        _grantRole(MINTER_ROLE, initialAdmin);
        _setRoleAdmin(MINTER_ROLE, MINTER_GRANTER_ROLE);
    }

    /**
     * @dev Creates `amount` tokens and assigns them to `account`, increasing
     * the total supply.
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     * - The caller must have the {MINTER_ROLE}.
     */
    function mint(address account, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(account, amount);
    }
}