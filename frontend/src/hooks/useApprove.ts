import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { erc20Abi } from '@/lib/abis/erc20';
import { Address, parseEther } from 'viem';

export const useApprove = () => {
  const { data: hash, isPending, writeContract, isError, error } = useWriteContract();

  const approve = (tokenAddress: Address, spender: Address, amount: string) => {
    try {
      const amountInWei = parseEther(amount);
      writeContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'approve',
        args: [spender, amountInWei],
      });
    } catch (e) {
        console.error("Invalid amount for approve", e)
    }
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash, 
    });

  return {
    approve,
    isPending,
    isConfirming,
    isConfirmed,
    isError,
    error,
    hash,
  };
};
