// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title MockV3Aggregator
 * @author Chainlink
 * @notice Mock for the AggregatorV3Interface, used in tests.
 * @custom:security-contact security@example.com
 * @custom:legacy This is a mock contract for testing purposes only.
 */
contract MockV3Aggregator is AggregatorV3Interface {
    uint8 private immutable i_decimals;
    int256 private i_latestAnswer;
    /**
     * @notice The timestamp of the latest answer.
     */
    uint256 public i_latestTimestamp;

    /**
     * @notice Initializes the MockV3Aggregator with initial values.
     * @param _decimals The number of decimals for the price feed.
     * @param _initialAnswer The initial price answer.
     */
    constructor(uint8 _decimals, int256 _initialAnswer) {
        i_decimals = _decimals;
        i_latestAnswer = _initialAnswer;
        i_latestTimestamp = block.timestamp;
    }

    /**
     * @notice Returns the number of decimals for the price feed.
     * @return The number of decimals.
     */
    function decimals() external view override returns (uint8) {
        return i_decimals;
    }

    /**
     * @notice Returns a human-readable description of the price feed.
     * @return The description string.
     */
    function description() external pure override returns (string memory) {
        return "Mock V3 Aggregator";
    }

    /**
     * @notice Returns the version of the price feed interface.
     * @return The version number.
     */
    function version() external pure override returns (uint256) {
        return 1;
    }

    /**
     * @notice Returns the data for a specific round.
     * @dev This mock always returns data for round 1.
     * @return roundId The round ID.
     * @return answer The price answer.
     * @return startedAt The timestamp when the round started.
     * @return updatedAt The timestamp when the round was last updated.
     * @return answeredInRound The round ID in which the answer was computed.
     */
    function getRoundData(uint80 /* roundId */) external view override returns (uint80, int256, uint256, uint256, uint80) {
        return (1, i_latestAnswer, i_latestTimestamp, i_latestTimestamp, 1);
    }

    /**
     * @notice Returns the data for the latest round.
     * @dev This mock always returns data for round 1.
     * @return roundId The round ID.
     * @return answer The price answer.
     * @return startedAt The timestamp when the round started.
     * @return updatedAt The timestamp when the round was last updated.
     * @return answeredInRound The round ID in which the answer was computed.
     */
    function latestRoundData() external view override returns (uint80, int256, uint256, uint256, uint80) {
        return (1, i_latestAnswer, i_latestTimestamp, i_latestTimestamp, 1);
    }

    /**
     * @notice Updates the latest answer for the price feed.
     * @param _answer The new price answer.
     */
    function updateAnswer(int256 _answer) external {
        i_latestAnswer = _answer;
        i_latestTimestamp = block.timestamp;
    }

    /**
     * @notice Updates the timestamp of the latest answer.
     * @param _timestamp The new timestamp.
     */
    function updateTimestamp(uint256 _timestamp) external {
        i_latestTimestamp = _timestamp;
    }
}
