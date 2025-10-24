// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @dev A simple ERC20 token for testing, with a public mint function.
 * @custom:security-contact security@example.com
 * @custom:legacy This is a mock contract for testing purposes only.
 */
contract MockERC20 is ERC20 {
    /**
     * @notice Constructs a new MockERC20 token.
     * @param name The name of the token.
     * @param symbol The symbol of the token.
     */
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {}

    /**
     * @notice Mints `amount` of tokens to `to`.
     * @dev This function is public for testing purposes.
     * @param to The address to mint tokens to.
     * @param amount The amount of tokens to mint.
     */
    function mint(address to, uint256 amount) public {
        _mint(to, amount);
    }
}
