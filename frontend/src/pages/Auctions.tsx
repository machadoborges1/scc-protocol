import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gavel, TrendingDown, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { useActiveAuctions, Auction } from "@/hooks/useActiveAuctions";
import { useAccount } from "wagmi";
import { useTokenAllowance } from "@/hooks/useTokenAllowance";
import { useApprove } from "@/hooks/useApprove";
import { useBuyFromAuction } from "@/hooks/useBuyFromAuction";
import { Address, parseEther, formatEther } from "viem";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const sccUsdAddress = import.meta.env.VITE_SCC_USD_ADDRESS as Address;
const liquidationManagerAddress = import.meta.env.VITE_LIQUIDATION_MANAGER_ADDRESS as Address;

const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

const AuctionCard = ({ auction }: { auction: Auction }) => {
  const [amount, setAmount] = useState('');
  const { address: userAddress } = useAccount();
  const queryClient = useQueryClient();

  const { data: allowance, refetch: refetchAllowance } = useTokenAllowance(sccUsdAddress, userAddress, liquidationManagerAddress);
  const { approve, isPending: isApproving, isConfirmed: isApprovalConfirmed, isError: isApprovalError } = useApprove();
  const { buyFromAuction, isPending: isBuying, isConfirmed: isBuyConfirmed, isError: isBuyError } = useBuyFromAuction();

  const amountAsBigInt = amount ? parseEther(amount) : BigInt(0);
  const hasEnoughAllowance = allowance && allowance >= amountAsBigInt;
  const isProcessing = isApproving || isBuying;

  useEffect(() => {
    if (isApprovalConfirmed) {
      toast.success('Approval successful!', { id: `approve-${auction.id}` });
      refetchAllowance();
    }
    if (isApprovalError) toast.error('Approval failed', { id: `approve-${auction.id}` });
  }, [isApprovalConfirmed, isApprovalError, refetchAllowance, auction.id]);

  useEffect(() => {
    if (isBuyConfirmed) {
      toast.success('Purchase successful!', { id: `buy-${auction.id}` });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['activeAuctions'] });
        queryClient.invalidateQueries({ queryKey: ['balance'] });
      }, 2000);
      setAmount('');
    }
    if (isBuyError) toast.error('Purchase failed', { id: `buy-${auction.id}` });
  }, [isBuyConfirmed, isBuyError, auction.id, queryClient]);

  const handleApprove = () => {
    toast.loading('Requesting approval...', { id: `approve-${auction.id}` });
    approve(sccUsdAddress, liquidationManagerAddress, amount);
  };

  const handleBuy = () => {
    toast.loading('Requesting purchase...', { id: `buy-${auction.id}` });
    buyFromAuction(auction.id, amount);
  };

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">Vault #{formatAddress(auction.vault.id)}</CardTitle>
            <CardDescription className="mt-1">For Sale: {parseFloat(auction.collateralAmount).toFixed(2)} {auction.vault.collateralToken.symbol}</CardDescription>
          </div>
          <Badge variant="destructive" className="text-base px-3 py-1"><TrendingDown className="w-4 h-4 mr-1" />Auction</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-secondary rounded-lg"><span className="text-sm text-muted-foreground">Price per {auction.vault.collateralToken.symbol}</span><span className="font-bold text-lg">${parseFloat(auction.startPrice).toFixed(2)}</span></div>
            <div className="flex justify-between p-3 bg-secondary rounded-lg"><span className="text-sm text-muted-foreground">Time Remaining</span><span className="font-bold text-lg flex items-center"><Clock className="w-4 h-4 mr-1" />23h 59m</span></div>
          </div>
          <div className="flex flex-col justify-end gap-2">
            <div className="space-y-2"><Label htmlFor={`buy-amount-${auction.id}`}>Amount to Buy ({auction.vault.collateralToken.symbol})</Label><Input id={`buy-amount-${auction.id}`} placeholder="0.0" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={isProcessing} /></div>
            {hasEnoughAllowance ? (
              <Button onClick={handleBuy} disabled={isProcessing || !amount} className="bg-gradient-primary hover:opacity-90" size="lg"><Gavel className="w-4 h-4 mr-2" />Buy Collateral</Button>
            ) : (
              <Button onClick={handleApprove} disabled={isProcessing || !amount} size="lg"><Gavel className="w-4 h-4 mr-2" />Approve SCC-USD</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const Auctions = () => {
  const { data, isLoading, error } = useActiveAuctions();

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold mb-2">Liquidation Auctions</h1><p className="text-muted-foreground">Buy collateral from liquidated vaults at discounted prices</p></div>
      <Card className="bg-gradient-primary text-primary-foreground shadow-card"><CardHeader><CardTitle className="flex items-center"><Gavel className="w-5 h-5 mr-2" />How Auctions Work</CardTitle></CardHeader><CardContent className="space-y-2 text-sm opacity-90"><p>• Vaults with CR below 150% are liquidated and put up for auction</p><p>• Collateral price decreases over time (Dutch auction)</p><p>• Buy collateral with SCC-USD to capture the discount</p><p>• Earlier purchases get better discounts</p></CardContent></Card>
      <div className="space-y-4">
        {isLoading && <Card className="bg-gradient-card shadow-card flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-primary animate-spin" /><p className="ml-4 text-lg">Loading active auctions...</p></Card>}
        {error && <Card className="bg-gradient-card shadow-card flex items-center justify-center py-12 text-destructive border-destructive/50"><AlertTriangle className="w-8 h-8 mr-4" /><p className="text-lg">Failed to load auctions. Please try again later.</p></Card>}
        {data && data.map((auction) => <AuctionCard key={auction.id} auction={auction} />)}
      </div>
      {data && data.length === 0 && (
        <Card className="bg-gradient-card shadow-card"><CardContent className="flex flex-col items-center justify-center py-12"><Gavel className="w-16 h-16 text-muted-foreground mb-4 opacity-50" /><h3 className="text-xl font-semibold mb-2">No Active Auctions</h3><p className="text-muted-foreground">Check back later for liquidation opportunities</p></CardContent></Card>
      )}
    </div>
  );
};

export default Auctions;
