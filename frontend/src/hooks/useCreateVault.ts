import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { vaultFactoryAbi } from '@/lib/abis/vaultFactory';
import { Address } from 'viem';

const vaultFactoryAddress = import.meta.env.VITE_VAULT_FACTORY_ADDRESS as Address;

export const useCreateVault = () => {
  const { data: hash, isPending, writeContract } = useWriteContract();

  const createVault = () => {
    writeContract({
      address: vaultFactoryAddress,
      abi: vaultFactoryAbi,
      functionName: 'createNewVault',
    });
  };

  const { isLoading: isConfirming, isSuccess: isConfirmed } = 
    useWaitForTransactionReceipt({ 
      hash, 
    });

  return {
    createVault,
    isPending,      // True when the user is confirming in their wallet
    isConfirming,   // True when the transaction is sent and waiting for confirmation
    isConfirmed,    // True when the transaction is confirmed
    hash,
  };
};