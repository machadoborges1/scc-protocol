// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/governance/Governor.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";

/**
 * @title SCC_Governor
 * @dev The core governance contract for the SCC Protocol.
 * This implementation is based on the OpenZeppelin Contracts Wizard template to ensure correctness.
 */
contract SCC_Governor is
    Governor,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    // --- Constants for initial setup ---
    uint256 public constant INITIAL_VOTING_DELAY = 1; // 1 block
    uint256 public constant INITIAL_VOTING_PERIOD = 45818; // ~1 week in blocks (12s block time)
    uint256 public constant INITIAL_PROPOSAL_THRESHOLD = 0;
    uint256 public constant INITIAL_QUORUM_PERCENT = 4; // 4%

    constructor(
        IVotes _token,
        TimelockController _timelock
    )
        Governor("SCC_Governor")
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(INITIAL_QUORUM_PERCENT)
        GovernorTimelockControl(_timelock)
    {}

    // --- Override default settings --- //

    function votingDelay() public pure override returns (uint256) {
        return INITIAL_VOTING_DELAY;
    }

    function votingPeriod() public pure override returns (uint256) {
        return INITIAL_VOTING_PERIOD;
    }

    function proposalThreshold() public pure override returns (uint256) {
        return INITIAL_PROPOSAL_THRESHOLD;
    }

    // --- The following functions are overrides required by Solidity --- //

    function state(uint256 proposalId) public view override(Governor, GovernorTimelockControl) returns (ProposalState) {
        return super.state(proposalId);
    }

    function _queueOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint48) {
        return super._queueOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _executeOperations(
        uint256 proposalId,
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) {
        super._executeOperations(proposalId, targets, values, calldatas, descriptionHash);
    }

    function _cancel(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        bytes32 descriptionHash
    ) internal override(Governor, GovernorTimelockControl) returns (uint256) {
        return super._cancel(targets, values, calldatas, descriptionHash);
    }

    function _executor() internal view override(Governor, GovernorTimelockControl) returns (address) {
        return super._executor();
    }

    function proposalNeedsQueuing(uint256 proposalId) public view override(Governor, GovernorTimelockControl) returns (bool) {
        return super.proposalNeedsQueuing(proposalId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(Governor) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
