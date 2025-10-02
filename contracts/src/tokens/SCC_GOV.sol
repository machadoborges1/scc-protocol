// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";
import "openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "openzeppelin-contracts/contracts/token/ERC20/extensions/ERC20Votes.sol";

/**
 * @title SCC_GOV Governance Token
 * @author Humberto
 * @dev This is the ERC20 implementation for our governance token.
 * It includes the ERC20Votes extension to support on-chain governance.
 * The total supply is minted at deployment and sent to the owner.
 * Users must delegate their voting power to themselves or another address to vote.
 * @custom:security-contact security@example.com
 * @custom:legacy This contract is the initial version of the SCC_GOV token.
 */
contract SCC_GOV is ERC20, Ownable, ERC20Permit, ERC20Votes {
    /**
     * @notice Constructs the SCC_GOV token.
     * @param initialOwner The address that will receive the initial supply of tokens.
     * @param initialSupply The total initial supply of SCC_GOV tokens.
     */
    constructor(address initialOwner, uint256 initialSupply)
        ERC20("SCC Governance", "SCC-GOV")
        Ownable(initialOwner)
        ERC20Permit("SCC Governance")
    {
        _mint(initialOwner, initialSupply);
    }

    // The following functions are overrides required by Solidity.

    /**
     * @dev See {ERC20-_update}.
     * @param from The address from which tokens are moved.
     * @param to The address to which tokens are moved.
     * @param value The amount of tokens moved.
     */
    function _update(address from, address to, uint256 value) internal override(ERC20, ERC20Votes) {
        super._update(from, to, value);
    }

    /**
     * @dev See {ERC20Permit-nonces}.
     * @param owner The address whose nonce is queried.
     * @return The current nonce for the owner.
     */
    function nonces(address owner) public view override(ERC20Permit, Nonces) returns (uint256) {
        return super.nonces(owner);
    }
}
