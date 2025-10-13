import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Coins, Gift } from "lucide-react";

const Staking = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Staking</h1>
        <p className="text-muted-foreground">
          Stake SCC-GOV to earn protocol revenue and governance rights
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Your Staked Amount
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5,000 SCC-GOV</div>
            <p className="text-xs text-muted-foreground mt-1">≈ $7,500</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-success/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current APY
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">12.8%</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="w-3 h-3 inline mr-1" />
              +0.5% this week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card border-accent/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unclaimed Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">245.5 SCC-GOV</div>
            <p className="text-xs text-muted-foreground mt-1">≈ $368.25</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Gift className="w-5 h-5 mr-2 text-accent" />
            Claim Rewards
          </CardTitle>
          <CardDescription>
            Rewards are earned continuously and can be claimed anytime
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <p className="text-3xl font-bold text-accent mb-2">245.5 SCC-GOV</p>
              <p className="text-sm text-muted-foreground">Available to claim now</p>
            </div>
            <Button className="bg-gradient-primary hover:opacity-90" size="lg">
              Claim Rewards
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="stake" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stake">Stake</TabsTrigger>
          <TabsTrigger value="unstake">Unstake</TabsTrigger>
        </TabsList>

        <TabsContent value="stake">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Stake SCC-GOV</CardTitle>
              <CardDescription>Lock your tokens to earn rewards and governance rights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stake-amount">Amount (SCC-GOV)</Label>
                <Input id="stake-amount" placeholder="0.0" type="number" />
                <p className="text-sm text-muted-foreground">
                  Available: 12,450 SCC-GOV
                </p>
              </div>
              <div className="space-y-2 p-4 bg-secondary rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>New Staked Balance</span>
                  <span className="font-semibold">17,450 SCC-GOV</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Estimated Annual Rewards</span>
                  <span className="font-semibold text-success">2,233.6 SCC-GOV</span>
                </div>
              </div>
              <Button className="w-full bg-gradient-primary hover:opacity-90">
                <Coins className="w-4 h-4 mr-2" />
                Stake Tokens
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unstake">
          <Card className="bg-gradient-card shadow-card">
            <CardHeader>
              <CardTitle>Unstake SCC-GOV</CardTitle>
              <CardDescription>Withdraw your staked tokens</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="unstake-amount">Amount (SCC-GOV)</Label>
                <Input id="unstake-amount" placeholder="0.0" type="number" />
                <p className="text-sm text-muted-foreground">
                  Staked: 5,000 SCC-GOV
                </p>
              </div>
              <div className="space-y-2 p-4 bg-secondary rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Remaining Staked</span>
                  <span className="font-semibold">0 SCC-GOV</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Future Annual Rewards</span>
                  <span className="font-semibold">0 SCC-GOV</span>
                </div>
              </div>
              <Button className="w-full" variant="outline">
                <Coins className="w-4 h-4 mr-2" />
                Unstake Tokens
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Staking;
