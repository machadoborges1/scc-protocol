import { useReadContract, useReadContracts } from "wagmi";
import { stakingPoolAbi } from "@/lib/abis/stakingPool";
import { sccGovAbi } from "@/lib/abis/sccGov";
import { formatUnits, type Address } from "viem";

const stakingPoolAddress = import.meta.env.VITE_STAKING_POOL_ADDRESS as Address;
const sccGovAddress = import.meta.env.VITE_SCC_GOV_ADDRESS as Address;

const SECONDS_IN_YEAR = 31536000;

// For APY calculation, we can assume a stable price for the reward token (SCC-USD, which is $1)
// and for now, we'll assume a placeholder price for the staking token (SCC-GOV) if needed,
// though a rate-based APY doesn't strictly require it.

export const useStakingAPY = () => {
  const { data, isLoading, error } = useReadContracts({
    contracts: [
      {
        address: stakingPoolAddress,
        abi: stakingPoolAbi,
        functionName: "rewardRate",
      },
      {
        address: sccGovAddress,
        abi: sccGovAbi,
        functionName: "balanceOf",
        args: [stakingPoolAddress],
      },
    ],
    query: {
        refetchInterval: 30000, // refetch every 30 seconds
    }
  });

  const calculateAPY = () => {
    if (!data || !data[0] || !data[1]) {
      return 0;
    }

    const rewardRate = data[0].result as bigint | undefined;
    const totalStaked = data[1].result as bigint | undefined;

    if (!rewardRate || !totalStaked || totalStaked === 0n) {
      return 0;
    }

    // APY = (rewardRate * seconds_in_year) / totalStaked
    // We assume reward token and staking token have the same price/decimals for simplicity here.
    // A more robust solution would fetch prices for both.
    const rewardRateFormatted = parseFloat(formatUnits(rewardRate, 18));
    const totalStakedFormatted = parseFloat(formatUnits(totalStaked, 18));

    if (totalStakedFormatted === 0) return 0;

    const apy = (rewardRateFormatted * SECONDS_IN_YEAR) / totalStakedFormatted;
    
    return apy * 100; // Return as a percentage
  };

  const apy = calculateAPY();

  return { apy, isLoading, error };
};
