// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockOracle
 * @dev A simple mock oracle for testing purposes. Returns a fixed price.
 * @custom:security-contact security@example.com
 * @custom:legacy This is a mock contract for testing purposes only.
 */
contract MockOracle {
    /**
     * @notice The current mock price returned by the oracle.
     */
    uint256 public price;

    /**
     * @notice Constructs a new MockOracle with an initial price.
     */
    constructor() {
        // Set initial mock price, e.g., $3000
        price = 3000 * 1e18;
    }

    /**
     * @notice Returns the current mock price.
     * @return The current price.
     */
    function getPrice() external view returns (uint256) {
        return price;
    }

    /**
     * @notice Sets a new mock price.
     * @param _newPrice The new price to set.
     */
    function setPrice(uint256 _newPrice) external {
        price = _newPrice;
    }
}
