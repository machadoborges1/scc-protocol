// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title StakingPool
 * @author Humberto
 * @notice This contract allows users to stake SCC_GOV tokens to earn rewards in SCC_USD.
 * It follows a reward distribution model based on the amount staked and time.
 */
contract StakingPool is Ownable {
    IERC20 public immutable stakingToken; // SCC_GOV
    IERC20 public immutable rewardsToken; // SCC_USD

    // Mapping from staker to staked amount
    mapping(address => uint256) public staked;

    // Mapping from staker to the reward index at the time of their last action (stake/claim)
    mapping(address => uint256) public userRewardPerTokenPaid;

    // Total rewards per token accumulated
    uint256 public rewardPerTokenStored;

    // Authorized address to distribute rewards (e.g., Timelock/Governance)
    address public rewardsDistribution;

    uint256 public rewardRate;
    uint256 public lastUpdateTime;
    uint256 public periodFinish;

    // Events
    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardAdded(uint256 reward);

    constructor(address _stakingToken, address _rewardsToken, address _rewardsDistribution, address initialOwner)
        Ownable(initialOwner)
    {
        stakingToken = IERC20(_stakingToken);
        rewardsToken = IERC20(_rewardsToken);
        rewardsDistribution = _rewardsDistribution;
    }

    function lastTimeRewardApplicable() public view returns (uint256) {
        return block.timestamp < periodFinish ? block.timestamp : periodFinish;
    }

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

    function earned(address account) public view returns (uint256) {
        return (staked[account] * (_rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18;
    }

    function stake(uint256 amount) public updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        stakingToken.transferFrom(msg.sender, address(this), amount);
        staked[msg.sender] += amount;
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) public updateReward(msg.sender) {
        require(amount > 0, "Cannot unstake 0");
        require(staked[msg.sender] >= amount, "Not enough staked");
        staked[msg.sender] -= amount;
        stakingToken.transfer(msg.sender, amount);
        emit Unstaked(msg.sender, amount);
    }

    function getReward() public updateReward(msg.sender) {
        uint256 reward = earned(msg.sender);
        if (reward > 0) {
            rewardsToken.transfer(msg.sender, reward);
            userRewardPerTokenPaid[msg.sender] = rewardPerTokenStored; // Update after claim
            emit RewardPaid(msg.sender, reward);
        }
    }

    function notifyRewardAmount(uint256 reward) public updateReward(address(0)) {
        require(msg.sender == rewardsDistribution, "Caller is not rewardsDistribution");
        require(reward > 0, "Reward cannot be 0");

        if (block.timestamp >= periodFinish) {
            rewardRate = reward / 7 days; // Assuming a 7-day reward period for now
        } else {
            uint256 remaining = periodFinish - block.timestamp;
            uint256 leftover = remaining * rewardRate;
            rewardRate = (reward + leftover) / 7 days; // Adjust for remaining period
        }
        lastUpdateTime = block.timestamp;
        periodFinish = block.timestamp + 7 days; // Assuming a 7-day reward period

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
