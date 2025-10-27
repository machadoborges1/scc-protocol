import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { stakingPoolAbi } from '@/lib/abis/stakingPool';
import { Address, parseEther } from 'viem';

const stakingPoolAddress = import.meta.env.VITE_STAKING_POOL_ADDRESS as Address;

export const useUnstake = () => {
  const { data: hash, isPending, writeContract, isError, error } = useWriteContract();

  const unstake = (amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      console.error("Invalid amount for unstaking");
      return;
    }
    writeContract({
      address: stakingPoolAddress,
      abi: stakingPoolAbi,
      functionName: 'unstake',
      args: [parseEther(amount)],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash, 
    });

  return {
    unstake,
    isPending,
    isConfirming,
    isConfirmed,
    isError,
    error,
    hash,
  };
};