import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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
import DepositModal from "@/components/dashboard/DepositModal";
import PaymentPopup from "@/components/landing/PaymentPopup";

const queryClient = new QueryClient();

const AppContent = () => {
  const login = useStore((s) => s.login);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletModalTab, setWalletModalTab] = useState<"deposit" | "withdraw">("deposit");
  const [transactionPopupOpen, setTransactionPopupOpen] = useState(false);
  const [transactionTab, setTransactionTab] = useState<"deposit" | "withdraw">("deposit");
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [depositStep, setDepositStep] = useState<"phone" | "amount" | "countdown" | "success">("phone");
  const [depositPhone, setDepositPhone] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [countdown, setCountdown] = useState(30);
  const [isCounting, setIsCounting] = useState(false);

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
    if (isCounting && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isCounting) {
      setDepositStep("success");
      setIsCounting(false);
    }
  }, [countdown, isCounting]);

  return (
    <>
      <div className="fixed top-4 z-50 flex gap-2" style={{ left: "calc(50% - 4cm)" }}>
        <Button
          size="sm"
          className="w-28 bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => {
            setDepositStep("phone");
            setDepositPhone("");
            setDepositAmount("");
            setDepositModalOpen(true);
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
      {depositModalOpen && (
        <DepositModal
          step={depositStep}
          phone={depositPhone}
          amount={depositAmount}
          countdown={countdown}
          isCounting={isCounting}
          onPhoneChange={setDepositPhone}
          onAmountChange={setDepositAmount}
          onNext={() => setDepositStep("amount")}
          onRecharge={() => {
            setDepositStep("countdown");
            setIsCounting(true);
          }}
          onClose={() => setDepositModalOpen(false)}
        />
      )}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
