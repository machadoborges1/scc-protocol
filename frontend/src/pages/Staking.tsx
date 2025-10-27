import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Coins, Gift, AlertCircle, Loader2 } from "lucide-react";
import { useAccount, useBalance, useReadContract } from "wagmi";
import { stakingPoolAbi } from "@/lib/abis/stakingPool";
import { useUserStaking } from "@/hooks/useUserStaking";
import { useStakingPoolData } from "@/hooks/useStakingPoolData";
import { useStake } from "@/hooks/useStake";
import { useUnstake } from "@/hooks/useUnstake";
import { useClaimRewards } from "@/hooks/useClaimRewards";
import { useTokenAllowance } from "@/hooks/useTokenAllowance";
import { useApprove } from "@/hooks/useApprove";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUnits, Address, parseEther } from "viem";
import { toast } from "sonner";

const sccGovAddress = import.meta.env.VITE_SCC_GOV_ADDRESS as Address;
const stakingPoolAddress = import.meta.env.VITE_STAKING_POOL_ADDRESS as Address;

const formatTokenAmount = (value?: bigint, decimals: number = 18) => {
    if (typeof value === 'undefined') return "0.00";
    try {
        const number = Number(formatUnits(value, decimals));
        if (isNaN(number)) return "0.00";
        return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(number);
    } catch { return "0.00"; }
};

