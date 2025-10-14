import { useQuery } from "@tanstack/react-query";
import { subgraphQuery } from "@/services/subgraph";

// Interfaces for the data returned by the Subgraph
interface Token {
  id: string;
  symbol: string;
}

interface Vault {
  id: string;
  collateralToken: Token;
  collateralAmount: string;
  collateralValueUSD: string;
  debtAmount: string;
  debtValueUSD: string;
  collateralizationRatio: string;
}

interface StakingPosition {
  id: string;
  amountStaked: string;
}

interface UserSummaryData {
  user?: { // User can be null if they have no activity yet
    id: string;
    vaults: Vault[];
    stakingPosition: StakingPosition | null;
  };
}

// The GraphQL query. It takes a user's address ($userId) as a variable.
const GET_USER_SUMMARY = `
  query GetUserSummary($userId: ID!) {
    user(id: $userId) {
      id
      vaults {
        id
        collateralToken {
          id
          symbol
        }
        collateralAmount
        collateralValueUSD
        debtAmount
        debtValueUSD
        collateralizationRatio
      }
      stakingPosition {
        id
        amountStaked
      }
    }
  }
`;

/**
 * Custom hook to fetch a summary of a user's positions (vaults, staking).
 * @param userAddress The address of the user to fetch data for.
 */
export const useUserSummary = (userAddress?: string) => {
  // The address needs to be lowercase for the subgraph query ID
  const userId = userAddress?.toLowerCase();

  return useQuery<UserSummaryData>({
    // The query will only run if the userId is defined
    queryKey: ["userSummary", userId],
    queryFn: () => subgraphQuery<UserSummaryData>(GET_USER_SUMMARY, { userId }),
    enabled: !!userId, // Ensures the query doesn't run without a user address
    refetchInterval: 30000, // Refetch every 30 seconds to keep data fresh
  });
};
