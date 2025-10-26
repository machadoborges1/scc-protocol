import { useQuery } from "@tanstack/react-query";
import { useAccount, useReadContract } from "wagmi";
import { request, gql } from "graphql-request";
import { sccGovAbi } from "@/lib/abis/sccGov";
import { type Address } from "viem";

const SUBGRAPH_URL = import.meta.env.VITE_SUBGRAPH_URL;
const SCC_GOV_ADDRESS = import.meta.env.VITE_SCC_GOV_ADDRESS as Address;

// --- GraphQL Query ---
const GET_PROPOSALS = gql`
  query GetProposals {
    governanceProposals(orderBy: createdAtTimestamp, orderDirection: desc, first: 100) {
      id
      status
      description
      forVotes
      againstVotes
      abstainVotes
      voteStart
      voteEnd
      proposer {
        id
      }
    }
  }
`;

// --- Interfaces ---
export interface Proposal {
  id: string;
  status: "Pending" | "Active" | "Canceled" | "Defeated" | "Succeeded" | "Queued" | "Expired" | "Executed";
  description: string;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  voteStart: string;
  voteEnd: string;
  proposer: { id: string };
}

interface ProposalsQueryResult {
  governanceProposals: Proposal[];
}

interface GovernanceData {
  proposals: Proposal[];
  votingPower: bigint | undefined;
  hasDelegated: boolean;
}

/**
 * Hook to fetch all data required for the Governance page.
 */
export const useGovernanceData = () => {
  const { address, isConnected } = useAccount();

  // 1. Fetch all proposals from the subgraph
  const { 
    data: proposalsData, 
    isLoading: isLoadingProposals, 
    error: proposalsError, 
    refetch: refetchProposals
  } = useQuery<ProposalsQueryResult>({ 
    queryKey: ["proposals"], 
    queryFn: async () => request(SUBGRAPH_URL, GET_PROPOSALS),
    refetchInterval: 60000, // Refetch every minute
  });

  // 2. Fetch the user's current voting power (votes)
  const { data: votingPower, isLoading: isLoadingVotingPower } = useReadContract({
    address: SCC_GOV_ADDRESS,
    abi: sccGovAbi,
    functionName: "getVotes",
    args: [address!],
    query: {
      enabled: isConnected && !!address,
    },
  });

  // 3. Check if the user has delegated their votes
  const { data: delegates, isLoading: isLoadingDelegates } = useReadContract({
    address: SCC_GOV_ADDRESS,
    abi: sccGovAbi,
    functionName: "delegates",
    args: [address!],
    query: {
      enabled: isConnected && !!address,
    },
  });

  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const hasDelegated = delegates ? delegates !== ZERO_ADDRESS : false;

  const isLoading = isLoadingProposals || isLoadingVotingPower || isLoadingDelegates;
  const error = proposalsError;

  const data: GovernanceData = {
    proposals: proposalsData?.governanceProposals ?? [],
    votingPower: votingPower as bigint | undefined,
    hasDelegated,
  };

  return { data, isLoading, error, refetch: refetchProposals };
};
