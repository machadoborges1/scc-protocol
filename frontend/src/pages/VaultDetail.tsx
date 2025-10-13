import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ArrowDown, ArrowUp, DollarSign } from "lucide-react";

const VaultDetail = () => {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Vault #{id}</h1>
          <p className="text-muted-foreground">Manage your collateralized position</p>
        </div>
        <Badge variant="default" className="text-lg px-4 py-2">
          <TrendingUp className="w-4 h-4 mr-2" />
          Healthy
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Collateral
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.5 ETH</div>
            <p className="text-xs text-muted-foreground mt-1">≈ $23,750</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Debt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$18,450</div>
            <p className="text-xs text-muted-foreground mt-1">SCC-USD</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-success/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Collateralization Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">285%</div>
            <p className="text-xs text-muted-foreground mt-1">Min: 150%</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="deposit" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="deposit">Deposit</TabsTrigger>
          <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
          <TabsTrigger value="mint">Mint</TabsTrigger>
          <TabsTrigger value="burn">Burn</TabsTrigger>
        </TabsList>

        <TabsContent value="deposit">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Deposit Collateral</CardTitle>
              <CardDescription>Add more ETH to your vault</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deposit-amount">Amount (ETH)</Label>
                <Input id="deposit-amount" placeholder="0.0" type="number" />
                <p className="text-sm text-muted-foreground">
                  Available: 5.25 ETH
                </p>
              </div>
              <div className="space-y-2 p-4 bg-secondary rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>New Collateral</span>
                  <span className="font-semibold">17.5 ETH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>New CR</span>
                  <span className="font-semibold text-success">397%</span>
                </div>
              </div>
              <Button className="w-full bg-gradient-primary hover:opacity-90">
                <ArrowDown className="w-4 h-4 mr-2" />
                Deposit Collateral
              </Button>
            </CardContent>
          </Card>
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
