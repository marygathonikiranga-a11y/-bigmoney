import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import WalletModal from "@/components/dashboard/WalletModal";
import BottomNav from "@/components/dashboard/BottomNav";
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, Clock } from "lucide-react";

const WalletPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, transactions, showWalletModal, setShowWalletModal } = useStore();

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center gap-3 h-14 px-4 border-b border-border/30 bg-card/50 backdrop-blur-xl shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="font-bold text-lg">Wallet</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card p-4 text-center">
            <div className="text-xs text-muted-foreground">Real Balance</div>
            <div className="font-mono text-xl font-bold">${user.realBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
          <div className="glass-card p-4 text-center">
            <div className="text-xs text-muted-foreground">Demo Balance</div>
            <div className="font-mono text-xl font-bold">${user.demoBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={() => setShowWalletModal(true)} className="flex-1 neon-glow">
            <ArrowDownToLine className="h-4 w-4 mr-2" /> Deposit
          </Button>
          <Button variant="outline" onClick={() => setShowWalletModal(true)} className="flex-1 border-border/50">
            <ArrowUpFromLine className="h-4 w-4 mr-2" /> Withdraw
          </Button>
        </div>

        <div className="glass-card p-4">
          <h3 className="font-semibold mb-3 text-sm">Transaction History</h3>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                  <div className="flex items-center gap-2">
                    {tx.type === "deposit" ? <ArrowDownToLine className="h-4 w-4 text-success" /> : <ArrowUpFromLine className="h-4 w-4 text-warning" />}
                    <div>
                      <div className="text-sm font-medium capitalize">{tx.type}</div>
                      <div className="text-xs text-muted-foreground">{new Date(tx.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-semibold">{tx.type === "deposit" ? "+" : "-"}${tx.amount.toFixed(2)}</div>
                    <div className={`text-xs font-medium ${tx.status === "approved" ? "text-success" : tx.status === "pending" ? "text-warning" : "text-muted-foreground"}`}>
                      {tx.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
      {showWalletModal && <WalletModal onClose={() => setShowWalletModal(false)} />}
    </div>
  );
};

export default WalletPage;
