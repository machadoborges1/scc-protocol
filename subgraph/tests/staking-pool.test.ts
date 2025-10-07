import {
  assert,
  describe,
  test,
  clearStore,
  beforeEach,
  afterEach
} from "matchstick-as/assembly/index"
import { Address, BigInt, BigDecimal, Bytes } from "@graphprotocol/graph-ts"
import { User, StakingPosition, RewardEvent } from "../generated/schema"
import {
  handleStaked,
  handleUnstaked,
  handleRewardPaid
} from "../src/mappings/staking-pool"
import {
  createStakedEvent,
  createUnstakedEvent,
  createRewardPaidEvent
} from "./staking-pool-utils"

// Constants
const STAKER_ADDRESS = "0x1000000000000000000000000000000000000001"
const REWARDS_DISTRIBUTOR_ADDRESS = "0x2000000000000000000000000000000000000002"
const TOKEN_DECIMALS = 18

describe("StakingPool Handlers", () => {
  beforeEach(() => {
    // Create User for staker
    let user = new User(STAKER_ADDRESS)
    user.save()
  })

  afterEach(() => {
    clearStore()
  })

  test("should handle Staked event and create StakingPosition", () => {
    // 1. Data
    let amount = BigInt.fromI32(100).times(BigInt.fromI32(10).pow(TOKEN_DECIMALS as u8))

    // 2. Event
    let event = createStakedEvent(Address.fromString(STAKER_ADDRESS), amount)

    // 3. Handler
    handleStaked(event)

    // 4. Assertions
    const positionId = STAKER_ADDRESS
    assert.entityCount("StakingPosition", 1)
    assert.fieldEquals("StakingPosition", positionId, "user", STAKER_ADDRESS)
    assert.fieldEquals("StakingPosition", positionId, "amountStaked", "100")
    assert.fieldEquals("StakingPosition", positionId, "rewardsClaimed", "0")
  })

  test("should handle Staked event and update existing StakingPosition", () => {
    // Setup: Stake once
    let initialAmount = BigInt.fromI32(50).times(BigInt.fromI32(10).pow(TOKEN_DECIMALS as u8))
    handleStaked(createStakedEvent(Address.fromString(STAKER_ADDRESS), initialAmount))

    // 1. Data
    let additionalAmount = BigInt.fromI32(75).times(BigInt.fromI32(10).pow(TOKEN_DECIMALS as u8))

    // 2. Event
    let event = createStakedEvent(Address.fromString(STAKER_ADDRESS), additionalAmount)

    // 3. Handler
    handleStaked(event)

    // 4. Assertions
    const positionId = STAKER_ADDRESS
    assert.entityCount("StakingPosition", 1)
    assert.fieldEquals("StakingPosition", positionId, "amountStaked", "125") // 50 + 75
  })

  test("should handle Unstaked event and update StakingPosition", () => {
    // Setup: Stake first
    let initialAmount = BigInt.fromI32(150).times(BigInt.fromI32(10).pow(TOKEN_DECIMALS as u8))
    handleStaked(createStakedEvent(Address.fromString(STAKER_ADDRESS), initialAmount))

    // 1. Data
    let unstakeAmount = BigInt.fromI32(50).times(BigInt.fromI32(10).pow(TOKEN_DECIMALS as u8))

    // 2. Event
    let event = createUnstakedEvent(Address.fromString(STAKER_ADDRESS), unstakeAmount)

    // 3. Handler
    handleUnstaked(event)

    // 4. Assertions
    const positionId = STAKER_ADDRESS
    assert.entityCount("StakingPosition", 1)
    assert.fieldEquals("StakingPosition", positionId, "amountStaked", "100") // 150 - 50
  })

  test("should handle RewardPaid event and update StakingPosition and create RewardEvent", () => {
    // Setup: Stake first to create position
    let stakedAmount = BigInt.fromI32(100).times(BigInt.fromI32(10).pow(TOKEN_DECIMALS as u8))
    handleStaked(createStakedEvent(Address.fromString(STAKER_ADDRESS), stakedAmount))

    // 1. Data
    let rewardAmount = BigInt.fromI32(10).times(BigInt.fromI32(10).pow(TOKEN_DECIMALS as u8))

    // 2. Event
    let event = createRewardPaidEvent(Address.fromString(STAKER_ADDRESS), rewardAmount)
    event.transaction.hash = Bytes.fromHexString("0x0000000000000000000000000000000000000001")
    event.logIndex = BigInt.fromI32(1)
    event.block.timestamp = BigInt.fromI32(1000)

    // 3. Handler
    handleRewardPaid(event)

    // 4. Assertions
    const positionId = STAKER_ADDRESS
    assert.entityCount("StakingPosition", 1)
    assert.fieldEquals("StakingPosition", positionId, "rewardsClaimed", "10")

    const rewardEventId = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
    assert.entityCount("RewardEvent", 1)
    assert.fieldEquals("RewardEvent", rewardEventId, "stakingPosition", positionId)
    assert.fieldEquals("RewardEvent", rewardEventId, "amount", "10")
    assert.fieldEquals("RewardEvent", rewardEventId, "timestamp", "1000")
  })
})
