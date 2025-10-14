import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, AlertTriangle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useAccount } from "wagmi";
import { useUserSummary, Vault } from "@/hooks/useUserSummary"; // Import the Vault type
import { Skeleton } from "@/components/ui/skeleton";

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

const CreateVaultCard = () => (
    <Card className="bg-gradient-card shadow-card border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors cursor-pointer">
        <CardContent className="flex flex-col items-center justify-center py-12 h-full">
        <Plus className="w-12 h-12 text-primary mb-4" />
        <h3 className="text-lg font-semibold mb-2">Create New Vault</h3>
        <p className="text-sm text-muted-foreground text-center">
            Start a new collateralized position
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
  const { data, isLoading, error } = useUserSummary(address);

  const renderContent = () => {
    if (!isConnected) {
        return <Card className="col-span-full text-center py-12"><CardContent><p className="text-muted-foreground">Please connect your wallet to see your vaults.</p></CardContent></Card>;
    }
    if (isLoading) {
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
    if (!data?.user || data.user.vaults.length === 0) {
        return <Card className="col-span-full text-center py-12"><CardContent><p className="text-muted-foreground">You have no active vaults.</p></CardContent></Card>;
    }

    return data.user.vaults.map((vault) => <VaultCard key={vault.id} vault={vault} />);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Vaults</h1>
          <p className="text-muted-foreground">
            Manage your collateralized debt positions
          </p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90">
          <Plus className="w-4 h-4 mr-2" />
          Create New Vault
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CreateVaultCard />
        {renderContent()}
      </div>
    </div>
  );
};

export default Vaults;
