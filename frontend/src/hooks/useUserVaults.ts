import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { subgraphQuery } from "@/services/subgraph";

// Defines the structure of a single Vault returned by the query
export interface UserVault {
  id: string; // Vault contract address
  collateralAmount: string;
  collateralValueUSD: string;
  debtAmount: string;
  collateralizationRatio: string;
  collateralToken: {
    symbol: string;
  };
}

// Defines the structure of the complete query response
interface UserVaultsData {
  user: {
    vaults: UserVault[];
  };
}

// GraphQL query to fetch vaults for a specific user
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
 * Custom hook to fetch vaults for a connected user.
 * 
 * @returns Returns the result of the @tanstack/react-query query, including data,
 * loading state, and error. The data is a list of user vaults.
 */
export const useUserVaults = () => {
  const { address, isConnected } = useAccount();

  return useQuery<UserVault[]>({
    // The query key includes the user's address so that the query is refetched if the user changes
    queryKey: ["userVaults", address],
    
    // The query function is only executed if the user is connected
    queryFn: async () => {
      if (!address) return [];
      
      const data = await subgraphQuery<UserVaultsData>(GET_USER_VAULTS, { 
        ownerAddress: address.toLowerCase() 
      });
      
      // If the user does not exist in the subgraph, they will not have vaults
      return data.user ? data.user.vaults : [];
    },
    
    // The query will only be enabled (executed) if the user's address is available
    enabled: isConnected && !!address,
    
    // Defines a longer cache time, but refetches the query in the background
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchInterval: 1000 * 60, // Refaz a cada 1 minuto
  });
};
