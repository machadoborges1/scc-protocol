import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

export const UserSummary = () => {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>My Vaults</CardTitle>
          <CardDescription>Manage your collateralized positions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Total Collateral</p>
              <p className="text-2xl font-bold">12.5 ETH</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Debt</p>
              <p className="text-2xl font-bold">$18,450</p>
            </div>
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Collateralization Ratio</p>
              <p className="text-xl font-bold text-success">285%</p>
            </div>
            <Link to="/vaults">
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle>Staking Position</CardTitle>
          <CardDescription>Your SCC-GOV staking rewards</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">Staked Amount</p>
              <p className="text-2xl font-bold">5,000 SCC-GOV</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">APY</p>
              <p className="text-2xl font-bold text-success">12.8%</p>
            </div>
          </div>
          <div className="flex justify-between items-center pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Unclaimed Rewards</p>
              <p className="text-xl font-bold">245.5 SCC-GOV</p>
            </div>
            <Link to="/staking">
              <Button variant="outline" size="sm">
                <TrendingUp className="w-4 h-4 mr-1" />
                Claim
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
