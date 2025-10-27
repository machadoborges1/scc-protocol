import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { sccGovernorAbi } from '@/lib/abis/sccGovernor';
import { Address } from 'viem';

const sccGovernorAddress = import.meta.env.VITE_SCC_GOVERNOR_ADDRESS as Address;

// For, Against, Abstain
export type VoteOption = 0 | 1 | 2;

export const useCastVote = () => {
  const { data: hash, isPending, writeContract, isError, error } = useWriteContract();

  const castVote = (proposalId: string, support: VoteOption) => {
    writeContract({
      address: sccGovernorAddress,
      abi: sccGovernorAbi,
      functionName: 'castVote',
      args: [BigInt(proposalId), support],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash, 
    });

  return {
    castVote,
    isPending,
    isConfirming,
    isConfirmed,
    isError,
    error,
    hash,
  };
};