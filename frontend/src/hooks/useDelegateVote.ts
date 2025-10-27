import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { sccGovAbi } from '@/lib/abis/sccGov';
import { Address } from 'viem';

const sccGovAddress = import.meta.env.VITE_SCC_GOV_ADDRESS as Address;

export const useDelegateVote = () => {
  const { data: hash, isPending, writeContract, isError, error } = useWriteContract();

  const delegate = (delegatee: Address) => {
    writeContract({
      address: sccGovAddress,
      abi: sccGovAbi,
      functionName: 'delegate',
      args: [delegatee],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash, 
    });

  return {
    delegate,
    isPending,
    isConfirming,
    isConfirmed,
    isError,
    error,
    hash,
  };
};