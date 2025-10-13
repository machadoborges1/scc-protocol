import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Vote, CheckCircle, XCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";

const mockProposals = [
  {
    id: "1",
    title: "Adjust Minimum Collateralization Ratio to 140%",
    status: "active",
    votesFor: "1,234,567",
    votesAgainst: "234,123",
    timeLeft: "3 days",
  },
  {
    id: "2",
    title: "Implement New Fee Structure for Liquidations",
    status: "active",
    votesFor: "987,234",
    votesAgainst: "456,789",
    timeLeft: "5 days",
  },
  {
    id: "3",
    title: "Add WBTC as Collateral Type",
    status: "passed",
    votesFor: "2,345,678",
    votesAgainst: "123,456",
    timeLeft: "Ended",
  },
];

const Governance = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Governance</h1>
        <p className="text-muted-foreground">
          Vote on protocol proposals with your SCC-GOV tokens
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Your Voting Power
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5,000 SCC-GOV</div>
            <p className="text-xs text-muted-foreground mt-1">0.05% of total supply</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Proposals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting your vote</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Proposals Voted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground mt-1">Total participation</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-card shadow-card border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center text-accent">
            <Vote className="w-5 h-5 mr-2" />
            Delegate Your Voting Power
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4">
            Haven't delegated yet? Delegate your voting power to yourself or another address to participate in governance.
          </p>
          <Button className="bg-gradient-primary hover:opacity-90">
            Delegate Voting Power
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {mockProposals.map((proposal) => (
          <Link key={proposal.id} to={`/governance/${proposal.id}`}>
            <Card className="bg-gradient-card shadow-card hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge
                        variant={
                          proposal.status === "active"
                            ? "default"
                            : proposal.status === "passed"
                            ? "default"
                            : "destructive"
                        }
                        className={
                          proposal.status === "passed"
                            ? "bg-success text-success-foreground"
                            : ""
                        }
                      >
                        {proposal.status === "active" && <Clock className="w-3 h-3 mr-1" />}
                        {proposal.status === "passed" && <CheckCircle className="w-3 h-3 mr-1" />}
                        {proposal.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {proposal.timeLeft}
                      </span>
                    </div>
                    <CardTitle className="text-xl mb-2">{proposal.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-success flex items-center">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        For: {proposal.votesFor}
                      </span>
                      <span className="text-destructive flex items-center">
                        <XCircle className="w-4 h-4 mr-1" />
                        Against: {proposal.votesAgainst}
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-success h-2 rounded-full"
                        style={{
                          width: `${
                            (parseInt(proposal.votesFor.replace(/,/g, "")) /
                              (parseInt(proposal.votesFor.replace(/,/g, "")) +
                                parseInt(proposal.votesAgainst.replace(/,/g, "")))) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                  {proposal.status === "active" && (
                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Vote For
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <XCircle className="w-4 h-4 mr-1" />
                        Vote Against
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Governance;
