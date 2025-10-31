import { useQuery } from "@tanstack/react-query";
import { subgraphQuery } from "@/services/subgraph";

// Defines the structure of a single Vault update (activity)
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

// Defines the structure of the query response
interface ActivityData {
  vaultUpdates: Activity[];
}

// GraphQL query to fetch the most recent vault updates
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
 * Custom hook to fetch the most recent protocol activities.
 */
export const useRecentActivity = () => {
  return useQuery<Activity[]>({
    queryKey: ["recentActivity"],
    queryFn: async () => {
      const data = await subgraphQuery<ActivityData>(GET_RECENT_ACTIVITY);
      return data.vaultUpdates || [];
    },
    // Refetches the query every 90 seconds
    refetchInterval: 90000,
  });
};
