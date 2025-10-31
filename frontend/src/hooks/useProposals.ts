import { useQuery } from "@tanstack/react-query";
import { subgraphQuery } from "@/services/subgraph";

// Defines the structure of a single Governance Proposal
export interface Proposal {
  id: string;
  proposer: {
    id: string;
  };
  status: string;
  description: string;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  createdAtTimestamp: string;
}

// Defines the structure of the query response
interface ProposalsData {
  governanceProposals: Proposal[];
}

// GraphQL query to fetch all governance proposals
const GET_PROPOSALS = `
  query GetProposals {
    governanceProposals(orderBy: createdAtTimestamp, orderDirection: desc) {
      id
      proposer {
        id
      }
      status
      description
      forVotes
      againstVotes
      abstainVotes
      createdAtTimestamp
    }
  }
`;

/**
 * Custom hook to fetch all governance proposals from the Subgraph.
 */
export const useProposals = () => {
  return useQuery<Proposal[]>({
    queryKey: ["proposals"],
    queryFn: async () => {
      const data = await subgraphQuery<ProposalsData>(GET_PROPOSALS);
      return data.governanceProposals || [];
    },
    // Proposals do not change very often, a longer refetch interval is acceptable
    refetchInterval: 1000 * 60 * 5, // 5 minutos
  });
};