const Staking = () => {
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const { address, isConnected } = useAccount();

  // Data Hooks - Now reading directly from blockchain
  const { stakedAmount, isLoading: isUserStakingLoading, error: userStakingError } = useUserStaking();
  const { totalStaked, isLoading: isPoolLoading, error: poolError } = useStakingPoolData();
  const { data: sccGovBalance } = useBalance({ address, token: sccGovAddress, query: { refetchInterval: 10000 } });
  const { data: allowance, refetch: refetchAllowance } = useTokenAllowance(sccGovAddress, address, stakingPoolAddress);
  const { data: earnedRewards, refetch: refetchEarnedRewards } = useReadContract({
    abi: stakingPoolAbi,
    address: stakingPoolAddress,
    functionName: 'earned',
    args: [address!],
    query: { enabled: !!address, refetchInterval: 10000 },
  });

  // Transaction Hooks
  const { approve, isPending: isApproving, isConfirmed: isApprovalConfirmed, isError: isApprovalError } = useApprove();
  const { stake, isPending: isStaking, isConfirmed: isStakeConfirmed, isError: isStakeError } = useStake();
  const { unstake, isPending: isUnstaking, isConfirmed: isUnstakeConfirmed, isError: isUnstakeError } = useUnstake();
  const { claim, isPending: isClaiming, isConfirmed: isClaimConfirmed, isError: isClaimError } = useClaimRewards();

  const stakeAmountAsBigInt = stakeAmount ? parseEther(stakeAmount) : BigInt(0);
  const hasEnoughAllowance = allowance && allowance >= stakeAmountAsBigInt;
  const isProcessing = isApproving || isStaking || isUnstaking || isClaiming;
  const isLoading = isUserStakingLoading || isPoolLoading;
  const error = userStakingError || poolError;

  // Transaction Effects (now simplified)
  useEffect(() => {
    if (isApprovalConfirmed) {
      toast.success('Approval successful!', { id: 'approve-toast' });
      refetchAllowance();
    }
    if (isApprovalError) toast.error('Approval failed', { id: 'approve-toast' });
  }, [isApprovalConfirmed, isApprovalError, refetchAllowance]);

  useEffect(() => {
    if (isStakeConfirmed) {
      toast.success('Stake successful!', { id: 'stake-toast' });
      setStakeAmount('');
    }
    if (isStakeError) toast.error('Stake failed', { id: 'stake-toast' });
  }, [isStakeConfirmed, isStakeError]);

  useEffect(() => {
    if (isUnstakeConfirmed) {
      toast.success('Unstake successful!', { id: 'unstake-toast' });
      setUnstakeAmount('');
    }
    if (isUnstakeError) toast.error('Unstake failed', { id: 'unstake-toast' });
  }, [isUnstakeConfirmed, isUnstakeError]);
  
  useEffect(() => {
    if (isClaimConfirmed) {
      toast.success('Rewards claimed!', { id: 'claim-toast' });
      refetchEarnedRewards();
    }
    if (isClaimError) toast.error('Claim failed', { id: 'claim-toast' });
  }, [isClaimConfirmed, isClaimError, refetchEarnedRewards]);


  // Handlers
  const handleApprove = () => {
    toast.loading('Requesting approval...', { id: 'approve-toast' });
    approve(sccGovAddress, stakingPoolAddress, stakeAmount);
  };
  const handleStake = () => {
    toast.loading('Requesting stake...', { id: 'stake-toast' });
    stake(stakeAmount);
  };
  const handleUnstake = () => {
    toast.loading('Requesting unstake...', { id: 'unstake-toast' });
    unstake(unstakeAmount);
  };
  const handleClaim = () => {
    toast.loading('Requesting claim...', { id: 'claim-toast' });
    claim();
  };

  const stakedAmountFormatted = formatTokenAmount(stakedAmount);

  const renderStatCards = () => {
    if (!isConnected || isLoading) return <StatCardsSkeleton />;
    return (
        <>
            <Card className="bg-gradient-card shadow-card"><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Your Staked Amount</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stakedAmountFormatted} SCC-GOV</div></CardContent></Card>
            <Card className="bg-gradient-card shadow-card"><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Total Staked</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{formatTokenAmount(totalStaked)} SCC-GOV</div></CardContent></Card>
            <Card className="bg-gradient-card shadow-card border-accent/30"><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Unclaimed Rewards</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-accent">{formatTokenAmount(earnedRewards)} SCC-USD</div><p className="text-xs text-muted-foreground mt-1">Available to claim</p></CardContent></Card>
        </>
    );
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold mb-2">Staking</h1><p className="text-muted-foreground">Stake SCC-GOV to earn protocol revenue and governance rights</p></div>
      {error && <Card className="bg-destructive/10 border-destructive/30"><CardHeader className="flex flex-row items-center text-destructive"><AlertCircle className="h-5 w-5 mr-2"/><CardTitle>Error Loading Staking Data</CardTitle></CardHeader></Card>}
      <div className="grid gap-4 md:grid-cols-3">{renderStatCards()}</div>

      <Card className="bg-gradient-card shadow-card">
        <CardHeader><CardTitle className="flex items-center"><Gift className="w-5 h-5 mr-2 text-accent" />Claim Rewards</CardTitle><CardDescription>Rewards are earned continuously and can be claimed anytime</CardDescription></CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1"><p className="text-3xl font-bold text-accent mb-2">{formatTokenAmount(earnedRewards)} SCC-USD</p><p className="text-sm text-muted-foreground">Available to claim now</p></div>
            <Button onClick={handleClaim} className="bg-gradient-primary hover:opacity-90" size="lg" disabled={!isConnected || !earnedRewards || earnedRewards === BigInt(0) || isProcessing} >
              {isClaiming ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Gift className="w-5 h-5 mr-2 text-accent" />}
              {isClaiming ? 'Claiming...' : 'Claim Rewards'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="stake" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="stake">Stake</TabsTrigger><TabsTrigger value="unstake">Unstake</TabsTrigger></TabsList>
        <TabsContent value="stake">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader><CardTitle>Stake SCC-GOV</CardTitle><CardDescription>Lock your tokens to earn rewards</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label htmlFor="stake-amount">Amount (SCC-GOV)</Label><Input id="stake-amount" placeholder="0.0" type="number" value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} disabled={!isConnected || isProcessing} /><p className="text-sm text-muted-foreground">Available: {sccGovBalance ? formatUnits(sccGovBalance.value, 18) : '0.00'} SCC-GOV</p></div>
              {hasEnoughAllowance ? (
                <Button onClick={handleStake} className="w-full bg-gradient-primary hover:opacity-90" disabled={!isConnected || isProcessing || !stakeAmount}><Coins className="w-4 h-4 mr-2" />Stake Tokens</Button>
              ) : (
                <Button onClick={handleApprove} className="w-full" disabled={!isConnected || isProcessing || !stakeAmount}><Coins className="w-4 h-4 mr-2" />Approve SCC-GOV</Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="unstake">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader><CardTitle>Unstake SCC-GOV</CardTitle><CardDescription>Withdraw your staked tokens</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2"><Label htmlFor="unstake-amount">Amount (SCC-GOV)</Label><Input id="unstake-amount" placeholder="0.0" type="number" value={unstakeAmount} onChange={(e) => setUnstakeAmount(e.target.value)} disabled={!isConnected || isProcessing || stakedAmountFormatted === '0.00'} /><p className="text-sm text-muted-foreground">Staked: {stakedAmountFormatted} SCC-GOV</p></div>
              <Button onClick={handleUnstake} className="w-full" variant="outline" disabled={!isConnected || isProcessing || !unstakeAmount || stakedAmountFormatted === '0.00'}><Coins className="w-4 h-4 mr-2" />Unstake Tokens</Button>
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
            <Card key={i} className="bg-gradient-card shadow-card">
                <CardHeader className="pb-3">
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-1/2" />
                    <Skeleton className="h-4 w-1/3 mt-1" />
                </CardContent>
            </Card>
        ))}
    </>
);

export default Staking;
