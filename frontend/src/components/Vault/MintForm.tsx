import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, Loader2 } from "lucide-react";
import { useMintSccUsd } from '@/hooks/useMintSccUsd';
import { Address } from 'viem';
import { toast } from 'sonner';

const MINT_TOAST_ID = "mint-toast";

interface MintFormProps {
  vaultAddress: Address;
  onSuccessfulMint: () => void;
}

export const MintForm = ({ vaultAddress, onSuccessfulMint }: MintFormProps) => {
  const [amount, setAmount] = useState('');

  const { mintSccUsd, isPending, isConfirming, isConfirmed, isError } = useMintSccUsd();

  const isProcessing = isPending || isConfirming;

  useEffect(() => {
    if (isConfirmed) {
      toast.success('SCC-USD minted successfully!', { id: MINT_TOAST_ID });
      setTimeout(() => {
        onSuccessfulMint();
      }, 2000);
      setAmount('');
    }
    if (isError) {
      toast.error('Minting failed', { id: MINT_TOAST_ID });
    }
  }, [isConfirmed, isError, onSuccessfulMint]);

  const handleMint = () => {
    toast.loading('Requesting to mint...', { id: MINT_TOAST_ID });
    mintSccUsd(vaultAddress, amount);
  }

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle>Mint SCC-USD</CardTitle>
        <CardDescription>Generate stablecoin against your collateral.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mint-amount">Amount (SCC-USD)</Label>
          <Input 
            id="mint-amount" 
            placeholder="0.0" 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isProcessing}
          />
          {/* TODO: Add max mintable amount display */}
        </div>
        
        <Button onClick={handleMint} disabled={isProcessing || !amount} className="w-full bg-gradient-primary hover:opacity-90">
          {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <DollarSign className="w-4 h-4 mr-2" />}
          Mint SCC-USD
        </Button>
      </CardContent>
    </Card>
  );
};