import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ArrowDown, ArrowUp, DollarSign, AlertTriangle, AlertCircle } from "lucide-react";
import { useVault } from "@/hooks/useVault";
import { Skeleton } from "@/components/ui/skeleton";
import { DepositForm } from "@/components/Vault/DepositForm";
import { Address } from "viem";

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
const getVaultStatus = (cr: number): { text: string; variant: "default" | "destructive" | "warning" } => {
  if (cr === Infinity || cr >= 200) return { text: "Healthy", variant: "default" };
  if (cr >= 150) return { text: "Warning", variant: "warning" };
  return { text: "Danger", variant: "destructive" };
};


const VaultDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error, refetch } = useVault(id);

  const vault = data?.vault;
  console.log("Vault data from subgraph:", vault);
  
  
  let cr = 0;
  if (vault) {
    const debtValue = parseFloat(vault.debtValueUSD);
    if (debtValue > 0) {
      cr = parseFloat(vault.collateralizationRatio);
    } else if (parseFloat(vault.collateralValueUSD) > 0) {
      cr = Infinity;
    }
  }

  const status = getVaultStatus(cr);

  const renderSummary = () => {
    if (isLoading) {
      return (
        <>
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-gradient-card shadow-card">
              <CardHeader className="pb-3"><Skeleton className="h-4 w-2/3" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-1/2" /><Skeleton className="h-4 w-1/3 mt-1" /></CardContent>
            </Card>
          ))}
        </>
      )
    }

    if (error || !vault) {
      return (
        <Card className="md:col-span-3 bg-destructive/10 border-destructive/30 text-center py-12">
          <CardHeader className="flex flex-row items-center justify-center text-destructive"><AlertCircle className="h-5 w-5 mr-2"/><CardTitle>Error Loading Vault</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-destructive/80">Could not load vault data. Please check the address and try again.</p></CardContent>
        </Card>
      )
    }

    return (
      <>
        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Collateral</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(vault.collateralAmount)} {vault.collateralToken.symbol}</div>
            <p className="text-xs text-muted-foreground mt-1">≈ {formatCurrency(vault.collateralValueUSD)}</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Debt</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(vault.debtValueUSD)}</div>
            <p className="text-xs text-muted-foreground mt-1">SCC-USD</p>
          </CardContent>
        </Card>
        <Card className={`bg-gradient-card shadow-card border-${status.variant === 'default' ? 'success' : status.variant}/30`}>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">Collateralization Ratio</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold text-${status.variant === 'default' ? 'success' : status.variant}`}>{cr === Infinity ? '∞' : cr.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Min: 150%</p>
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2 break-all">Vault #{id}</h1>
          <p className="text-muted-foreground">Manage your collateralized position</p>
        </div>
        {vault && (
            <Badge variant={status.variant} className="text-lg px-4 py-2">
                {status.variant !== "default" ? <AlertTriangle className="w-4 h-4 mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
                {status.text}
            </Badge>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {renderSummary()}
      </div>

      <Tabs defaultValue="deposit" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="mint">Mint</TabsTrigger>
          <TabsTrigger value="burn">Burn</TabsTrigger>
        </TabsList>

        <TabsContent value="deposit">
          {id ? <DepositForm vaultAddress={id as Address} onSuccessfulDeposit={refetch} /> : <p>Vault ID not found.</p>}
        </TabsContent>

        <TabsContent value="withdraw">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Withdraw Collateral</CardTitle>
              <CardDescription>Remove ETH from your vault</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="withdraw-amount">Amount (ETH)</Label>
                <Input id="withdraw-amount" placeholder="0.0" type="number" />
                <p className="text-sm text-muted-foreground">
                  Max safe withdrawal: 3.8 ETH
                </p>
              </div>
              <div className="space-y-2 p-4 bg-secondary rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>New Collateral</span>
                  <span className="font-semibold">8.7 ETH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>New CR</span>
                  <span className="font-semibold text-warning">197%</span>
                </div>
              </div>
              <Button className="w-full" variant="outline">
                <ArrowUp className="w-4 h-4 mr-2" />
                Withdraw Collateral
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mint">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Mint SCC-USD</CardTitle>
              <CardDescription>Generate stablecoin against your collateral</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mint-amount">Amount (SCC-USD)</Label>
                <Input id="mint-amount" placeholder="0.0" type="number" />
                <p className="text-sm text-muted-foreground">
                  Max mintable: $5,400
                </p>
              </div>
              <div className="space-y-2 p-4 bg-secondary rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>New Debt</span>
                  <span className="font-semibold">$23,850</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>New CR</span>
                  <span className="font-semibold text-success">220%</span>
                </div>
              </div>
              <Button className="w-full bg-gradient-primary hover:opacity-90">
                <DollarSign className="w-4 h-4 mr-2" />
                Mint SCC-USD
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="burn">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Burn SCC-USD</CardTitle>
              <CardDescription>Pay back your debt</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="burn-amount">Amount (SCC-USD)</Label>
                <Input id="burn-amount" placeholder="0.0" type="number" />
                <p className="text-sm text-muted-foreground">
                  Available: 8,234 SCC-USD
                </p>
              </div>
              <div className="space-y-2 p-4 bg-secondary rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>New Debt</span>
                  <span className="font-semibold">$13,450</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>New CR</span>
                  <span className="font-semibold text-success">392%</span>
                </div>
              </div>
              <Button className="w-full" variant="outline">
                <DollarSign className="w-4 h-4 mr-2" />
                Burn SCC-USD
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VaultDetail;
