import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Coins, Gift, AlertCircle } from "lucide-react";
import { useAccount } from "wagmi";
import { useUserSummary } from "@/hooks/useUserSummary";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUnits } from "viem";

// Helper to format large token amounts
const formatTokenAmount = (value: string, decimals: number = 18) => {
    try {
        const number = Number(formatUnits(BigInt(value), decimals));
        if (isNaN(number)) return "0.00";
        return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(number);
    } catch { return "0.00"; }
};

const Staking = () => {
  const { address, isConnected } = useAccount();
  const { data, isLoading, error } = useUserSummary(address);

  const stakedAmount = data?.user?.stakingPosition?.amountStaked ?? "0";
  const stakedAmountFormatted = formatTokenAmount(stakedAmount);

  const renderStatCards = () => {
    if (!isConnected) {
        return [...Array(3)].map((_, i) => (
            <Card key={i} className="bg-gradient-card shadow-card"><CardHeader className="pb-3"><Skeleton className="h-4 w-2/3" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-1/3 mt-1" /></CardContent></Card>
        ));
    }
    if (isLoading) {
        return <StatCardsSkeleton />;
    }

    return (
        <>
            <Card className="bg-gradient-card shadow-card">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Your Staked Amount</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold">{stakedAmountFormatted} SCC-GOV</div></CardContent>
            </Card>
            <Card className="bg-gradient-card shadow-card border-success/30">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Current APY</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-success">12.8%</div><p className="text-xs text-muted-foreground mt-1">(Mock Data)</p></CardContent>
            </Card>
            <Card className="bg-gradient-card shadow-card border-accent/30">
                <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Unclaimed Rewards</CardTitle></CardHeader>
                <CardContent><div className="text-2xl font-bold text-accent">N/A</div><p className="text-xs text-muted-foreground mt-1">(Not available)</p></CardContent>
            </Card>
        </>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Staking</h1>
        <p className="text-muted-foreground">Stake SCC-GOV to earn protocol revenue and governance rights</p>
      </div>

      {error && (
          <Card className="bg-destructive/10 border-destructive/30"><CardHeader className="flex flex-row items-center text-destructive"><AlertCircle className="h-5 w-5 mr-2"/><CardTitle>Error Loading Staking Data</CardTitle></CardHeader></Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">{renderStatCards()}</div>

      <Card className="bg-gradient-card shadow-card">
        <CardHeader><CardTitle className="flex items-center"><Gift className="w-5 h-5 mr-2 text-accent" />Claim Rewards</CardTitle><CardDescription>Rewards are earned continuously and can be claimed anytime</CardDescription></CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <p className="text-3xl font-bold text-accent mb-2">N/A</p>
              <p className="text-sm text-muted-foreground">Available to claim now</p>
            </div>
            <Button className="bg-gradient-primary hover:opacity-90" size="lg" disabled={true}>Claim Rewards</Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="stake" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stake">Stake</TabsTrigger>
          <TabsTrigger value="unstake">Unstake</TabsTrigger>
        </TabsList>

        <TabsContent value="stake">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader><CardTitle>Stake SCC-GOV</CardTitle><CardDescription>Lock your tokens to earn rewards and governance rights</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stake-amount">Amount (SCC-GOV)</Label>
                <Input id="stake-amount" placeholder="0.0" type="number" disabled={!isConnected} />
                <p className="text-sm text-muted-foreground">Available: (Connect Wallet)</p>
              </div>
              <Button className="w-full bg-gradient-primary hover:opacity-90" disabled={!isConnected}><Coins className="w-4 h-4 mr-2" />Stake Tokens</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unstake">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader><CardTitle>Unstake SCC-GOV</CardTitle><CardDescription>Withdraw your staked tokens</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="unstake-amount">Amount (SCC-GOV)</Label>
                <Input id="unstake-amount" placeholder="0.0" type="number" disabled={!isConnected || stakedAmount === "0"} />
                <p className="text-sm text-muted-foreground">Staked: {stakedAmountFormatted} SCC-GOV</p>
              </div>
              <Button className="w-full" variant="outline" disabled={!isConnected || stakedAmount === "0"}><Coins className="w-4 h-4 mr-2" />Unstake Tokens</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const StatCardsSkeleton = () => (
    <>
        {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-gradient-card shadow-card"><CardHeader className="pb-3"><Skeleton className="h-4 w-2/3" /></CardHeader><CardContent><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-1/3 mt-1" /></CardContent></Card>
        ))}
    </>
);

export default Staking;
