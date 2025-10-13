import { useQuery } from "@tanstack/react-query";
import { subgraphQuery } from "@/services/subgraph";

// Defines the structure of the data returned from the Subgraph query
interface ProtocolStatsData {
  protocol: {
    totalVaults: string;
    totalCollateralValueUSD: string;
    totalDebtUSD: string;
    activeAuctions: string;
  };
}

// GraphQL query to fetch protocol-wide statistics
const GET_PROTOCOL_STATS = `
  query GetProtocolStats {
    protocol(id: "scc-protocol") {
      totalVaults
      totalCollateralValueUSD
      totalDebtUSD
      activeAuctions
    }
  }
`;

/**
 * Custom hook to fetch protocol statistics from the Subgraph.
 * It uses @tanstack/react-query to handle caching, refetching, and loading/error states.
 */
export const useProtocolStats = () => {
  return useQuery<ProtocolStatsData>({ 
    queryKey: ["protocolStats"],
    queryFn: () => subgraphQuery<ProtocolStatsData>(GET_PROTOCOL_STATS),
    // Refetch every 30 seconds to keep the data fresh
    refetchInterval: 30000, 
  });
};
