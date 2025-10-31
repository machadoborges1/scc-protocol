import { useQuery } from "@tanstack/react-query";
import { subgraphQuery } from "@/services/subgraph";

// Defines the structure of a single Auction returned by the query
export interface Auction {
  id: string;
  collateralAmount: string;
  debtToCover: string;
  startTime: string;
  startPrice: string;
  vault: {
    id: string;
    collateralToken: {
      symbol: string;
    };
  };
}

// Define a estrutura da resposta completa da query
interface AuctionsData {
  liquidationAuctions: Auction[];
}

// GraphQL query to fetch active liquidation auctions
const GET_ACTIVE_AUCTIONS = `
  query GetActiveAuctions {
    liquidationAuctions(where: { status: "Active" }, orderBy: startTime, orderDirection: desc) {
      id
      collateralAmount
      debtToCover
      startTime
      startPrice
      vault {
        id
        collateralToken {
          symbol
        }
      }
    }
  }
`;

/**
 * Custom hook to fetch active liquidation auctions from the Subgraph.
 */
export const useActiveAuctions = () => {
  return useQuery<Auction[]>({
    queryKey: ["activeAuctions"],
    queryFn: async () => {
      const data = await subgraphQuery<AuctionsData>(GET_ACTIVE_AUCTIONS);
      return data.liquidationAuctions || [];
    },
    // Refetches the query every 60 seconds to keep the list of auctions updated
    refetchInterval: 60000,
  });
};