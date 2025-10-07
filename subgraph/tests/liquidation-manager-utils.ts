import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  AuctionStarted,
  AuctionBought,
  AuctionClosed
} from "../generated/LiquidationManager/LiquidationManager"

export function createAuctionStartedEvent(
  auctionId: BigInt,
  vaultAddress: Address,
  collateralAmount: BigInt,
  debtToCover: BigInt,
  startPrice: BigInt
): AuctionStarted {
  let event = changetype<AuctionStarted>(newMockEvent())
  event.parameters = new Array()

  event.parameters.push(new ethereum.EventParam("auctionId", ethereum.Value.fromUnsignedBigInt(auctionId)))
  event.parameters.push(new ethereum.EventParam("vaultAddress", ethereum.Value.fromAddress(vaultAddress)))
  event.parameters.push(new ethereum.EventParam("collateralAmount", ethereum.Value.fromUnsignedBigInt(collateralAmount)))
  event.parameters.push(new ethereum.EventParam("debtToCover", ethereum.Value.fromUnsignedBigInt(debtToCover)))
  event.parameters.push(new ethereum.EventParam("startPrice", ethereum.Value.fromUnsignedBigInt(startPrice)))

  return event
}

export function createAuctionBoughtEvent(
  auctionId: BigInt,
  buyer: Address,
  collateralBought: BigInt,
  debtPaid: BigInt
): AuctionBought {
  let event = changetype<AuctionBought>(newMockEvent())
  event.parameters = new Array()

  event.parameters.push(new ethereum.EventParam("auctionId", ethereum.Value.fromUnsignedBigInt(auctionId)))
  event.parameters.push(new ethereum.EventParam("buyer", ethereum.Value.fromAddress(buyer)))
  event.parameters.push(new ethereum.EventParam("collateralBought", ethereum.Value.fromUnsignedBigInt(collateralBought)))
  event.parameters.push(new ethereum.EventParam("debtPaid", ethereum.Value.fromUnsignedBigInt(debtPaid)))

  return event
}

export function createAuctionClosedEvent(auctionId: BigInt, vaultAddress: Address): AuctionClosed {
  let event = changetype<AuctionClosed>(newMockEvent())
  event.parameters = new Array()

  event.parameters.push(new ethereum.EventParam("auctionId", ethereum.Value.fromUnsignedBigInt(auctionId)))
  event.parameters.push(new ethereum.EventParam("vaultAddress", ethereum.Value.fromAddress(vaultAddress)))

  return event
}
