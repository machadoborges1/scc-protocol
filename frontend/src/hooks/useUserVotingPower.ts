import { useQuery } from "@tanstack/react-query";
import { useAccount, useReadContract } from "wagmi";
import { sccGovAbi } from "@/lib/abis/sccGov";
import { Address, formatUnits } from "viem";

const sccGovAddress = import.meta.env.VITE_SCC_GOV_ADDRESS as Address;

/**
 * Custom hook to fetch a user's voting power.
 */
export const useUserVotingPower = () => {
  const { address, isConnected } = useAccount();

  return useReadContract({
    abi: sccGovAbi,
    address: sccGovAddress,
    functionName: 'getVotes',
    args: [address!],
    query: {
      enabled: isConnected && !!address,
      select: (data) => formatUnits(data, 18), // Formats the value into a readable string
    },
  });
};
