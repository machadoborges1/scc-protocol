import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowUp, Loader2 } from "lucide-react";
import { useWithdrawCollateral } from '@/hooks/useWithdrawCollateral';
import { Address, formatEther } from 'viem';
import { toast } from 'sonner';

const WITHDRAW_TOAST_ID = "withdraw-toast";

interface WithdrawFormProps {
  vaultAddress: Address;
  collateralAmount: string;
  onSuccessfulWithdraw: () => void;
}

export const WithdrawForm = ({ vaultAddress, collateralAmount, onSuccessfulWithdraw }: WithdrawFormProps) => {
  const [amount, setAmount] = useState('');

  const { withdrawCollateral, isPending, isConfirming, isConfirmed, isError } = useWithdrawCollateral();

  const isProcessing = isPending || isConfirming;

  useEffect(() => {
    if (isConfirmed) {
      toast.success('Withdrawal successful!', { id: WITHDRAW_TOAST_ID });
      setTimeout(() => {
        onSuccessfulWithdraw();
      }, 2000);
      setAmount('');
    }
    if (isError) {
      toast.error('Withdrawal failed', { id: WITHDRAW_TOAST_ID });
    }
  }, [isConfirmed, isError, onSuccessfulWithdraw]);

  const handleWithdraw = () => {
    toast.loading('Requesting withdrawal...', { id: WITHDRAW_TOAST_ID });
    withdrawCollateral(vaultAddress, amount);
  }

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle>Withdraw Collateral</CardTitle>
        <CardDescription>Remove WETH from your vault. Ensure it remains above the minimum collateralization ratio.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="withdraw-amount">Amount (WETH)</Label>
          <Input 
            id="withdraw-amount" 
            placeholder="0.0" 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isProcessing}
          />
          <p className="text-sm text-muted-foreground">
            Deposited: {parseFloat(collateralAmount).toFixed(4)} WETH
          </p>
        </div>
        
        <Button onClick={handleWithdraw} disabled={isProcessing || !amount} className="w-full bg-gradient-primary hover:opacity-90">
          {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowUp className="w-4 h-4 mr-2" />}
          Withdraw Collateral
        </Button>
      </CardContent>
    </Card>
  );
};