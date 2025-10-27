import { useReadContract } from 'wagmi';
import { stakingPoolAbi } from '@/lib/abis/stakingPool';
import { Address, erc20Abi } from 'viem';

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

  const { data: totalStaked, refetch: refetchTotalStaked } = useReadContract({
    abi: erc20Abi,
    address: stakingTokenAddress,
    functionName: 'balanceOf',
    args: [stakingPoolAddress],
    query: {
      enabled: !!stakingTokenAddress && !!stakingPoolAddress,
    }
  });

  return {
    rewardRate,
    periodFinish,
    lastUpdateTime,
    stakingTokenAddress,
    totalStaked,
    refetchTotalStaked,
  };
};
