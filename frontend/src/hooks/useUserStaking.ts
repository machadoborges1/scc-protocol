import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { subgraphQuery } from "@/services/subgraph";

// Define a estrutura da posição de staking de um usuário
export interface StakingPosition {
  id: string;
  amountStaked: string;
  rewardsClaimed: string;
}

// Define a estrutura dos dados do protocolo relevantes para staking
export interface StakingProtocolData {
  totalStakedGOV: string;
}

// Define a estrutura da resposta completa da query
interface UserStakingData {
  user?: {
    stakingPosition: StakingPosition;
  };
  protocol?: StakingProtocolData;
}

// Query GraphQL para buscar dados de staking do usuário e do protocolo
const GET_USER_STAKING_DATA = `
  query GetUserStakingData($ownerAddress: String!) {
    user(id: $ownerAddress) {
      stakingPosition {
        id
        amountStaked
        rewardsClaimed
      }
    }
    protocol(id: "scc-protocol") {
      totalStakedGOV
    }
  }
`;

/**
 * Hook customizado para buscar a posição de staking de um usuário e dados gerais de staking do protocolo.
 */
export const useUserStaking = () => {
  const { address, isConnected } = useAccount();

  return useQuery<{
    stakingPosition: StakingPosition | null;
    protocolData: StakingProtocolData | null;
  }>({ 
    queryKey: ["userStaking", address],
    queryFn: async () => {
      if (!address) return { stakingPosition: null, protocolData: null };
      
      const data = await subgraphQuery<UserStakingData>(GET_USER_STAKING_DATA, { 
        ownerAddress: address.toLowerCase() 
      });
      
      return {
        stakingPosition: data.user?.stakingPosition || null,
        protocolData: data.protocol || null,
      };
    },
    enabled: isConnected && !!address,
    refetchInterval: 30000, // Refaz a cada 30 segundos
  });
};
