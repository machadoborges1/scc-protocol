import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Vaults from "./pages/Vaults";
import VaultDetail from "./pages/VaultDetail";
import Staking from "./pages/Staking";
import Auctions from "./pages/Auctions";
import Governance from "./pages/Governance";
import NotFound from "./pages/NotFound";

import { WagmiProvider } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";

// TODO: Replace with your own WalletConnect Project ID
const walletConnectProjectId = "c78d3c2f355444b8388c73f563c45d97";

const config = getDefaultConfig({
  appName: "SCC Protocol",
  projectId: walletConnectProjectId,
  chains: [mainnet, sepolia],
  ssr: false, // Important for Vite-based apps
});

const queryClient = new QueryClient();

const App = () => (
  <WagmiProvider config={config}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen bg-background">
              <Header />
              <main className="container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/vaults" element={<Vaults />} />
                  <Route path="/vaults/:id" element={<VaultDetail />} />
                  <Route path="/staking" element={<Staking />} />
                  <Route path="/auctions" element={<Auctions />} />
                  <Route path="/governance" element={<Governance />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
