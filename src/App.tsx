import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import WalletPage from "./pages/Wallet";
import Profile from "./pages/Profile";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";
import WalletModal from "@/components/dashboard/WalletModal";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();
  const login = useStore((s) => s.login);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const updateBalance = useStore((s) => s.updateBalance);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletModalTab, setWalletModalTab] = useState<"deposit" | "withdraw">("deposit");

  useEffect(() => {
    const savedState = localStorage.getItem('appState');
    if (savedState) {
      const state = JSON.parse(savedState);
      if (state.user && state.isAuthenticated) {
        login(state.user);
      }
    }
  }, [login]);

  useEffect(() => {
    const depositAmount = localStorage.getItem("mpesaDepositAmount");
    if (!depositAmount) return;
    const amount = parseFloat(depositAmount);
    if (!isNaN(amount) && amount > 0) {
      updateBalance("real", amount);
    }
    localStorage.removeItem("mpesaDepositAmount");
  }, [location.pathname, updateBalance]);

  const showWalletButtons = location.pathname === "/dashboard" || location.hash.startsWith("#/dashboard");

  return (
    <>
      {showWalletButtons && (
        <div className="fixed top-4 z-50 hidden sm:flex gap-2" style={{ left: "calc(50% - 4cm)" }}>
          <Button
            size="sm"
            className="w-28 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => {
              window.location.href = "/lipa/index.html";
            }}
          >
            Deposit
          </Button>
          <Button
            size="sm"
            className="w-28 bg-secondary text-secondary-foreground hover:bg-secondary/90"
            onClick={() => {
              setWalletModalTab("withdraw");
              setWalletModalOpen(true);
            }}
          >
            Withdraw
          </Button>
        </div>
      )}
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {walletModalOpen && <WalletModal onClose={() => setWalletModalOpen(false)} initialTab={walletModalTab} />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <AppContent />
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
