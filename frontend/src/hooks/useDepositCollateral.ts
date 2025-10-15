import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { vaultAbi } from '@/lib/abis/vault';
import { Address, parseEther } from 'viem';

export const useDepositCollateral = () => {
  const { data: hash, isPending, writeContract, isError, error } = useWriteContract();

  const depositCollateral = (vaultAddress: Address, amount: string) => {
    try {
      const amountInWei = parseEther(amount);
      writeContract({
        address: vaultAddress,
        abi: vaultAbi,
        functionName: 'depositCollateral',
        args: [amountInWei],
      });
    } catch (e) {
      console.error("Invalid amount for deposit", e);
    }
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash, 
    });

  return {
    depositCollateral,
    isPending,
    isConfirming,
    isConfirmed,
    isError,
    error,
    hash,
  };
};
