# Staking and Revenue Sharing Mechanism

Status: Implemented

## 1. Introduction

This document details the staking mechanism for the SCC-GOV token and the revenue sharing process of the SCC protocol. The goal is to incentivize participation in governance and align the interests of SCC-GOV holders with the success of the protocol.

## 2. Fundamental Concepts

- **Staking Token:** SCC-GOV
- **Reward Token:** SCC-USD (from stability fees and other protocol revenues)
- **Staker:** User who deposits SCC-GOV into the Staking Pool.

## 3. Staking Logic

### 3.1. Deposit (Stake)

Users will be able to deposit their SCC-GOV tokens into the `StakingPool` contract. By doing so, they will begin to accumulate voting power and eligibility for rewards.

### 3.2. Withdrawal (Unstake)

Users will be able to withdraw their SCC-GOV tokens from the `StakingPool` contract. This will end the accumulation of new rewards and remove their voting power.

## 4. Rewards and Revenue Sharing Logic

### 4.1. Reward Deposit

The `StakingPool` contract will receive deposits of `SCC-USD` (from the protocol's stability fees) from an authorized entity (e.g., the `TimelockController` via governance).

### 4.2. Reward Calculation

Rewards will be calculated based on the amount of SCC-GOV staked and the time the tokens have remained in the pool. A reward accumulator pattern will be used to ensure a fair and efficient distribution.

### 4.3. Reward Redemption (Claim)

Stakers will be able to redeem their accumulated `SCC-USD` rewards at any time, without affecting their SCC-GOV stake.

## 5. Governance and Parameters

The `StakingPool` contract will be owned by the `TimelockController`, allowing the protocol's governance (SCC-GOV holders) to manage and update critical parameters, such as the authorized address for depositing rewards or any other time/rate parameters that may be introduced.

---

## 6. Design Flaw: Fixed Reward Period

**Status:** Fixed

-   **Contract:** `StakingPool.sol`
-   **Function:** `notifyRewardAmount(uint256 reward)`
-   **Problem Description:** The `rewardRate` calculation logic is hardcoded to assume that each reward deposit will be distributed over `7 days`. This makes the system inflexible.
-   **Impact:** **Low.** This is not a security vulnerability, but a design rigidity. If governance wishes to distribute a reward amount over a different period (e.g., a 24-hour bonus or a 30-day campaign), the distribution rate will be calculated incorrectly, unintentionally accelerating or delaying the distribution.
-   **Required Action (Improvement):**
    1.  Modify the function signature to `notifyRewardAmount(uint256 reward, uint256 duration)`.
    2.  Replace the hardcoded `7 days` value with the provided `duration` variable, allowing governance to set the correct distribution rate for each reward deposit.