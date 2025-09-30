// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";

/**
 * @title SCC_GOV Governance Token
 * @dev This is the ERC20 implementation for our governance token.
 * The total supply is minted at deployment and sent to the owner (the treasury/deployer).
 * This contract does not have a public minting function after deployment to ensure a fixed supply.
 */
contract SCC_GOV is ERC20, Ownable {
    constructor(
        address initialOwner,
        uint256 initialSupply
    ) ERC20("SCC Governance", "SCC-GOV") Ownable(initialOwner) {
        _mint(initialOwner, initialSupply);
    }
}
