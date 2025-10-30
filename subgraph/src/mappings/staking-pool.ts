import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import {
  Staked,
  Unstaked,
  RewardPaid,
  StakingPool,
} from "../../generated/StakingPool/StakingPool";
import { StakingPosition, User, RewardEvent, Protocol } from "../../generated/schema";

const PROTOCOL_ID = "scc-protocol";

// Função auxiliar para converter BigInt para BigDecimal com 18 decimais
function toBigDecimal18(value: BigInt): BigDecimal {
  return value.toBigDecimal().div(BigInt.fromI32(10).pow(18).toBigDecimal());
}

export function handleStaked(event: Staked): void {
  let protocol = Protocol.load(PROTOCOL_ID);
  if (protocol == null) {
    protocol = new Protocol(PROTOCOL_ID);
    protocol.totalVaults = BigInt.fromI32(0);
    protocol.totalCollateralValueUSD = BigDecimal.fromString("0");
    protocol.totalDebtUSD = BigDecimal.fromString("0");
    protocol.activeAuctions = BigInt.fromI32(0);
    protocol.totalStakedGOV = BigDecimal.fromString("0");
  }

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
    const stakingPoolContract = StakingPool.bind(event.address);
    position.stakingToken = stakingPoolContract.stakingToken().toHexString();
    position.amountStaked = BigDecimal.fromString("0");
    position.rewardsClaimed = BigDecimal.fromString("0");
    position.createdAtTimestamp = event.block.timestamp;
  }

  const stakedAmount = toBigDecimal18(event.params.amount);
  position.amountStaked = position.amountStaked.plus(stakedAmount);
  position.lastUpdatedAtTimestamp = event.block.timestamp;
  position.save();

  // Atualiza o total de staked GOV no protocolo
  protocol.totalStakedGOV = protocol.totalStakedGOV.plus(stakedAmount);
  protocol.save();
}

export function handleUnstaked(event: Unstaked): void {
  const stakerId = event.params.user.toHexString();
  let position = StakingPosition.load(stakerId);
  if (position) {
    const unstakedAmount = toBigDecimal18(event.params.amount);
    position.amountStaked = position.amountStaked.minus(unstakedAmount);
    position.lastUpdatedAtTimestamp = event.block.timestamp;
    position.save();

    // Atualiza o total de staked GOV no protocolo
    let protocol = Protocol.load(PROTOCOL_ID);
    if (protocol) {
      protocol.totalStakedGOV = protocol.totalStakedGOV.minus(unstakedAmount);
      protocol.save();
    }
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
