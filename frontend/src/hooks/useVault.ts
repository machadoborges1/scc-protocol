import { useQuery } from '@tanstack/react-query';
import { subgraphQuery } from '@/services/subgraph';
import { Vault } from '@/hooks/useUserSummary'; // Reuse the Vault type

interface VaultData {
  vault?: Vault;
}

const GET_VAULT_BY_ID = `
  query GetVaultById($vaultId: ID!) {
    vault(id: $vaultId) {
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
  }
`;

export const useVault = (vaultId?: string) => {
  return useQuery<VaultData>({
    queryKey: ['vault', vaultId],
    queryFn: () => subgraphQuery<VaultData>(GET_VAULT_BY_ID, { vaultId }),
    enabled: !!vaultId,
    refetchInterval: 15000, // Refetch more often for an active page
  });
};
