import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import {
  ProposalCreated,
  VoteCast,
  ProposalCanceled,
  ProposalExecuted
} from "../../generated/SCC_Governor/SCC_Governor";
import { GovernanceProposal, Vote, User } from "../../generated/schema";

// Helper function to map the support integer to the VoteSupport enum string
function getVoteSupport(support: i32): string {
  if (support == 0) {
    return "Against";
  } else if (support == 1) {
    return "For";
  } else {
    return "Abstain";
  }
}

export function handleProposalCreated(event: ProposalCreated): void {
  const proposalId = event.params.proposalId.toString();
  let proposal = new GovernanceProposal(proposalId);

  const proposerId = event.params.proposer.toHexString();
  let proposer = User.load(proposerId);
  if (proposer == null) {
    proposer = new User(proposerId);
    proposer.save();
  }

  proposal.proposer = proposer.id;
  proposal.targets = event.params.targets.map<Bytes>(t => t);
  proposal.values = event.params.values;
  proposal.calldatas = event.params.calldatas;
  proposal.description = event.params.description;
  proposal.createdAtTimestamp = event.block.timestamp;
  
  proposal.status = "Pending";
  proposal.forVotes = BigInt.fromI32(0);
  proposal.againstVotes = BigInt.fromI32(0);
  proposal.abstainVotes = BigInt.fromI32(0);

  proposal.save();
}

export function handleVoteCast(event: VoteCast): void {
  const proposalId = event.params.proposalId.toString();
  const voterId = event.params.voter.toHexString();

  let proposal = GovernanceProposal.load(proposalId);
  if (proposal == null) {
    // This should not happen if proposals are always created first
    return;
  }

  let voter = User.load(voterId);
  if (voter == null) {
    voter = new User(voterId);
    voter.save();
  }

  // Create the Vote entity
  const voteId = proposalId + "-" + voterId;
  let vote = new Vote(voteId);
  vote.proposal = proposal.id;
  vote.voter = voter.id;
  vote.weight = event.params.weight;
  vote.reason = event.params.reason;
  vote.support = getVoteSupport(event.params.support);
  vote.save();

  // Update proposal vote counts
  if (event.params.support == 0) { // Against
    proposal.againstVotes = proposal.againstVotes.plus(event.params.weight);
  } else if (event.params.support == 1) { // For
    proposal.forVotes = proposal.forVotes.plus(event.params.weight);
  } else if (event.params.support == 2) { // Abstain
    proposal.abstainVotes = proposal.abstainVotes.plus(event.params.weight);
  }
  proposal.save();
}

export function handleProposalCanceled(event: ProposalCanceled): void {
  const proposalId = event.params.proposalId.toString();
  let proposal = GovernanceProposal.load(proposalId);

  if (proposal) {
    proposal.status = "Canceled";
    proposal.canceledAtTimestamp = event.block.timestamp;
    proposal.save();
  }
}

export function handleProposalExecuted(event: ProposalExecuted): void {
  const proposalId = event.params.proposalId.toString();
  let proposal = GovernanceProposal.load(proposalId);

  if (proposal) {
    proposal.status = "Executed";
    proposal.executedAtTimestamp = event.block.timestamp;
    proposal.save();
  }
}
