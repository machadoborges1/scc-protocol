// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title SCC_USD Stablecoin
 * @author Humberto
 * @dev This is the basic ERC20 implementation for our stablecoin.
 * Minting and burning are restricted to the owner (initially a deployer,
 * later to be the protocol's core logic contracts like the Vaults).
 * @custom:security-contact security@example.com
 * @custom:legacy This contract is the initial version of the SCC_USD stablecoin.
 */
contract SCC_USD is ERC20, Ownable {
    /**
     * @notice Constructs the SCC_USD token.
     * @param initialOwner The address that will be the initial owner of the contract,
     * and thus authorized to mint and burn tokens.
     */
    constructor(address initialOwner) ERC20("SCC Stablecoin", "SCC-USD") Ownable(initialOwner) {}

    /**
     * @dev Creates `amount` tokens and assigns them to `account`, increasing
     * the total supply.
     *
     * Emits a {Transfer} event with `from` set to the zero address.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     * - The caller must be the owner.
     */
    function mint(address account, uint256 amount) public onlyOwner {
        _mint(account, amount);
    }

    /**
     * @dev Destroys `amount` tokens from `account`, reducing the
     * total supply. This is an internal function, the public-facing
     * burn function will be on the Vaults.
     *
     * Emits a {Transfer} event with `to` set to the zero address.
     *
     * Requirements:
     *
     * - `account` cannot be the zero address.
     * - `account` must have at least `amount` tokens.
     * - The caller must be the owner.
     */
    function burn(address account, uint256 amount) public onlyOwner {
        _burn(account, amount);
    }
}
