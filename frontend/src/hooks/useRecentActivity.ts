import { useQuery } from "@tanstack/react-query";
import { subgraphQuery } from "@/services/subgraph";

// Define a estrutura de uma única atualização de Vault (atividade)
export interface Activity {
  id: string; // tx hash + log index
  type: "DEPOSIT" | "WITHDRAW" | "MINT" | "BURN";
  amount: string;
  timestamp: string;
  vault: {
    id: string; // vault address
    collateralToken: {
      symbol: string;
    };
  };
}

// Define a estrutura da resposta da query
interface ActivityData {
  vaultUpdates: Activity[];
}

// Query GraphQL para buscar as atualizações mais recentes dos vaults
const GET_RECENT_ACTIVITY = `
  query GetRecentActivity {
    vaultUpdates(first: 7, orderBy: timestamp, orderDirection: desc) {
      id
      type
      amount
      timestamp
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
 * Hook customizado para buscar as atividades mais recentes do protocolo.
 */
export const useRecentActivity = () => {
  return useQuery<Activity[]>({
    queryKey: ["recentActivity"],
    queryFn: async () => {
      const data = await subgraphQuery<ActivityData>(GET_RECENT_ACTIVITY);
      return data.vaultUpdates || [];
    },
    // Refaz a query a cada 90 segundos
    refetchInterval: 90000,
  });
};
