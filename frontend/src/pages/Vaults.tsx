import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, AlertTriangle, AlertCircle, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { useUserVaults, UserVault as Vault } from "@/hooks/useUserVaults";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreateVault } from "@/hooks/useCreateVault";
import { useEffect } from "react";
import { toast } from "sonner";

// --- Helper Functions ---

const formatCurrency = (value: number | string) => {
  const number = Number(value);
  if (isNaN(number)) return "$0.00";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(number);
};

const formatNumber = (value: number | string) => {
    const number = Number(value);
    if (isNaN(number)) return "0.00";
    return number.toFixed(2);
}

const shortenAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

const getVaultStatus = (cr: number): { text: string; variant: "default" | "destructive" | "warning" } => {
  if (cr >= 200) return { text: "Healthy", variant: "default" };
  if (cr >= 150) return { text: "Warning", variant: "warning" };
  return { text: "Danger", variant: "destructive" };
};


// --- Sub-Components ---

const VaultCard = ({ vault }: { vault: Vault }) => {
  const cr = parseFloat(vault.collateralizationRatio);
  const status = getVaultStatus(cr);

  return (
    <Link to={`/vaults/${vault.id}`}>
      <Card className="bg-gradient-card shadow-card hover:shadow-lg transition-all h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Vault #{shortenAddress(vault.id)}</CardTitle>
            <Badge variant={status.variant}>
              {status.variant !== "default" ? (
                <AlertTriangle className="w-3 h-3 mr-1" />
              ) : (
                <TrendingUp className="w-3 h-3 mr-1" />
              )}
              {status.text}
            </Badge>
          </div>
          <CardDescription>Collateralization Ratio: {cr.toFixed(0)}%</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Collateral</span>
            <span className="font-semibold">{formatNumber(vault.collateralAmount)} {vault.collateralToken.symbol}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Debt</span>
            <span className="font-semibold">{formatCurrency(vault.debtValueUSD)}</span>
          </div>
          <Button variant="outline" className="w-full mt-4">
            Manage Vault
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
};

const CreateVaultCard = ({ onClick, disabled }: { onClick: () => void; disabled: boolean }) => (
    <Card 
        onClick={!disabled ? onClick : undefined}
        className={`bg-gradient-card shadow-card border-2 border-dashed border-primary/30 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/60 cursor-pointer'}`}>
        <CardContent className="flex flex-col items-center justify-center py-12 h-full">
        {disabled ? <Loader2 className="w-12 h-12 text-primary mb-4 animate-spin" /> : <Plus className="w-12 h-12 text-primary mb-4" />}
        <h3 className="text-lg font-semibold mb-2">Create New Vault</h3>
        <p className="text-sm text-muted-foreground text-center">
            {disabled ? 'Processing...' : 'Start a new collateralized position'}
        </p>
        </CardContent>
    </Card>
);

const VaultsSkeleton = () => (
    <>
        {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-gradient-card shadow-card">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-5 w-20" />
                    </div>
                    <Skeleton className="h-4 w-40 mt-1" />
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex justify-between"><Skeleton className="h-4 w-16" /><Skeleton className="h-4 w-24" /></div>
                    <div className="flex justify-between"><Skeleton className="h-4 w-12" /><Skeleton className="h-4 w-20" /></div>
                    <Skeleton className="h-9 w-full mt-4" />
                </CardContent>
            </Card>
        ))}
    </>
);


// --- Main Component ---

const Vaults = () => {
  const { address, isConnected } = useAccount();
  const { data: vaults, isLoading, error, refetch } = useUserVaults();
  const { createVault, isPending, isConfirming, isConfirmed, hash } = useCreateVault();

  const prevHash = React.useRef(hash);

  useEffect(() => {
    if (isConfirming) {
      toast.loading("Creating vault...", {
        description: "Transaction has been sent. Waiting for confirmation.",
        id: "create-vault",
      });
    }
    if (isConfirmed && hash && hash !== prevHash.current) {
      toast.success("Vault created successfully!", {
        description: `Transaction: ${shortenAddress(hash)}`,
        id: "create-vault",
      });
      
      // Wait 2 seconds for the subgraph to index the new vault
      setTimeout(() => {
        refetch();
      }, 2000);

      prevHash.current = hash;
    }
  }, [isConfirming, isConfirmed, hash, refetch]);

  const handleCreateVault = () => {
    if (!isConnected) {
        toast.error("Please connect your wallet first.");
        return;
    }
    createVault();
  }

  const renderContent = () => {
    if (!isConnected) {
        return <Card className="col-span-full text-center py-12"><CardContent><p className="text-muted-foreground">Please connect your wallet to see your vaults.</p></CardContent></Card>;
    }
    if (isLoading && (!vaults || vaults.length === 0)) {
        return <VaultsSkeleton />;
    }
    if (error) {
        return (
            <Card className="col-span-full bg-destructive/10 border-destructive/30 text-center py-12">
                <CardHeader className="flex flex-row items-center justify-center text-destructive"><AlertCircle className="h-5 w-5 mr-2"/><CardTitle>Error Loading Vaults</CardTitle></CardHeader>
                <CardContent><p className="text-sm text-destructive/80">Could not load your vaults. The subgraph might be unavailable.</p></CardContent>
            </Card>
        );
    }
    if (!vaults || vaults.length === 0) {
        return <Card className="col-span-full text-center py-12"><CardContent><p className="text-muted-foreground">You have no active vaults.</p></CardContent></Card>;
    }

    return vaults.map((vault) => <VaultCard key={vault.id} vault={vault} />);
  }

  const isProcessing = isPending || isConfirming;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Vaults</h1>
          <p className="text-muted-foreground">
            Manage your collateralized debt positions
          </p>
        </div>
        <Button onClick={handleCreateVault} disabled={isProcessing} className="bg-gradient-primary hover:opacity-90">
          {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
          {isProcessing ? 'Processing...' : 'Create New Vault'}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CreateVaultCard onClick={handleCreateVault} disabled={isProcessing} />
        {renderContent()}
      </div>
    </div>
  );
};

export default Vaults;
