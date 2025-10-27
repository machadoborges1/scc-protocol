import { useReadContract } from 'wagmi';
import { useAccount } from 'wagmi';
import { stakingPoolAbi } from '@/lib/abis/stakingPool';
import { Address } from 'viem';

const stakingPoolAddress = import.meta.env.VITE_STAKING_POOL_ADDRESS as Address;

/**
 * Hook customizado para buscar a posição de staking de um usuário diretamente da blockchain.
 */
export const useUserStaking = () => {
  const { address, isConnected } = useAccount();

  const { data: stakedAmount, isLoading, error, refetch } = useReadContract({
    abi: stakingPoolAbi,
    address: stakingPoolAddress,
    functionName: 'staked',
    args: [address!],
    query: {
      enabled: isConnected && !!address,
      refetchInterval: 30000, // Refaz a cada 30 segundos
    },
  });

  return {
    stakedAmount,
    isLoading,
    error,
    refetchUserStakedAmount: refetch,
  };
};
