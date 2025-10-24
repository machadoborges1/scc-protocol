// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Governor} from "@openzeppelin/contracts/governance/Governor.sol";
import {GovernorCountingSimple} from "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import {GovernorVotes} from "@openzeppelin/contracts/governance/extensions/GovernorVotes.sol";
import {GovernorVotesQuorumFraction} from "@openzeppelin/contracts/governance/extensions/GovernorVotesQuorumFraction.sol";
import {GovernorTimelockControl} from "@openzeppelin/contracts/governance/extensions/GovernorTimelockControl.sol";
import {IVotes} from "@openzeppelin/contracts/governance/utils/IVotes.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";

/**
 * @title SCC_Governor
 * @author Humberto
 * @dev The core governance contract for the SCC Protocol.
 * This implementation is based on the OpenZeppelin Contracts Wizard template to ensure correctness.
 * @custom:security-contact security@example.com
 * @custom:legacy This contract is the initial version of the SCC Governor.
 */
contract SCC_Governor is
    Governor,
    GovernorCountingSimple,
    GovernorVotes,
    GovernorVotesQuorumFraction,
    GovernorTimelockControl
{
    // --- Constants for initial setup ---
    /**
     * @notice The initial voting delay in blocks before a proposal can be voted on.
     */
    uint256 public constant INITIAL_VOTING_DELAY = 1; // 1 block
    /**
     * @notice The initial voting period in blocks for a proposal.
     */
    uint256 public constant INITIAL_VOTING_PERIOD = 45818; // ~1 week in blocks (12s block time)
    /**
     * @notice The initial minimum number of votes required for a proposal to be created.
     */
    uint256 public constant INITIAL_PROPOSAL_THRESHOLD = 0;
    /**
     * @notice The initial percentage of total votes required for a proposal to pass.
     */
    uint256 public constant INITIAL_QUORUM_PERCENT = 4; // 4%

    /**
     * @notice Initializes the SCC_Governor contract.
     * @param _token The address of the governance token (e.g., SCC_GOV).
     * @param _timelock The address of the TimelockController contract.
     */
    constructor(IVotes _token, TimelockController _timelock)
        Governor("SCC_Governor")
        GovernorVotes(_token)
        GovernorVotesQuorumFraction(INITIAL_QUORUM_PERCENT)
        GovernorTimelockControl(_timelock)
    {}

    // --- Override default settings --- //

    /**
     * @notice Returns the voting delay in blocks.
     * @dev Overrides the default Governor voting delay.
     * @return The number of blocks after a proposal is created before voting starts.
     */
    function votingDelay() public pure override returns (uint256) {
        return INITIAL_VOTING_DELAY;
    }

    /**
     * @notice Returns the voting period in blocks.
     * @dev Overrides the default Governor voting period.
     * @return The number of blocks for which voting is open.
     */
    function votingPeriod() public pure override returns (uint256) {
        return INITIAL_VOTING_PERIOD;
    }

    /**
     * @notice Returns the minimum number of votes required for a proposal to be created.
     * @dev Overrides the default Governor proposal threshold.
     * @return The minimum number of votes required to create a proposal.
     */
    function proposalThreshold() public pure override returns (uint256) {
        return INITIAL_PROPOSAL_THRESHOLD;
    }

    // --- The following functions are overrides required by Solidity --- //

    function state(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (ProposalState)
    {
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

    function proposalNeedsQueuing(uint256 proposalId)
        public
        view
        override(Governor, GovernorTimelockControl)
        returns (bool)
    {
        return super.proposalNeedsQueuing(proposalId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(Governor) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
