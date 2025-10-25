// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SCC_Parameters
 * @author Humberto
 * @dev This contract stores and manages global parameters for the SCC protocol.
 * These parameters can be updated by the governance contract (owner).
 * @custom:security-contact security@example.com
 */
contract SCC_Parameters is Ownable {
    // --- State Variables ---

    /**
     * @notice The minimum collateralization ratio required for a Vault (e.g., 150 for 150%).
     */
    uint256 public minCollateralizationRatio;

    /**
     * @notice The time in seconds it takes for the auction price to halve in the LiquidationManager.
     */
    uint256 public priceDecayHalfLife;

    /**
     * @notice Multiplier for the starting price of collateral in an auction (e.g., 150 for 150%).
     */
    uint256 public startPriceMultiplier;

    // --- Events ---

    /**
     * @notice Emitted when the minimum collateralization ratio is updated.
     * @param newRatio The new minimum collateralization ratio.
     */
    event MinCollateralizationRatioUpdated(uint256 newRatio);

    /**
     * @notice Emitted when the price decay half-life for auctions is updated.
     * @param newHalfLife The new price decay half-life in seconds.
     */
    event PriceDecayHalfLifeUpdated(uint256 newHalfLife);

    /**
     * @notice Emitted when the start price multiplier for auctions is updated.
     * @param newMultiplier The new start price multiplier.
     */
    event StartPriceMultiplierUpdated(uint256 newMultiplier);

    /**
     * @notice Initializes the SCC_Parameters contract.
     * @param _initialOwner The address of the initial owner (governance contract).
     * @param _minCollateralizationRatio The initial minimum collateralization ratio.
     * @param _priceDecayHalfLife The initial price decay half-life for auctions.
     * @param _startPriceMultiplier The initial start price multiplier for auctions.
     */
    constructor(
        address _initialOwner,
        uint256 _minCollateralizationRatio,
        uint256 _priceDecayHalfLife,
        uint256 _startPriceMultiplier
    ) Ownable(_initialOwner) {
        minCollateralizationRatio = _minCollateralizationRatio;
        priceDecayHalfLife = _priceDecayHalfLife;
        startPriceMultiplier = _startPriceMultiplier;
    }

    /**
     * @notice Updates the minimum collateralization ratio.
     * @dev Only callable by the owner (governance).
     * @param _newRatio The new minimum collateralization ratio.
     */
    function setMinCollateralizationRatio(uint256 _newRatio) external onlyOwner {
        minCollateralizationRatio = _newRatio;
        emit MinCollateralizationRatioUpdated(_newRatio);
    }

    /**
     * @notice Updates the price decay half-life for auctions.
     * @dev Only callable by the owner (governance).
     * @param _newHalfLife The new price decay half-life in seconds.
     */
    function setPriceDecayHalfLife(uint256 _newHalfLife) external onlyOwner {
        priceDecayHalfLife = _newHalfLife;
        emit PriceDecayHalfLifeUpdated(_newHalfLife);
    }

    /**
     * @notice Updates the start price multiplier for auctions.
     * @dev Only callable by the owner (governance).
     * @param _newMultiplier The new start price multiplier.
     */
    function setStartPriceMultiplier(uint256 _newMultiplier) external onlyOwner {
        startPriceMultiplier = _newMultiplier;
        emit StartPriceMultiplierUpdated(_newMultiplier);
    }
}
