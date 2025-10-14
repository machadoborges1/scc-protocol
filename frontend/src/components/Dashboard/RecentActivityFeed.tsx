import { useRecentActivities } from "@/hooks/useRecentActivities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle } from "lucide-react";

// Helper function to format time since event
const timeSince = (timestamp: string): string => {
  const seconds = Math.floor(Date.now() / 1000 - parseInt(timestamp));
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return Math.floor(seconds) + " seconds ago";
};

// Helper function to format activity details
const formatActivity = (activity: any) => {
  const formatted = {
    action: "Unknown Action",
    vault: `Vault #${activity.vault.id.slice(0, 6)}...`,
    amount: `${parseFloat(activity.amount).toFixed(2)}`,
  };

  switch (activity.type) {
    case "DEPOSIT":
      formatted.action = "Deposited collateral";
      formatted.amount += " WETH";
      break;
    case "WITHDRAW":
      formatted.action = "Withdrew collateral";
      formatted.amount += " WETH";
      break;
    case "MINT":
      formatted.action = "Minted SCC-USD";
      formatted.amount += " SCC-USD";
      break;
    case "BURN":
      formatted.action = "Burned SCC-USD";
      formatted.amount += " SCC-USD";
      break;
  }
  return formatted;
};

export const RecentActivityFeed = () => {
  const { data, isLoading, error } = useRecentActivities();

  if (isLoading) {
    return (
      <Card className="bg-gradient-card shadow-card">
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-gradient-card shadow-card text-destructive border-destructive/50">
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <AlertTriangle className="w-8 h-8 mr-4" />
          <p>Failed to load recent activity.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-card shadow-card">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data && data.vaultUpdates.length > 0 ? (
            data.vaultUpdates.map((activity) => {
              const formatted = formatActivity(activity);
              return (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{formatted.action}</p>
                    <p className="text-sm text-muted-foreground">{formatted.vault}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatted.amount}</p>
                    <p className="text-xs text-muted-foreground">{timeSince(activity.timestamp)}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No recent activity found.</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
