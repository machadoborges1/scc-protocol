import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Coins, TrendingUp, Users, Lock, Zap } from "lucide-react";

const Landing = () => {
  const features = [
    {
      icon: Shield,
      title: "Collateralized Vaults",
      description: "Create vaults with ETH collateral to mint SCC-USD stablecoin with full transparency and security."
    },
    {
      icon: Coins,
      title: "Staking Rewards",
      description: "Stake SCC-GOV tokens to earn protocol revenue and participate in ecosystem governance."
    },
    {
      icon: TrendingUp,
      title: "Dutch Auctions",
      description: "Participate in liquidation auctions with declining prices for optimal capital efficiency."
    },
    {
      icon: Users,
      title: "On-chain Governance",
      description: "Vote on protocol proposals and shape the future of the SCC ecosystem."
    },
    {
      icon: Lock,
      title: "Decentralized Security",
      description: "Built on Ethereum with audited smart contracts and transparent operations."
    },
    {
      icon: Zap,
      title: "Capital Efficiency",
      description: "Optimized collateralization ratios and instant liquidity for your assets."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-background -z-10" />
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              SCC Protocol
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Decentralized collateralized debt positions with staking, governance, and automated liquidations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
              <Link to="/dashboard">
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 text-lg px-8">
                  Launch App
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Read Documentation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: "Total Value Locked", value: "$125M" },
              { label: "Active Vaults", value: "2,847" },
              { label: "SCC-GOV Staked", value: "45.2%" }
            ].map((stat, i) => (
              <Card key={i} className="bg-gradient-card shadow-card border-accent/20">
                <CardContent className="pt-6 text-center">
                  <p className="text-4xl font-bold text-accent mb-2">{stat.value}</p>
                  <p className="text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Protocol Features</h2>
            <p className="text-xl text-muted-foreground">
              Everything you need for decentralized collateralized lending
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={i} className="bg-gradient-card shadow-card hover:shadow-glow transition-all duration-300 border-accent/20">
                <CardContent className="pt-6">
                  <feature.icon className="w-12 h-12 text-accent mb-4" />
                  <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-primary shadow-glow border-0">
            <CardContent className="pt-12 pb-12 text-center">
              <h2 className="text-4xl font-bold mb-4 text-primary-foreground">
                Ready to Get Started?
              </h2>
              <p className="text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
                Connect your wallet and start managing your collateralized positions today
              </p>
              <Link to="/dashboard">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Launch Dashboard
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Landing;
