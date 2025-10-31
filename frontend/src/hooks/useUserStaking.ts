import { useReadContract } from 'wagmi';
import { useAccount } from 'wagmi';
import { stakingPoolAbi } from '@/lib/abis/stakingPool';
import { Address } from 'viem';

const stakingPoolAddress = import.meta.env.VITE_STAKING_POOL_ADDRESS as Address;

/**
 * Custom hook to fetch a user's staking position directly from the blockchain.
 */
export const useUserStaking = () => {
  const { address, isConnected } = useAccount();

  const { data: stakedAmount, isLoading, error, refetch } = useReadContract({
    abi: stakingPoolAbi,
    address: stakingPoolAddress,
    functionName: 'staked',
    args: [address!],
    query: {
      enabled: isConnected && !!address,
      refetchInterval: 30000, // Refetches every 30 seconds
    },
  });

  return {
    stakedAmount,
    isLoading,
    error,
    refetchUserStakedAmount: refetch,
  };
};
