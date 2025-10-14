import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { useUserSummary } from "@/hooks/useUserSummary";
import { formatUnits } from "viem";

// Helper to format large token amounts from their smallest unit (e.g., wei)
const formatTokenAmount = (value: string, decimals: number = 18) => {
    try {
        const number = Number(formatUnits(BigInt(value), decimals));
        if (isNaN(number)) return "0.00";

        if (number > 1_000_000) {
            return `${(number / 1_000_000).toFixed(2)}M`;
        }
        if (number > 1_000) {
            return `${(number / 1_000).toFixed(1)}K`;
        }
        return number.toFixed(2);
    } catch (error) {
        console.error("Failed to format token amount", error);
        return "0.00";
    }
};


export const UserSummary = () => {
  const { address, isConnected } = useAccount();
  const { data, isLoading, error } = useUserSummary(address);

  // Loading State
  if (isLoading && isConnected) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader><CardTitle>My Vaults</CardTitle><CardDescription>Loading your positions...</CardDescription></CardHeader>
          <CardContent className="space-y-4"><div className="flex justify-between items-center"><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-24" /></div><div className="flex justify-between items-center pt-4 border-t"><Skeleton className="h-7 w-20" /><Skeleton className="h-8 w-20" /></div></CardContent>
        </Card>
        <Card className="bg-gradient-card shadow-card">
          <CardHeader><CardTitle>Staking Position</CardTitle><CardDescription>Loading your staking...</CardDescription></CardHeader>
          <CardContent className="space-y-4"><div className="flex justify-between items-center"><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-24" /></div><div className="flex justify-between items-center pt-4 border-t"><Skeleton className="h-7 w-20" /><Skeleton className="h-8 w-20" /></div></CardContent>
        </Card>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card className="md:col-span-2 bg-destructive/10 border-destructive/30">
                <CardHeader className="flex flex-row items-center text-destructive"><AlertCircle className="h-5 w-5 mr-2"/><CardTitle>Error Fetching Your Data</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-destructive/80">Could not load your personal data. The subgraph might be experiencing issues.</p></CardContent>
            </Card>
        </div>
    )
  }

  // Not Connected or No Data State
  if (!isConnected || !data?.user) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-gradient-card shadow-card">
                <CardHeader><CardTitle>My Vaults</CardTitle><CardDescription>Connect your wallet to see your positions</CardDescription></CardHeader>
                <CardContent className="text-center text-muted-foreground py-10"><p>No vault data to display.</p></CardContent>
            </Card>
            <Card className="bg-gradient-card shadow-card">
                <CardHeader><CardTitle>Staking Position</CardTitle><CardDescription>Connect your wallet to see your staking</CardDescription></CardHeader>
                <CardContent className="text-center text-muted-foreground py-10"><p>No staking data to display.</p></CardContent>
            </Card>
        </div>
    );
  }

  // --- Data Processing for Success State ---
  const { vaults, stakingPosition } = data.user;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Vaults Card */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>My Vaults</CardTitle>
          <CardDescription>A summary of your collateralized positions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Active Vaults</p>
              <p className="text-2xl font-bold">{vaults.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Debt</p>
              <p className="text-2xl font-bold text-muted-foreground">N/A</p>
            </div>
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Collateralization</p>
              <p className="text-xl font-bold text-muted-foreground">N/A</p>
            </div>
            <Link to="/vaults">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Staking Card */}
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>Staking Position</CardTitle>
          <CardDescription>Your SCC-GOV staking rewards</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Staked Amount</p>
              <p className="text-2xl font-bold">
                {stakingPosition ? `${formatTokenAmount(stakingPosition.amountStaked)} SCC-GOV` : "0.00 SCC-GOV"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">APY</p>
              <p className="text-2xl font-bold text-success">12.8%</p> {/* APY is still mock */}
            </div>
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
             <div>
                <p className="text-sm text-muted-foreground">Unclaimed Rewards</p>
                <p className="text-xl font-bold text-muted-foreground">N/A</p>
            </div>
            <Link to="/staking">
              <Button variant="outline" size="sm" disabled={true}>
                <TrendingUp className="w-4 h-4 mr-1" />
                Claim
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
