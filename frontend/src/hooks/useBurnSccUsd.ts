import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { vaultAbi } from '@/lib/abis/vault';
import { Address, parseEther } from 'viem';

export const useBurnSccUsd = () => {
  const { data: hash, isPending, writeContract, isError, error } = useWriteContract();

  const burnSccUsd = (vaultAddress: Address, amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      console.error("Invalid amount for burning");
      return;
    }
    writeContract({
      address: vaultAddress,
      abi: vaultAbi,
      functionName: 'burn',
      args: [parseEther(amount)],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash, 
    });

  return {
    burnSccUsd,
    isPending,
    isConfirming,
    isConfirmed,
    isError,
    error,
    hash,
  };
};