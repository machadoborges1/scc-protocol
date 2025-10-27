import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Loader2 } from "lucide-react";
import { useAccount, useBalance } from 'wagmi';
import { useTokenAllowance } from '@/hooks/useTokenAllowance';
import { useApprove } from '@/hooks/useApprove';
import { useBurnSccUsd } from '@/hooks/useBurnSccUsd';
import { Address, parseEther, formatEther } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const sccUsdAddress = import.meta.env.VITE_SCC_USD_ADDRESS as Address;
const BURN_TOAST_ID = "burn-toast";

interface BurnFormProps {
  vaultAddress: Address;
  debtAmount: string;
  onSuccessfulBurn: () => void;
}

export const BurnForm = ({ vaultAddress, debtAmount, onSuccessfulBurn }: BurnFormProps) => {
  const [amount, setAmount] = useState('');
  const { address: userAddress } = useAccount();
  const queryClient = useQueryClient();

  // Data-fetching hooks
  const { data: sccUsdBalance } = useBalance({ address: userAddress, token: sccUsdAddress });
  const { data: allowance, refetch: refetchAllowance } = useTokenAllowance(sccUsdAddress, userAddress, vaultAddress);

  // Transaction hooks
  const { approve, isPending: isApproving, isConfirmed: isApprovalConfirmed, isError: isApprovalError } = useApprove();
  const { burnSccUsd, isPending: isBurning, isConfirmed: isBurnConfirmed, isError: isBurnError } = useBurnSccUsd();

  const amountAsBigInt = amount ? parseEther(amount) : BigInt(0);
  const hasEnoughAllowance = allowance && allowance >= amountAsBigInt;
  const isProcessing = isApproving || isBurning;

  // Effect for approval transaction
  useEffect(() => {
    if (isApprovalConfirmed) {
      toast.success('Approval successful!', { id: 'approve-toast' });
      refetchAllowance();
    }
    if (isApprovalError) {
      toast.error('Approval failed', { id: 'approve-toast' });
    }
  }, [isApprovalConfirmed, isApprovalError, refetchAllowance]);

  // Effect for burn transaction
  useEffect(() => {
    if (isBurnConfirmed) {
      toast.success('Burn successful!', { id: BURN_TOAST_ID });
      setTimeout(() => {
        onSuccessfulBurn();
        refetchAllowance();
        queryClient.invalidateQueries({ queryKey: ['balance'] });
      }, 2000);
      setAmount('');
    }
    if (isBurnError) {
      toast.error('Burn failed', { id: BURN_TOAST_ID });
    }
  }, [isBurnConfirmed, isBurnError, onSuccessfulBurn, refetchAllowance, queryClient]);

  const handleApprove = () => {
    toast.loading('Requesting approval...', { id: 'approve-toast' });
    approve(sccUsdAddress, vaultAddress, amount);
  }

  const handleBurn = () => {
    toast.loading('Requesting to burn...', { id: BURN_TOAST_ID });
    burnSccUsd(vaultAddress, amount);
  }

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle>Burn SCC-USD</CardTitle>
        <CardDescription>Pay back your debt to release collateral.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="burn-amount">Amount (SCC-USD)</Label>
          <Input 
            id="burn-amount" 
            placeholder="0.0" 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isProcessing}
          />
          <p className="text-sm text-muted-foreground">
            Debt: {parseFloat(debtAmount).toFixed(2)} SCC-USD | Balance: {sccUsdBalance ? formatEther(sccUsdBalance.value) : '0.00'}
          </p>
        </div>
        
        {hasEnoughAllowance ? (
          <Button onClick={handleBurn} disabled={isProcessing || !amount} className="w-full bg-gradient-primary hover:opacity-90">
            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DollarSign className="w-4 h-4 mr-2" />}
            Burn SCC-USD
          </Button>
        ) : (
          <Button onClick={handleApprove} disabled={isProcessing || !amount} className="w-full">
            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Approve SCC-USD
          </Button>
        )}
      </CardContent>
    </Card>
  );
};