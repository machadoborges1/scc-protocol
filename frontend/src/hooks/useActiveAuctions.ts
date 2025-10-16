import { useQuery } from "@tanstack/react-query";
import { request, gql } from "graphql-request";

const SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL;

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
