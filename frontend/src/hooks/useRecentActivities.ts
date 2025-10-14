import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";

const SUBGRAPH_URL = "http://127.0.0.1:8000/subgraphs/name/scc/scc-protocol";

const GET_RECENT_ACTIVITIES = gql`
  query GetRecentActivities {
    vaultUpdates(first: 5, orderBy: timestamp, orderDirection: desc) {
      id
      type
      amount
      timestamp
      vault {
        id
      }
    }
  }
`;

interface Activity {
  id: string;
  type: "DEPOSIT" | "WITHDRAW" | "MINT" | "BURN";
  amount: string;
  timestamp: string;
  vault: {
    id: string;
  };
}

interface ActivitiesQueryResult {
  vaultUpdates: Activity[];
}

export const useRecentActivities = () => {
  return useQuery<ActivitiesQueryResult>({ 
    queryKey: ["recentActivities"], 
    queryFn: async () => request(SUBGRAPH_URL, GET_RECENT_ACTIVITIES) 
  });
};
