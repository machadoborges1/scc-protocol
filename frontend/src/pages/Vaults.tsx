import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const mockVaults = [
  { id: "1234", collateral: "12.5 ETH", debt: "$18,450", cr: "285%", status: "healthy" },
  { id: "5678", collateral: "8.2 ETH", debt: "$9,823", cr: "350%", status: "healthy" },
  { id: "9012", collateral: "5.0 ETH", debt: "$7,200", cr: "185%", status: "warning" },
];

const Vaults = () => {
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
        <Card className="bg-gradient-card shadow-card border-2 border-dashed border-primary/30 hover:border-primary/60 transition-colors cursor-pointer">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plus className="w-12 h-12 text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Create New Vault</h3>
            <p className="text-sm text-muted-foreground text-center">
              Start a new collateralized position
            </p>
          </CardContent>
        </Card>

        {mockVaults.map((vault) => (
          <Link key={vault.id} to={`/vaults/${vault.id}`}>
            <Card className="bg-gradient-card shadow-card hover:shadow-lg transition-all h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Vault #{vault.id}</CardTitle>
                  <Badge variant={vault.status === "healthy" ? "default" : "destructive"}>
                    {vault.status === "healthy" ? (
                      <TrendingUp className="w-3 h-3 mr-1" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 mr-1" />
                    )}
                    {vault.status}
                  </Badge>
                </div>
                <CardDescription>Collateralization Ratio: {vault.cr}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Collateral</span>
                  <span className="font-semibold">{vault.collateral}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Debt</span>
                  <span className="font-semibold">{vault.debt}</span>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Manage Vault
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Vaults;
