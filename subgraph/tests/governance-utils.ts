import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  ProposalCreated,
  VoteCast,
  ProposalCanceled,
  ProposalExecuted
} from "../generated/SCC_Governor/SCC_Governor"

export function createProposalCreatedEvent(
  proposalId: BigInt,
  proposer: Address,
  targets: Address[],
  values: BigInt[],
  signatures: string[],
  calldatas: Bytes[],
  startBlock: BigInt,
  endBlock: BigInt,
  description: string
): ProposalCreated {
  let event = changetype<ProposalCreated>(newMockEvent())
  event.parameters = new Array()

  event.parameters.push(new ethereum.EventParam("proposalId", ethereum.Value.fromUnsignedBigInt(proposalId)))
  event.parameters.push(new ethereum.EventParam("proposer", ethereum.Value.fromAddress(proposer)))
  event.parameters.push(new ethereum.EventParam("targets", ethereum.Value.fromAddressArray(targets)))
  event.parameters.push(new ethereum.EventParam("values", ethereum.Value.fromUnsignedBigIntArray(values)))
  event.parameters.push(new ethereum.EventParam("signatures", ethereum.Value.fromStringArray(signatures)))
  event.parameters.push(new ethereum.EventParam("calldatas", ethereum.Value.fromBytesArray(calldatas)))
  event.parameters.push(new ethereum.EventParam("startBlock", ethereum.Value.fromUnsignedBigInt(startBlock)))
  event.parameters.push(new ethereum.EventParam("endBlock", ethereum.Value.fromUnsignedBigInt(endBlock)))
  event.parameters.push(new ethereum.EventParam("description", ethereum.Value.fromString(description)))

  return event
}

export function createVoteCastEvent(
  voter: Address,
  proposalId: BigInt,
  support: i32,
  weight: BigInt,
  reason: string
): VoteCast {
  let event = changetype<VoteCast>(newMockEvent())
  event.parameters = new Array()

  event.parameters.push(new ethereum.EventParam("voter", ethereum.Value.fromAddress(voter)))
  event.parameters.push(new ethereum.EventParam("proposalId", ethereum.Value.fromUnsignedBigInt(proposalId)))
  event.parameters.push(new ethereum.EventParam("support", ethereum.Value.fromI32(support)))
  event.parameters.push(new ethereum.EventParam("weight", ethereum.Value.fromUnsignedBigInt(weight)))
  event.parameters.push(new ethereum.EventParam("reason", ethereum.Value.fromString(reason)))

  return event
}

export function createProposalCanceledEvent(proposalId: BigInt): ProposalCanceled {
  let event = changetype<ProposalCanceled>(newMockEvent())
  event.parameters = new Array()
  event.parameters.push(new ethereum.EventParam("proposalId", ethereum.Value.fromUnsignedBigInt(proposalId)))
  return event
}

export function createProposalExecutedEvent(proposalId: BigInt): ProposalExecuted {
  let event = changetype<ProposalExecuted>(newMockEvent())
  event.parameters = new Array()
  event.parameters.push(new ethereum.EventParam("proposalId", ethereum.Value.fromUnsignedBigInt(proposalId)))
  return event
}
