import {
  assert,
  describe,
  test,
  clearStore,
  beforeEach,
  afterEach
} from "matchstick-as/assembly/index"
import { Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import { User, GovernanceProposal, Vote } from "../generated/schema"
import {
  handleProposalCreated,
  handleVoteCast,
  handleProposalCanceled,
  handleProposalExecuted
} from "../src/mappings/governance"
import {
  createProposalCreatedEvent,
  createVoteCastEvent,
  createProposalCanceledEvent,
  createProposalExecutedEvent
} from "./governance-utils"

// Constants
const PROPOSER_ADDRESS = "0x1000000000000000000000000000000000000001"
const VOTER_ADDRESS = "0x2000000000000000000000000000000000000002"
const PROPOSAL_ID = BigInt.fromI32(1)

describe("Governance Handlers", () => {
  afterEach(() => {
    clearStore()
  })

  test("should handle ProposalCreated", () => {
    // 1. Data
    let targets: Address[] = [Address.fromString("0x3000000000000000000000000000000000000003")]
    let values: BigInt[] = [BigInt.fromI32(0)]
    let signatures: string[] = [""]
    let calldatas: Bytes[] = [Bytes.fromHexString("0x")]
    let description = "Test Proposal"

    // 2. Event
    let event = createProposalCreatedEvent(
      PROPOSAL_ID,
      Address.fromString(PROPOSER_ADDRESS),
      targets,
      values,
      signatures,
      calldatas,
      BigInt.fromI32(100),
      BigInt.fromI32(200),
      description
    )

    // 3. Handler
    handleProposalCreated(event)

    // 4. Assertions
    const proposalEntityId = PROPOSAL_ID.toString()
    assert.entityCount("GovernanceProposal", 1)
    assert.entityCount("User", 1)
    assert.fieldEquals("GovernanceProposal", proposalEntityId, "proposer", PROPOSER_ADDRESS)
    assert.fieldEquals("GovernanceProposal", proposalEntityId, "description", description)
    assert.fieldEquals("GovernanceProposal", proposalEntityId, "status", "Pending")
    assert.fieldEquals("GovernanceProposal", proposalEntityId, "forVotes", "0")
  })

  test("should handle VoteCast", () => {
    // Setup: Create a proposal first
    handleProposalCreated(createProposalCreatedEvent(PROPOSAL_ID, Address.fromString(PROPOSER_ADDRESS), [], [], [], [], BigInt.fromI32(100), BigInt.fromI32(200), "Test"))

    // 1. Data
    let weight = BigInt.fromI32(100).times(BigInt.fromI32(10).pow(18))
    let reason = "I support this"
    let support = 1 // For

    // 2. Event
    let event = createVoteCastEvent(Address.fromString(VOTER_ADDRESS), PROPOSAL_ID, support, weight, reason)

    // 3. Handler
    handleVoteCast(event)

    // 4. Assertions
    const proposalEntityId = PROPOSAL_ID.toString()
    const voteId = proposalEntityId + "-" + VOTER_ADDRESS
    assert.entityCount("Vote", 1)
    assert.entityCount("User", 2) // Proposer + Voter
    assert.fieldEquals("Vote", voteId, "voter", VOTER_ADDRESS)
    assert.fieldEquals("Vote", voteId, "proposal", proposalEntityId)
    assert.fieldEquals("Vote", voteId, "support", "For")
    assert.fieldEquals("Vote", voteId, "weight", weight.toString())
    
    assert.fieldEquals("GovernanceProposal", proposalEntityId, "forVotes", weight.toString())
  })

  test("should handle ProposalCanceled", () => {
    // Setup: Create a proposal first
    handleProposalCreated(createProposalCreatedEvent(PROPOSAL_ID, Address.fromString(PROPOSER_ADDRESS), [], [], [], [], BigInt.fromI32(100), BigInt.fromI32(200), "Test"))

    // 2. Event
    let event = createProposalCanceledEvent(PROPOSAL_ID)
    event.block.timestamp = BigInt.fromI32(150)

    // 3. Handler
    handleProposalCanceled(event)

    // 4. Assertions
    const proposalEntityId = PROPOSAL_ID.toString()
    assert.fieldEquals("GovernanceProposal", proposalEntityId, "status", "Canceled")
    assert.fieldEquals("GovernanceProposal", proposalEntityId, "canceledAtTimestamp", "150")
  })

  test("should handle ProposalExecuted", () => {
    // Setup: Create a proposal first
    handleProposalCreated(createProposalCreatedEvent(PROPOSAL_ID, Address.fromString(PROPOSER_ADDRESS), [], [], [], [], BigInt.fromI32(100), BigInt.fromI32(200), "Test"))

    // 2. Event
    let event = createProposalExecutedEvent(PROPOSAL_ID)
    event.block.timestamp = BigInt.fromI32(250)

    // 3. Handler
    handleProposalExecuted(event)

    // 4. Assertions
    const proposalEntityId = PROPOSAL_ID.toString()
    assert.fieldEquals("GovernanceProposal", proposalEntityId, "status", "Executed")
    assert.fieldEquals("GovernanceProposal", proposalEntityId, "executedAtTimestamp", "250")
  })
})
