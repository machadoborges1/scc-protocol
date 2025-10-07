import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt } from "@graphprotocol/graph-ts"
import {
  Staked,
  Unstaked,
  RewardPaid
} from "../generated/StakingPool/StakingPool"

export function createStakedEvent(user: Address, amount: BigInt): Staked {
  let event = changetype<Staked>(newMockEvent())
  event.parameters = new Array()

  event.parameters.push(new ethereum.EventParam("user", ethereum.Value.fromAddress(user)))
  event.parameters.push(new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount)))

  return event
}

export function createUnstakedEvent(user: Address, amount: BigInt): Unstaked {
  let event = changetype<Unstaked>(newMockEvent())
  event.parameters = new Array()

  event.parameters.push(new ethereum.EventParam("user", ethereum.Value.fromAddress(user)))
  event.parameters.push(new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount)))

  return event
}

export function createRewardPaidEvent(user: Address, reward: BigInt): RewardPaid {
  let event = changetype<RewardPaid>(newMockEvent())
  event.parameters = new Array()

  event.parameters.push(new ethereum.EventParam("user", ethereum.Value.fromAddress(user)))
  event.parameters.push(new ethereum.EventParam("reward", ethereum.Value.fromUnsignedBigInt(reward)))

  return event
}
