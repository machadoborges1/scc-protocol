import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { subgraphQuery } from "@/services/subgraph";

// Define a estrutura de um único Vault retornado pela query
export interface UserVault {
  id: string; // Endereço do contrato do Vault
  collateralAmount: string;
  collateralValueUSD: string;
  debtAmount: string;
  collateralizationRatio: string;
  collateralToken: {
    symbol: string;
  };
}

// Define a estrutura da resposta completa da query
interface UserVaultsData {
  user: {
    vaults: UserVault[];
  };
}

// Query GraphQL para buscar os vaults de um usuário específico
const GET_USER_VAULTS = `
  query GetUserVaults($ownerAddress: String!) {
    user(id: $ownerAddress) {
      vaults(orderBy: createdAtTimestamp, orderDirection: desc) {
        id
        collateralAmount
        collateralValueUSD
        debtAmount
        collateralizationRatio
        collateralToken {
          symbol
        }
      }
    }
  }
`;

/**
 * Hook customizado para buscar os vaults de um usuário conectado.
 * 
 * @returns Retorna o resultado da query do @tanstack/react-query, incluindo dados,
 * estado de carregamento e erro. Os dados são uma lista de vaults do usuário.
 */
export const useUserVaults = () => {
  const { address, isConnected } = useAccount();

  return useQuery<UserVault[]>({
    // A chave da query inclui o endereço do usuário para que a query seja refeita se o usuário mudar
    queryKey: ["userVaults", address],
    
    // A função da query só é executada se o usuário estiver conectado
    queryFn: async () => {
      if (!address) return [];
      
      const data = await subgraphQuery<UserVaultsData>(GET_USER_VAULTS, { 
        ownerAddress: address.toLowerCase() 
      });
      
      // Se o usuário não existir no subgraph, ele não terá vaults
      return data.user ? data.user.vaults : [];
    },
    
    // A query só será habilitada (executada) se o endereço do usuário estiver disponível
    enabled: isConnected && !!address,
    
    // Define um tempo de cache mais longo, mas refaz a query em segundo plano
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchInterval: 1000 * 60, // Refaz a cada 1 minuto
  });
};
