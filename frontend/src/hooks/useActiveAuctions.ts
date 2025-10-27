import { useQuery } from "@tanstack/react-query";
import { subgraphQuery } from "@/services/subgraph";

// Define a estrutura de um único Leilão retornado pela query
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

// Query GraphQL para buscar os leilões de liquidação ativos
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
 * Hook customizado para buscar os leilões de liquidação ativos do Subgraph.
 */
export const useActiveAuctions = () => {
  return useQuery<Auction[]>({
    queryKey: ["activeAuctions"],
    queryFn: async () => {
      const data = await subgraphQuery<AuctionsData>(GET_ACTIVE_AUCTIONS);
      return data.liquidationAuctions || [];
    },
    // Refaz a query a cada 60 segundos para manter a lista de leilões atualizada
    refetchInterval: 60000,
  });
};