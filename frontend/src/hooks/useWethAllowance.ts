import { useReadContract } from 'wagmi';
import { wethAbi } from '@/lib/abis/weth';
import { Address } from 'viem';

const wethAddress = import.meta.env.VITE_WETH_ADDRESS as Address;

export const useWethAllowance = (owner?: Address, spender?: Address) => {
  return useReadContract({
    abi: wethAbi,
    address: wethAddress,
    functionName: 'allowance',
    args: [owner!, spender!],
    query: {
      enabled: !!owner && !!spender, // Only run query if owner and spender are available
    },
  });
};
