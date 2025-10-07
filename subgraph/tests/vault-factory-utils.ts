import { newMockEvent } from "matchstick-as"
import { ethereum, Address } from "@graphprotocol/graph-ts"
import { VaultCreated } from "../generated/VaultFactory/VaultFactory"

export function createVaultCreatedEvent(
  vaultAddress: Address,
  owner: Address
): VaultCreated {
  let vaultCreatedEvent = changetype<VaultCreated>(newMockEvent())

  vaultCreatedEvent.parameters = new Array()

  vaultCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "vaultAddress",
      ethereum.Value.fromAddress(vaultAddress)
    )
  )
  vaultCreatedEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )

  return vaultCreatedEvent
}
