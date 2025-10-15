import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowDown, Loader2 } from "lucide-react";
import { useAccount } from 'wagmi';
import { useBalance } from 'wagmi';
import { useWethAllowance } from '@/hooks/useWethAllowance';
import { useApprove } from '@/hooks/useApprove';
import { useDepositCollateral } from '@/hooks/useDepositCollateral';
import { Address, parseEther, formatEther } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const wethAddress = import.meta.env.VITE_WETH_ADDRESS as Address;
const DEPOSIT_TOAST_ID = "deposit-toast";

interface DepositFormProps {
  vaultAddress: Address;
  onSuccessfulDeposit: () => void; // Callback to refetch vault data
}

export const DepositForm = ({ vaultAddress, onSuccessfulDeposit }: DepositFormProps) => {
  const [amount, setAmount] = useState('');
  const { address: userAddress } = useAccount();
  const queryClient = useQueryClient();

  // Data-fetching hooks
  const { data: wethBalance } = useBalance({ address: userAddress, token: wethAddress });
  const { data: allowance, refetch: refetchAllowance } = useWethAllowance(userAddress, vaultAddress);

  // Transaction hooks
  const { approve, isPending: isApproving, isConfirmed: isApprovalConfirmed, isError: isApprovalError } = useApprove();
  const { depositCollateral, isPending: isDepositing, isConfirmed: isDepositConfirmed, isError: isDepositError } = useDepositCollateral();

  const amountAsBigInt = amount ? parseEther(amount) : BigInt(0);
  const hasEnoughAllowance = allowance && allowance >= amountAsBigInt;
  const isProcessing = isApproving || isDepositing;

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

  // Effect for deposit transaction
  useEffect(() => {
    if (isDepositConfirmed) {
      toast.success('Deposit successful!', { id: DEPOSIT_TOAST_ID });
      // Wait 2 seconds for the subgraph and node to sync
      setTimeout(() => {
        onSuccessfulDeposit(); // Refetches vault data from subgraph
        refetchAllowance();   // Refetches allowance
        queryClient.invalidateQueries({ queryKey: ['balance'] }); // Refetches all balances for the user
      }, 2000);
      setAmount(''); // Reset form
    }
    if (isDepositError) {
      toast.error('Deposit failed', { id: DEPOSIT_TOAST_ID });
    }
  }, [isDepositConfirmed, isDepositError, onSuccessfulDeposit, refetchAllowance, queryClient]);

  const handleApprove = () => {
    toast.loading('Requesting approval...', { id: 'approve-toast' });
    approve(vaultAddress, amount);
  }

  const handleDeposit = () => {
    toast.loading('Requesting deposit...', { id: DEPOSIT_TOAST_ID });
    depositCollateral(vaultAddress, amount);
  }

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle>Deposit Collateral</CardTitle>
        <CardDescription>Add more WETH to your vault. You may need to approve first.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="deposit-amount">Amount (WETH)</Label>
          <Input 
            id="deposit-amount" 
            placeholder="0.0" 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isProcessing}
          />
          <p className="text-sm text-muted-foreground">
            Available: {wethBalance ? formatEther(wethBalance.value) : '0.00'} WETH
          </p>
        </div>
        
        {hasEnoughAllowance ? (
          <Button onClick={handleDeposit} disabled={isProcessing || !amount} className="w-full bg-gradient-primary hover:opacity-90">
            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowDown className="w-4 h-4 mr-2" />}
            Deposit Collateral
          </Button>
        ) : (
          <Button onClick={handleApprove} disabled={isProcessing || !amount} className="w-full">
            {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Approve WETH
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
