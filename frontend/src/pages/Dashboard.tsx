import { ProtocolStats } from "@/components/Dashboard/ProtocolStats";
import { UserSummary } from "@/components/Dashboard/UserSummary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, TrendingUp } from "lucide-react";
import { AreaChart, Area, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis } from "recharts";
import { RecentActivityFeed } from "@/components/Dashboard/RecentActivityFeed";
import { useAccount } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";

const tvlData = [
  { date: "Jan", value: 85 },
  { date: "Feb", value: 92 },
  { date: "Mar", value: 98 },
  { date: "Apr", value: 105 },
  { date: "May", value: 115 },
  { date: "Jun", value: 125 },
];

const collateralData = [
  { date: "Jan", ratio: 175 },
  { date: "Feb", ratio: 168 },
  { date: "Mar", ratio: 172 },
  { date: "Apr", ratio: 180 },
  { date: "May", ratio: 165 },
  { date: "Jun", ratio: 170 },
];

const Dashboard = () => {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of the SCC Protocol and your positions
        </p>
      </div>

      <ProtocolStats />

      {!isConnected && openConnectModal && (
        <Card className="bg-gradient-card shadow-card border-accent/20">
          <CardHeader>
            <CardTitle className="flex items-center text-accent">
              <AlertCircle className="w-5 h-5 mr-2" />
              Getting Started
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm mb-4">
              Connect your wallet to start managing vaults, staking SCC-GOV tokens, and participating in governance.
            </p>
            <div className="flex gap-3">
              <Button
                className="bg-gradient-primary hover:opacity-90"
                onClick={openConnectModal}
              >
                Connect Wallet
              </Button>
              <Button variant="outline">
                Learn More
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <UserSummary />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-accent" />
              Total Value Locked (TVL)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={tvlData}>
                <defs>
                  <linearGradient id="colorTVL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                  formatter={(value: number) => [`$${value}M`, "TVL"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--accent))" 
                  strokeWidth={2}
                  fill="url(#colorTVL)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-accent" />
              Average Collateralization Ratio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={collateralData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                  formatter={(value: number) => [`${value}%`, "CR"]}
                />
                <Line 
                  type="monotone" 
                  dataKey="ratio" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <RecentActivityFeed />
    </div>
  );
};

export default Dashboard;
