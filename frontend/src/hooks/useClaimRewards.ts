import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { stakingPoolAbi } from '@/lib/abis/stakingPool';
import { Address } from 'viem';

const stakingPoolAddress = import.meta.env.VITE_STAKING_POOL_ADDRESS as Address;

export const useClaimRewards = () => {
  const { data: hash, isPending, writeContract, isError, error } = useWriteContract();

  const claim = () => {
    writeContract({
      address: stakingPoolAddress,
      abi: stakingPoolAbi,
      functionName: 'getReward',
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash, 
    });

  return {
    claim,
    isPending,
    isConfirming,
    isConfirmed,
    isError,
    error,
    hash,
  };
};