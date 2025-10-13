import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gavel, TrendingDown, Clock } from "lucide-react";

const mockAuctions = [
  { id: "1", vault: "Vault #4521", collateral: "8.5 ETH", debt: "$12,340", currentPrice: "$1,420", timeLeft: "2h 34m", discount: "12%" },
  { id: "2", vault: "Vault #7823", collateral: "5.2 ETH", debt: "$7,890", currentPrice: "$1,460", timeLeft: "5h 12m", discount: "8%" },
  { id: "3", vault: "Vault #2341", collateral: "12.0 ETH", debt: "$18,230", currentPrice: "$1,480", timeLeft: "7h 45m", discount: "5%" },
];

const Auctions = () => {
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
        {mockAuctions.map((auction) => (
          <Card key={auction.id} className="bg-gradient-card shadow-card">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{auction.vault}</CardTitle>
                  <CardDescription className="mt-1">
                    Collateral: {auction.collateral} • Debt: {auction.debt}
                  </CardDescription>
                </div>
                <Badge variant="destructive" className="text-base px-3 py-1">
                  <TrendingDown className="w-4 h-4 mr-1" />
                  {auction.discount} discount
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-secondary rounded-lg">
                    <span className="text-sm text-muted-foreground">Current Price per ETH</span>
                    <span className="font-bold text-lg">{auction.currentPrice}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-secondary rounded-lg">
                    <span className="text-sm text-muted-foreground">Time Remaining</span>
                    <span className="font-bold text-lg flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {auction.timeLeft}
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

      {mockAuctions.length === 0 && (
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
