import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Vote, CheckCircle, XCircle, Clock, Loader2, AlertCircle, ThumbsUp, ThumbsDown, MinusCircle } from "lucide-react";
import { useProposals, Proposal } from "@/hooks/useProposals";
import { useUserVotingPower } from "@/hooks/useUserVotingPower";
import { useDelegateVote } from "@/hooks/useDelegateVote";
import { useCastVote, VoteOption } from "@/hooks/useCastVote";
import { useAccount } from "wagmi";
import { formatUnits } from "viem";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const formatNumber = (value: string, decimals = 18) => {
  try {
    const formatted = formatUnits(BigInt(value), decimals);
    return parseFloat(formatted).toLocaleString('en-US', { maximumFractionDigits: 0 });
  } catch {
    return "0";
  }
};

const shortenAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'active': return { variant: "default", icon: Clock, text: "Active" };
    case 'succeeded':
    case 'queued':
    case 'executed': return { variant: "default", className: "bg-success text-success-foreground", icon: CheckCircle, text: status };
    case 'defeated':
    case 'canceled':
    case 'expired': return { variant: "destructive", icon: XCircle, text: status };
    default: return { variant: "secondary", icon: Clock, text: "Pending" };
  }
};

const ProposalCard = ({ proposal }: { proposal: Proposal }) => {
  const { castVote, isPending, isConfirming } = useCastVote();
  const queryClient = useQueryClient();

  const badge = getStatusBadge(proposal.status);
  const totalVotes = BigInt(proposal.forVotes) + BigInt(proposal.againstVotes);
  const forPercentage = totalVotes > 0 ? Number((BigInt(proposal.forVotes) * 100n) / totalVotes) : 0;
  const isProcessing = isPending || isConfirming;

  const handleVote = (support: VoteOption) => {
    toast.loading("Casting your vote...", { id: `vote-${proposal.id}` });
    castVote(proposal.id, support);
  };

  useEffect(() => {
    // This effect is local to the card, but a success will trigger a global refetch.
    if (isConfirming) return;
    if (isPending) return;

    const toastId = `vote-${proposal.id}`;
    if (toast.getAllToasts().find(t => t.id === toastId)) {
        // This logic is simplified. A real app might use the `isSuccess` and `isError` flags
        // from the hook to determine the final state.
        toast.dismiss(toastId);
    }
  }, [isPending, isConfirming, proposal.id]);


  return (
    <Card className="bg-gradient-card shadow-card hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={badge.variant} className={badge.className}><badge.icon className="w-3 h-3 mr-1" />{badge.text}</Badge>
              <span className="text-sm text-muted-foreground">Proposed by {shortenAddress(proposal.proposer.id)}</span>
            </div>
            <CardTitle className="text-xl mb-2">{proposal.description.split('\n')[0]}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-success flex items-center"><ThumbsUp className="w-4 h-4 mr-1" />For: {formatNumber(proposal.forVotes)}</span>
              <span className="text-destructive flex items-center"><ThumbsDown className="w-4 h-4 mr-1" />Against: {formatNumber(proposal.againstVotes)}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2"><div className="bg-success h-2 rounded-full" style={{ width: `${forPercentage}%` }} /></div>
          </div>
          {proposal.status.toLowerCase() === 'active' && (
            <div className="flex gap-2 pt-2">
              <Button onClick={() => handleVote(1)} disabled={isProcessing} variant="outline" size="sm" className="flex-1"><ThumbsUp className="w-4 h-4 mr-1" />For</Button>
              <Button onClick={() => handleVote(0)} disabled={isProcessing} variant="outline" size="sm" className="flex-1"><ThumbsDown className="w-4 h-4 mr-1" />Against</Button>
              <Button onClick={() => handleVote(2)} disabled={isProcessing} variant="outline" size="sm" className="flex-1"><MinusCircle className="w-4 h-4 mr-1" />Abstain</Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const Governance = () => {
  const { address } = useAccount();
  const { data: proposals, isLoading, error, refetch: refetchProposals } = useProposals();
  const { data: votingPower, refetch: refetchVotingPower } = useUserVotingPower();
  const { delegate, isPending, isConfirming, isConfirmed, isError } = useDelegateVote();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Delegation successful!", { id: 'delegate-toast' });
      setTimeout(() => {
        refetchVotingPower();
        queryClient.invalidateQueries({ queryKey: ['proposals'] }); // Refetch proposals in case delegation affects them
      }, 2000);
    }
    if (isError) toast.error("Delegation failed", { id: 'delegate-toast' });
  }, [isConfirmed, isError, refetchVotingPower, queryClient]);

  const handleDelegate = () => {
    if (!address) {
      toast.error("Please connect your wallet first.");
      return;
    }
    toast.loading("Requesting delegation...", { id: 'delegate-toast' });
    delegate(address);
  };

  const renderContent = () => {
    if (isLoading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader><CardContent><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-2/3 mt-2" /></CardContent></Card>)}</div>;
    if (error) return <Card className="bg-destructive/10 text-center py-12"><CardHeader><CardTitle>Error Loading Proposals</CardTitle></CardHeader><CardContent><p>Could not load governance proposals.</p></CardContent></Card>;
    if (!proposals || proposals.length === 0) return <Card className="text-center py-12"><CardContent><p>No governance proposals found.</p></CardContent></Card>;
    return <div className="space-y-4">{proposals.map((proposal) => <ProposalCard key={proposal.id} proposal={proposal} />)}</div>;
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold mb-2">Governance</h1><p className="text-muted-foreground">Vote on protocol proposals with your SCC-GOV tokens</p></div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-card shadow-card"><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Your Voting Power</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{votingPower ? parseFloat(votingPower).toLocaleString() : '0'} SCC-GOV</div></CardContent></Card>
        <Card className="bg-gradient-card shadow-card"><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Active Proposals</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{proposals?.filter(p => p.status.toLowerCase() === 'active').length ?? 0}</div></CardContent></Card>
        <Card className="bg-gradient-card shadow-card"><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Total Proposals</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{proposals?.length ?? 0}</div></CardContent></Card>
      </div>
      <Card className="bg-gradient-card shadow-card border-accent/20">
        <CardHeader><CardTitle className="flex items-center text-accent"><Vote className="w-5 h-5 mr-2" />Delegate Your Voting Power</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm mb-4">Delegate your voting power to yourself or another address to participate in governance.</p>
          <Button onClick={handleDelegate} disabled={isPending || isConfirming} className="bg-gradient-primary hover:opacity-90">
            {(isPending || isConfirming) ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Delegate to Self
          </Button>
        </CardContent>
      </Card>
      {renderContent()}
    </div>
  );
};

export default Governance;
