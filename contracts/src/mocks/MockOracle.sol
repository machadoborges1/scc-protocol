// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockOracle
 * @dev A simple mock oracle for testing purposes. Returns a fixed price.
 */
contract MockOracle {
    uint256 public price;

    constructor() {
        // Set initial mock price, e.g., $3000
        price = 3000 * 1e18;
    }

    function getPrice() external view returns (uint256) {
        return price;
    }

    function setPrice(uint256 _newPrice) external {
        price = _newPrice;
    }
}
