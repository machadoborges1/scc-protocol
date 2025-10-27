import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { stakingPoolAbi } from '@/lib/abis/stakingPool';
import { Address, parseEther } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

const stakingPoolAddress = import.meta.env.VITE_STAKING_POOL_ADDRESS as Address;

export const useStake = () => {
  const queryClient = useQueryClient();
  const { data: hash, isPending, writeContract, isError, error } = useWriteContract();

  const stake = (amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      console.error("Invalid amount for staking");
      return;
    }
    writeContract({
      address: stakingPoolAddress,
      abi: stakingPoolAbi,
      functionName: 'stake',
      args: [parseEther(amount)],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash, 
    });

  useEffect(() => {
    if (isConfirmed) {
      // Invalidate all queries to refetch fresh data from the blockchain
      queryClient.invalidateQueries();
    }
  }, [isConfirmed, queryClient]);

  return {
    stake,
    isPending,
    isConfirming,
    isConfirmed,
    isError,
    error,
    hash,
  };
};