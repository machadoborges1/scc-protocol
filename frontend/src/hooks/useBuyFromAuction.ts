import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { liquidationManagerAbi } from '@/lib/abis/liquidationManager';
import { Address, parseEther } from 'viem';

const liquidationManagerAddress = import.meta.env.VITE_LIQUIDATION_MANAGER_ADDRESS as Address;

export const useBuyFromAuction = () => {
  const { data: hash, isPending, writeContract, isError, error } = useWriteContract();

  const buyFromAuction = (auctionId: string, amount: string) => {
    if (!amount || parseFloat(amount) <= 0 || !auctionId) {
      console.error("Invalid amount or auction ID");
      return;
    }
    writeContract({
      address: liquidationManagerAddress,
      abi: liquidationManagerAbi,
      functionName: 'buy',
      // The contract expects the auctionId as a BigInt and the amount in wei
      args: [BigInt(auctionId), parseEther(amount)],
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash, 
    });

  return {
    buyFromAuction,
    isPending,
    isConfirming,
    isConfirmed,
    isError,
    error,
    hash,
  };
};