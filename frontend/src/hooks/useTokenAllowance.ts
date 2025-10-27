import { useReadContract } from 'wagmi';
import { erc20Abi } from '@/lib/abis/erc20';
import { Address } from 'viem';

export const useTokenAllowance = (tokenAddress: Address, owner?: Address, spender?: Address) => {
  return useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: [owner!, spender!],
    query: {
      // The query will only run if all arguments are provided
      enabled: !!tokenAddress && !!owner && !!spender,
    },
  });
};