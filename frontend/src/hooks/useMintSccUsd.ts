import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { vaultAbi } from '@/lib/abis/vault';
import { Address, parseEther } from 'viem';

export const useMintSccUsd = () => {
  const { data: hash, isPending, writeContract, isError, error } = useWriteContract();

  const mintSccUsd = (vaultAddress: Address, amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      console.error("Invalid amount for minting");
      return;
    }
    writeContract({
      address: vaultAddress,
      abi: vaultAbi,
      functionName: 'mint',
      args: [parseEther(amount)],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash, 
    });

  return {
    mintSccUsd,
    isPending,
    isConfirming,
    isConfirmed,
    isError,
    error,
    hash,
  };
};