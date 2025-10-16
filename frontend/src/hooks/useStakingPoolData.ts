import { useReadContract } from 'wagmi';
import { stakingPoolAbi } from '@/lib/abis/stakingPool';
import { Address } from 'viem';

const stakingPoolAddress = import.meta.env.VITE_STAKING_POOL_ADDRESS as Address;

export const useStakingPoolData = () => {
  const { data: rewardRate } = useReadContract({
    abi: stakingPoolAbi,
    address: stakingPoolAddress,
    functionName: 'rewardRate',
  });

  const { data: periodFinish } = useReadContract({
    abi: stakingPoolAbi,
    address: stakingPoolAddress,
    functionName: 'periodFinish',
  });

  const { data: lastUpdateTime } = useReadContract({
    abi: stakingPoolAbi,
    address: stakingPoolAddress,
    functionName: 'lastUpdateTime',
  });

  const { data: stakingTokenAddress } = useReadContract({
    abi: stakingPoolAbi,
    address: stakingPoolAddress,
    functionName: 'stakingToken',
  });

  // TODO: Fetch total staked amount (stakingToken.balanceOf(stakingPoolAddress))

  return {
    rewardRate,
    periodFinish,
    lastUpdateTime,
    stakingTokenAddress,
  };
};
