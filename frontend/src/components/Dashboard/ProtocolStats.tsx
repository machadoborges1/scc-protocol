import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProtocolStats } from "@/hooks/useProtocolStats";
import { TrendingUp, Vault, DollarSign, Gavel, AlertCircle, Users } from "lucide-react";

// Helper function to format large numbers into a readable currency format (e.g., $1.2M)
const formatCurrency = (value: string | number) => {
  const number = Number(value);
  if (isNaN(number)) return "$0.0";

  if (number >= 1_000_000) {
    return `$${(number / 1_000_000).toFixed(1)}M`;
  }
  if (number >= 1_000) {
    return `$${(number / 1_000).toFixed(1)}K`;
  }
  return `$${number.toFixed(2)}`;
};

export const ProtocolStats = () => {
  const { data, isLoading, error } = useProtocolStats();


  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-gradient-card shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-1/2 mb-2" />
              <Skeleton className="h-3 w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="md:col-span-2 lg:col-span-4 bg-destructive/10 border-destructive/30">
            <CardHeader className="flex flex-row items-center text-destructive">
                <AlertCircle className="h-5 w-5 mr-2"/>
                <CardTitle>Error Fetching Protocol Stats</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-destructive/80">Could not connect to the Subgraph. Please ensure the local development environment is running correctly.</p>
            </CardContent>
        </Card>
      </div>
    )
  }

  // After loading and error checks, if data or data.protocol is missing, show a specific message.
  if (!data || !data.protocol) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="md:col-span-2 lg:col-span-4 bg-amber-400/10 border-amber-400/30">
            <CardHeader className="flex flex-row items-center text-amber-500">
                <AlertCircle className="h-5 w-5 mr-2"/>
                <CardTitle>Protocol Data Not Found</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-amber-500/80">The Subgraph is connected, but the core protocol entity was not found. This might mean the protocol has not been fully initialized on-chain yet.</p>
            </CardContent>
        </Card>
      </div>
    )
  }

  const stats = [
    {
      title: "Total Value Locked",
      value: formatCurrency(data.protocol.totalCollateralValueUSD),
      icon: DollarSign,
    },
    {
      title: "Active Vaults",
      value: Number(data.protocol.totalVaults).toLocaleString(),
      icon: Vault,
    },
    {
      title: "Total Debt",
      value: formatCurrency(data.protocol.totalDebtUSD),
      icon: Users, // Using Users icon as a placeholder for debt
    },
    {
      title: "Active Auctions",
      value: Number(data.protocol.activeAuctions).toLocaleString(),
      icon: Gavel,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="bg-gradient-card shadow-card hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {/* Change data is static for now, can be implemented later */}
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1 text-success" />
              Live data
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
