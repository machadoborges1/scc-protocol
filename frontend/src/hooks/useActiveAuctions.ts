import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";

const SUBGRAPH_URL = "http://127.0.0.1:8000/subgraphs/name/scc/scc-protocol";

const GET_ACTIVE_AUCTIONS = gql`
  query GetActiveAuctions {
    liquidationAuctions(where: { status: "Active" }, orderBy: startTime, orderDirection: desc) {
      id
      status
      collateralAmount
      debtToCover
      startTime
      startPrice
      vault {
        id
        owner {
          id
        }
      }
    }
  }
`;

interface Auction {
  id: string;
  status: string;
  collateralAmount: string;
  debtToCover: string;
  startTime: string;
  startPrice: string;
  vault: {
    id: string;
    owner: {
      id: string;
    };
  };
}

interface AuctionsQueryResult {
  liquidationAuctions: Auction[];
}

export const useActiveAuctions = () => {
  return useQuery<AuctionsQueryResult>({ 
    queryKey: ["activeAuctions"], 
    queryFn: async () => request(SUBGRAPH_URL, GET_ACTIVE_AUCTIONS) 
  });
};
