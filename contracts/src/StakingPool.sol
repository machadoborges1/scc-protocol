// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StakingPool
 * @author Humberto
 * @notice This contract allows users to stake SCC_GOV tokens to earn rewards in SCC_USD.
 * It follows a reward distribution model based on the amount staked and time.
 * @custom:security-contact security@example.com
 * @custom:legacy The previous version of this contract did not include a flexible reward distribution mechanism.
 */
contract StakingPool is Ownable {
    /**
     * @notice The ERC20 token that users stake (e.g., SCC_GOV).
     */
    IERC20 public immutable stakingToken; // SCC_GOV
    /**
     * @notice The ERC20 token distributed as rewards (e.g., SCC_USD).
     */
    IERC20 public immutable rewardsToken; // SCC_USD

    /**
     * @notice Mapping from staker address to the amount of staking tokens they have staked.
     */
    mapping(address => uint256) public staked;

    /**
     * @notice Mapping from staker address to the reward index at the time of their last action (stake/claim).
     */
    mapping(address => uint256) public userRewardPerTokenPaid;

    /**
     * @notice Total rewards per token accumulated since the contract's inception.
     */
    uint256 public rewardPerTokenStored;

    /**
     * @notice The authorized address responsible for distributing rewards (e.g., Timelock/Governance).
     */
    address public rewardsDistribution;

    /**
     * @notice The rate at which rewards are distributed per second.
     */
    uint256 public rewardRate;
    /**
     * @notice The last time rewards were updated or a new reward period began.
     */
    uint256 public lastUpdateTime;
    /**
     * @notice The timestamp when the current reward period ends.
     */
    uint256 public periodFinish;

    // Events
    /**
     * @notice Emitted when a user stakes tokens.
     * @param user The address of the user who staked.
     * @param amount The amount of tokens staked.
     */
    event Staked(address indexed user, uint256 amount);
    /**
     * @notice Emitted when a user unstakes tokens.
     * @param user The address of the user who unstaked.
     * @param amount The amount of tokens unstaked.
     */
    event Unstaked(address indexed user, uint256 amount);
    /**
     * @notice Emitted when a user claims rewards.
     * @param user The address of the user who claimed rewards.
     * @param reward The amount of rewards paid.
     */
    event RewardPaid(address indexed user, uint256 reward);
    /**
     * @notice Emitted when new rewards are added to the pool.
     * @param reward The total amount of reward added.
     */
    event RewardAdded(uint256 reward);

    /**
     * @notice Initializes the StakingPool contract.
     * @param _stakingToken The address of the ERC20 token to be staked (e.g., SCC_GOV).
     * @param _rewardsToken The address of the ERC20 token to be distributed as rewards (e.g., SCC_USD).
     * @param _rewardsDistribution The address authorized to distribute rewards.
     * @param initialOwner The initial owner of the contract.
     */
    constructor(address _stakingToken, address _rewardsToken, address _rewardsDistribution, address initialOwner)
        Ownable(initialOwner)
    {
        stakingToken = IERC20(_stakingToken);
        rewardsToken = IERC20(_rewardsToken);
        rewardsDistribution = _rewardsDistribution;
    }

    /**
     * @notice Returns the timestamp of the last moment rewards were applicable.
     * @dev This is either the current block timestamp or the period finish time, whichever is earlier.
     * @return The timestamp of the last applicable reward time.
     */
    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

    /**
     * @notice Updates the reward per token stored and the last update time.
     * @dev This modifier is used before any action that changes a user's stake or claims rewards.
     * @param account The address of the user whose reward state is being updated.
     */
    modifier updateReward(address account) {
        rewardPerTokenStored = _rewardPerToken();
        lastUpdateTime = lastTimeRewardApplicable();
        // userRewardPerTokenPaid[account] will be updated after reward claim
        _;
    }

    function _rewardPerToken() internal view returns (uint256) {
        if (stakingToken.balanceOf(address(this)) == 0) {
            return rewardPerTokenStored;
        }
        return rewardPerTokenStored
            + (rewardRate * (lastTimeRewardApplicable() - lastUpdateTime) * 1e18) / stakingToken.balanceOf(address(this));
    }

    /**
     * @notice Calculates the amount of rewards an account has earned but not yet claimed.
     * @param account The address of the account to check.
     * @return The amount of rewards earned by the account.
     */
    function earned(address account) public view returns (uint256) {
        return (staked[account] * (_rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18;
    }

    /**
     * @notice Allows a user to stake `amount` of staking tokens.
     * @dev The staking tokens are transferred from the user to this contract.
     * Requires `amount` to be greater than 0.
     * @param amount The amount of staking tokens to stake.
     */
    function stake(uint256 amount) public updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        stakingToken.transferFrom(msg.sender, address(this), amount);
        staked[msg.sender] += amount;
        emit Staked(msg.sender, amount);
    }

    /**
     * @notice Allows a user to unstake `amount` of staking tokens.
     * @dev The staking tokens are transferred from this contract back to the user.
     * Requires `amount` to be greater than 0 and less than or equal to the staked amount.
     * @param amount The amount of staking tokens to unstake.
     */
    function unstake(uint256 amount) public updateReward(msg.sender) {
        require(amount > 0, "Cannot unstake 0");
        require(staked[msg.sender] >= amount, "Not enough staked");
        staked[msg.sender] -= amount;
        stakingToken.transfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    /**
     * @notice Allows a user to claim their earned rewards.
     * @dev Transfers the calculated earned rewards to the user.
     */
    function getReward() public updateReward(msg.sender) {
        uint256 reward = earned(msg.sender);
        if (reward > 0) {
            rewardsToken.transfer(msg.sender, reward);
            userRewardPerTokenPaid[msg.sender] = rewardPerTokenStored; // Update after claim
            emit RewardPaid(msg.sender, reward);
        }
    }

    /**
     * @notice Notifies the staking pool of a new reward amount to be distributed.
     * @dev Only the `rewardsDistribution` address can call this function.
     * Adjusts the `rewardRate` and `periodFinish` based on the new reward.
     * @param reward The amount of reward tokens to add to the pool.
     */
    function notifyRewardAmount(uint256 reward, uint256 duration) public updateReward(address(0)) {
        require(msg.sender == rewardsDistribution, "Caller is not rewardsDistribution");
        require(reward > 0, "Reward cannot be 0");
        require(duration > 0, "Duration cannot be 0");

        if (block.timestamp >= periodFinish) {
            rewardRate = reward / duration;
        } else {
            uint256 remaining = periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardRate;
            rewardRate = (reward + leftover) / duration;
        }
        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + duration;

        rewardsToken.transferFrom(msg.sender, address(this), reward);
        emit RewardAdded(reward);
    }

    // --- Governance Functions ---

    /**
     * @notice Sets the address of the rewards distributor.
     * @dev Can only be called by the owner (TimelockController).
     */
    function setRewardsDistribution(address _rewardsDistribution) public onlyOwner {
        rewardsDistribution = _rewardsDistribution;
    }
}
