// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IGovernor} from "@openzeppelin/contracts/governance/IGovernor.sol";

import "src/tokens/SCC_GOV.sol";
import "src/SCC_Governor.sol";

// A simple contract to be the target of a governance proposal
contract TargetContract is Ownable {
    uint256 public x;

    constructor(address initialOwner) Ownable(initialOwner) {}

    function setValue(uint256 _x) public onlyOwner {
        x = _x;
    }
}

/**
 * @dev Test suite for the SCC_Governor contract.
 */
contract GovernorTest is Test {
    SCC_GOV public govToken;
    TimelockController public timelock;
    SCC_Governor public governor;
    TargetContract public target;

    address public voter1 = makeAddr("voter1"); // 100k votes
    address public voter2 = makeAddr("voter2"); // 50k votes
    address public proposer = makeAddr("proposer"); // 1k votes

    uint256 public constant INITIAL_SUPPLY = 1_000_000e18;
    uint256 public proposalId;

    /**
     * @notice Sets up the testing environment before each test.
     */
    function setUp() public {
        // --- Deploy Governance Contracts ---
        govToken = new SCC_GOV(address(this), INITIAL_SUPPLY);
        timelock = new TimelockController(2 days, new address[](0), new address[](0), address(this));
        governor = new SCC_Governor(IVotes(address(govToken)), timelock);
        target = new TargetContract(address(this));

        // --- Configure Timelock Roles ---
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
        timelock.grantRole(timelock.EXECUTOR_ROLE(), address(0)); // Anyone can execute
        timelock.renounceRole(keccak256("TIMELOCK_ADMIN_ROLE"), address(this));

        // --- Transfer Ownership of Target to Timelock ---
        target.transferOwnership(address(timelock));

        // --- Distribute and Delegate Tokens ---
        govToken.transfer(voter1, 100_000e18);
        govToken.transfer(voter2, 50_000e18);
        govToken.transfer(proposer, 1_000e18);

        vm.startPrank(voter1);
        govToken.delegate(voter1);
        vm.stopPrank();

        vm.startPrank(voter2);
        govToken.delegate(voter2);
        vm.stopPrank();

        vm.startPrank(proposer);
        govToken.delegate(proposer);
        vm.stopPrank();
    }

    // --- Helper function to create a standard proposal ---
    /**
     * @notice Helper function to create a standard governance proposal.
     */
    function _createProposal()
        internal
        returns (address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash)
    {
        uint256 newValue = 777;
        string memory description = "Set target value to 777";
        descriptionHash = keccak256(bytes(description));

        targets = new address[](1);
        targets[0] = address(target);

        values = new uint256[](1);

        calldatas = new bytes[](1);
        calldatas[0] = abi.encodeWithSignature("setValue(uint256)", newValue);

        vm.prank(proposer);
        proposalId = governor.propose(targets, values, calldatas, description);
    }

    // --- Test Scenarios --- //

    /**
     * @notice Tests the full governance lifecycle, from proposal creation to execution, ensuring success.
     */
    function test_Full_Governance_Lifecycle_Succeeds() public {
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash) =
            _createProposal();

        // --- 2. Vote ---
        vm.warp(block.timestamp + governor.votingDelay() + 1);
        vm.roll(block.number + governor.votingDelay() + 1);

        vm.prank(voter1); // 100k votes
        governor.castVote(proposalId, 1); // For

        vm.prank(voter2); // 50k votes
        governor.castVote(proposalId, 0); // Against

        vm.warp(block.timestamp + governor.votingPeriod() + 1);
        vm.roll(block.number + governor.votingPeriod() + 1);

        // --- 3. Check State: Succeeded ---
        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Succeeded));

        // --- 4. Queue & 5. Execute ---
        governor.queue(targets, values, calldatas, descriptionHash);
        vm.warp(block.timestamp + timelock.getMinDelay() + 1);
        governor.execute(targets, values, calldatas, descriptionHash);

        // --- 6. Verify Result ---
        assertEq(target.x(), 777);
    }

    /**
     * @notice Tests that a proposal is defeated if it receives more 'against' votes than 'for' votes.
     */
    function test_Fail_Proposal_Is_Defeated_By_Votes() public {
        _createProposal();

        vm.warp(block.timestamp + governor.votingDelay() + 1);
        vm.roll(block.number + governor.votingDelay() + 1);

        vm.prank(voter1); // 100k votes
        governor.castVote(proposalId, 0); // Against

        vm.prank(voter2); // 50k votes
        governor.castVote(proposalId, 1); // For

        vm.warp(block.timestamp + governor.votingPeriod() + 1);
        vm.roll(block.number + governor.votingPeriod() + 1);

        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Defeated));
    }

    /**
     * @notice Tests that a proposal is defeated if it does not meet the minimum quorum requirement.
     */
    function test_Fail_Proposal_Is_Defeated_By_Quorum() public {
        _createProposal();

        vm.warp(block.timestamp + governor.votingDelay() + 1);
        vm.roll(block.number + governor.votingDelay() + 1);

        // Only proposer votes (1k votes), which is less than 4% quorum (40k)
        vm.prank(proposer);
        governor.castVote(proposalId, 1); // For

        vm.warp(block.timestamp + governor.votingPeriod() + 1);
        vm.roll(block.number + governor.votingPeriod() + 1);

        assertEq(uint256(governor.state(proposalId)), uint256(IGovernor.ProposalState.Defeated));
    }

    /**
     * @notice Tests that voting on a proposal fails if the voting period has not started or has ended.
     */
    function test_Fail_Cannot_Vote_When_Inactive() public {
        _createProposal();

        // Note: We do NOT wait for the voting delay

        vm.prank(voter1);
        vm.expectRevert();
        governor.castVote(proposalId, 1);
    }

    /**
     * @notice Tests that a proposal cannot be executed before the timelock delay has passed.
     */
    function test_Fail_Cannot_Execute_Before_Delay() public {
        (address[] memory targets, uint256[] memory values, bytes[] memory calldatas, bytes32 descriptionHash) =
            _createProposal();

        // Vote and succeed
        vm.warp(block.timestamp + governor.votingDelay() + 1);
        vm.roll(block.number + governor.votingDelay() + 1);
        vm.prank(voter1);
        governor.castVote(proposalId, 1);
        vm.warp(block.timestamp + governor.votingPeriod() + 1);
        vm.roll(block.number + governor.votingPeriod() + 1);

        // Queue
        governor.queue(targets, values, calldatas, descriptionHash);

        // Try to execute immediately
        vm.expectRevert();
        governor.execute(targets, values, calldatas, descriptionHash);
    }
}
