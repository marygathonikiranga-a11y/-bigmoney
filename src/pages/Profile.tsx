import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/dashboard/BottomNav";
import { ArrowLeft, User, Phone, Calendar, Shield, TrendingUp, TrendingDown } from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, trades, transactions } = useStore();

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  const totalPnL = trades.filter((t) => t.status === "closed").reduce((sum, t) => sum + (t.pnl || 0), 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center gap-3 h-14 px-4 border-b border-border/30 bg-card/50 backdrop-blur-xl shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="font-bold text-lg">Profile</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        <div className="glass-card p-6 text-center">
          <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <User className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-bold text-lg">{user.fullName}</h2>
          <p className="text-sm text-muted-foreground">@{user.username}</p>
          <div className="inline-flex mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize">{user.accountType} Account</div>
        </div>

        <div className="glass-card p-4 space-y-3">
          <h3 className="font-semibold text-sm">Account Info</h3>
          {[
            { icon: Phone, label: "Phone", value: user.phone },
            { icon: Calendar, label: "Date of Birth", value: new Date(user.dateOfBirth).toLocaleDateString() },
            { icon: User, label: "Age", value: `${user.age} years` },
            { icon: Shield, label: "Account Type", value: user.accountType.toUpperCase() },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4" /> <span className="text-sm">{label}</span>
              </div>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-3 text-center">
            <div className="text-xs text-muted-foreground">Total Trades</div>
            <div className="text-lg font-bold">{trades.length}</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-xs text-muted-foreground">Total P&L</div>
            <div className={`text-lg font-bold font-mono ${totalPnL >= 0 ? "price-up" : "price-down"}`}>${totalPnL.toFixed(2)}</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-xs text-muted-foreground">Transactions</div>
            <div className="text-lg font-bold">{transactions.length}</div>
          </div>
        </div>

        {trades.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="font-semibold text-sm mb-3">Recent Trades</h3>
            <div className="space-y-2">
              {trades.slice(0, 10).map((trade) => (
                <div key={trade.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                  <div className="flex items-center gap-2">
                    {trade.type === "buy" ? <TrendingUp className="h-4 w-4 text-success" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
                    <div>
                      <div className="text-sm font-medium">{trade.asset}</div>
                      <div className="text-xs text-muted-foreground capitalize">{trade.type} · {trade.status}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm">${trade.amount.toFixed(2)}</div>
                    {trade.pnl !== undefined && (
                      <div className={`text-xs font-medium ${trade.pnl >= 0 ? "price-up" : "price-down"}`}>
                        {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;
