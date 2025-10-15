import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { wethAbi } from '@/lib/abis/weth';
import { Address, parseEther } from 'viem';

const wethAddress = import.meta.env.VITE_WETH_ADDRESS as Address;

export const useApprove = () => {
  const { data: hash, isPending, writeContract, isError, error } = useWriteContract();

  const approve = (spender: Address, amount: string) => {
    try {
      const amountInWei = parseEther(amount);
      writeContract({
        address: wethAddress,
        abi: wethAbi,
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
