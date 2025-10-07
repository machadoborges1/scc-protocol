import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  CollateralDeposited,
  CollateralWithdrawn,
  SccUsdMinted,
  SccUsdBurned
} from "../generated/templates/Vault/Vault"

export function createCollateralDepositedEvent(amount: BigInt): CollateralDeposited {
  let event = changetype<CollateralDeposited>(newMockEvent())
  event.parameters = new Array()
  event.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  return event
}

export function createCollateralWithdrawnEvent(amount: BigInt): CollateralWithdrawn {
  let event = changetype<CollateralWithdrawn>(newMockEvent())
  event.parameters = new Array()
  event.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  return event
}

export function createSccUsdMintedEvent(amount: BigInt): SccUsdMinted {
  let event = changetype<SccUsdMinted>(newMockEvent())
  event.parameters = new Array()
  event.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  return event
}

export function createSccUsdBurnedEvent(amount: BigInt): SccUsdBurned {
  let event = changetype<SccUsdBurned>(newMockEvent())
  event.parameters = new Array()
  event.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )
  return event
}
