import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gavel, TrendingDown, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { useActiveAuctions } from "@/hooks/useActiveAuctions";
import { formatUnits } from "viem";

const Auctions = () => {
  const { data, isLoading, error } = useActiveAuctions();

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Liquidation Auctions</h1>
        <p className="text-muted-foreground">
          Buy collateral from liquidated vaults at discounted prices
        </p>
      </div>

      <Card className="bg-gradient-primary text-primary-foreground shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Gavel className="w-5 h-5 mr-2" />
            How Auctions Work
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm opacity-90">
          <p>• Vaults with CR below 150% are liquidated and put up for auction</p>
          <p>• Collateral price decreases over time (Dutch auction)</p>
          <p>• Buy collateral with SCC-USD to capture the discount</p>
          <p>• Earlier purchases get better discounts</p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {isLoading && (
          <Card className="bg-gradient-card shadow-card flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="ml-4 text-lg">Loading active auctions...</p>
          </Card>
        )}

        {error && (
          <Card className="bg-gradient-card shadow-card flex items-center justify-center py-12 text-destructive border-destructive/50">
            <AlertTriangle className="w-8 h-8 mr-4" />
            <p className="text-lg">Failed to load auctions. Please try again later.</p>
          </Card>
        )}

        {data && data.liquidationAuctions.map((auction) => (
          <Card key={auction.id} className="bg-gradient-card shadow-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">Vault #{formatAddress(auction.vault.id)}</CardTitle>
                  <CardDescription className="mt-1">
                    Collateral: {parseFloat(auction.collateralAmount).toFixed(2)} WETH • Debt: ${parseFloat(auction.debtToCover).toFixed(2)}
                  </CardDescription>
                </div>
                <Badge variant="destructive" className="text-base px-3 py-1">
                  <TrendingDown className="w-4 h-4 mr-1" />
                  {/* TODO: Calculate discount dynamically */}
                  10% discount
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-secondary rounded-lg">
                    <span className="text-sm text-muted-foreground">Current Price per WETH</span>
                    <span className="font-bold text-lg">${parseFloat(auction.startPrice).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-secondary rounded-lg">
                    <span className="text-sm text-muted-foreground">Time Remaining</span>
                    <span className="font-bold text-lg flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {/* TODO: Calculate time remaining dynamically */}
                      23h 59m
                    </span>
                  </div>
                </div>
                <div className="flex flex-col justify-end gap-2">
                  <Button className="bg-gradient-primary hover:opacity-90" size="lg">
                    <Gavel className="w-4 h-4 mr-2" />
                    Buy Collateral
                  </Button>
                  <Button variant="outline">View Details</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data && data.liquidationAuctions.length === 0 && (
        <Card className="bg-gradient-card shadow-card">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gavel className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Active Auctions</h3>
            <p className="text-muted-foreground">
              Check back later for liquidation opportunities
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Auctions;
