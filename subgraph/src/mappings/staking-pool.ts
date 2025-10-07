import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import {
  Staked,
  Unstaked,
  RewardPaid,
} from "../../generated/StakingPool/StakingPool";
import { StakingPosition, User, RewardEvent } from "../../generated/schema";

// Função auxiliar para converter BigInt para BigDecimal com 18 decimais
function toBigDecimal18(value: BigInt): BigDecimal {
  return value.toBigDecimal().div(BigInt.fromI32(10).pow(18).toBigDecimal());
}

export function handleStaked(event: Staked): void {
  const stakerId = event.params.user.toHexString();
  let user = User.load(stakerId);
  if (user == null) {
    user = new User(stakerId);
    user.save();
  }

  let position = StakingPosition.load(stakerId);
  if (position == null) {
    position = new StakingPosition(stakerId);
    position.user = user.id;
    position.amountStaked = BigDecimal.fromString("0");
    position.rewardsClaimed = BigDecimal.fromString("0");
  }

  position.amountStaked = position.amountStaked.plus(toBigDecimal18(event.params.amount));
  position.save();
}

export function handleUnstaked(event: Unstaked): void {
  const stakerId = event.params.user.toHexString();
  let position = StakingPosition.load(stakerId);
  if (position) {
    position.amountStaked = position.amountStaked.minus(toBigDecimal18(event.params.amount));
    position.save();
  }
}

export function handleRewardPaid(event: RewardPaid): void {
  const stakerId = event.params.user.toHexString();
  let position = StakingPosition.load(stakerId);
  if (position) {
    const rewardAmount = toBigDecimal18(event.params.reward);
    position.rewardsClaimed = position.rewardsClaimed.plus(rewardAmount);
    position.save();

    // Create a reward event for historical tracking
    const eventId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString();
    let rewardEvent = new RewardEvent(eventId);
    rewardEvent.stakingPosition = position.id;
    rewardEvent.amount = rewardAmount;
    rewardEvent.timestamp = event.block.timestamp;
    rewardEvent.save();
  }
}
