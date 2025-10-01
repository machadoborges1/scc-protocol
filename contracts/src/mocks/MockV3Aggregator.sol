// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

/**
 * @title MockV3Aggregator
 * @author Chainlink
 * @notice Mock para o AggregatorV3Interface, usado em testes.
 */
contract MockV3Aggregator is AggregatorV3Interface {
    uint8 private immutable i_decimals;
    int256 private i_latestAnswer;
    uint256 public i_latestTimestamp;

    constructor(uint8 _decimals, int256 _initialAnswer) {
        i_decimals = _decimals;
        i_latestAnswer = _initialAnswer;
        i_latestTimestamp = block.timestamp;
    }

    function decimals() external view override returns (uint8) {
        return i_decimals;
    }

    function description() external pure override returns (string memory) {
        return "Mock V3 Aggregator";
    }

    function version() external pure override returns (uint256) {
        return 1;
    }

    function getRoundData(uint80) external view override returns (uint80, int256, uint256, uint256, uint80) {
        return (1, i_latestAnswer, i_latestTimestamp, i_latestTimestamp, 1);
    }

    function latestRoundData() external view override returns (uint80, int256, uint256, uint256, uint80) {
        return (1, i_latestAnswer, i_latestTimestamp, i_latestTimestamp, 1);
    }

    function updateAnswer(int256 _answer) external {
        i_latestAnswer = _answer;
        i_latestTimestamp = block.timestamp;
    }

    function updateTimestamp(uint256 _timestamp) external {
        i_latestTimestamp = _timestamp;
    }
}
