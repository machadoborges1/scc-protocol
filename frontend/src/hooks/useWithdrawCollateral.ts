import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { vaultAbi } from '@/lib/abis/vault';
import { Address, parseEther } from 'viem';

export const useWithdrawCollateral = () => {
  const { data: hash, isPending, writeContract, isError, error } = useWriteContract();

  const withdrawCollateral = (vaultAddress: Address, amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      console.error("Invalid amount for withdrawal");
      return;
    }
    writeContract({
      address: vaultAddress,
      abi: vaultAbi,
      functionName: 'withdrawCollateral',
      args: [parseEther(amount)],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash, 
    });

  return {
    withdrawCollateral,
    isPending,
    isConfirming,
    isConfirmed,
    isError,
    error,
    hash,
  };
};