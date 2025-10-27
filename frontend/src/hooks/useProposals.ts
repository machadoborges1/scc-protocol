import { useQuery } from "@tanstack/react-query";
import { subgraphQuery } from "@/services/subgraph";

// Define a estrutura de uma única Proposta de Governança
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

// Define a estrutura da resposta da query
interface ProposalsData {
  governanceProposals: Proposal[];
}

// Query GraphQL para buscar todas as propostas de governança
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
 * Hook customizado para buscar todas as propostas de governança do Subgraph.
 */
export const useProposals = () => {
  return useQuery<Proposal[]>({
    queryKey: ["proposals"],
    queryFn: async () => {
      const data = await subgraphQuery<ProposalsData>(GET_PROPOSALS);
      return data.governanceProposals || [];
    },
    // As propostas não mudam com tanta frequência, um refetch mais longo é aceitável
    refetchInterval: 1000 * 60 * 5, // 5 minutos
  });
};
