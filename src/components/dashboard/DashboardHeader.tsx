import { useState } from "react";
import { useStore } from "@/store/useStore";
import { BarChart3, LogOut, Menu, ArrowDownCircle, ArrowUpCircle, History, MoreVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PaymentPopup from "@/components/landing/PaymentPopup";

interface DashboardHeaderProps {
  onTradeHistoryClick?: () => void;
}

const DashboardHeader = ({ onTradeHistoryClick }: DashboardHeaderProps) => {
  const { user, logout, switchAccountType, showMarketSidebar, setShowMarketSidebar } = useStore();
  const navigate = useNavigate();
  const [transactionPopupOpen, setTransactionPopupOpen] = useState(false);
  const [transactionTab, setTransactionTab] = useState<"deposit" | "withdraw">("deposit");

  if (!user) return null;

  const balance = user.accountType === "demo" ? user.demoBalance : user.realBalance;

  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border/30 bg-card/50 backdrop-blur-xl shrink-0">
      <div className="flex items-center gap-3">
        <button className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg bg-primary" onClick={() => setShowMarketSidebar(!showMarketSidebar)}>
          <Menu className="h-4 w-4 text-primary-foreground" />
        </button>
        <div className="hidden lg:flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <BarChart3 className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-lg hidden sm:block">TradeX</span>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onTradeHistoryClick}
          className="flex items-center gap-2 text-xs"
        >
          <History className="h-4 w-4" />
          <span>View Trades</span>
        </Button>

        <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1">
          <button
            onClick={() => switchAccountType("demo")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${user.accountType === "demo" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Demo
          </button>
          <button
            onClick={() => switchAccountType("real")}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${user.accountType === "real" ? "bg-success text-success-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            Real
          </button>
        </div>

        <div className="text-right">
          <div className="text-xs text-muted-foreground">{user.accountType === "demo" ? "Demo" : "Real"} Balance</div>
          <div className="font-mono text-sm font-bold text-foreground">${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>

        {user.accountType === "real" && (
          <>
            {/* Desktop: Separate buttons */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Deposit"
              onClick={() => { window.location.href = "/lipa/index.html"; }}
            >
              <ArrowDownCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex h-8 w-8 text-muted-foreground hover:text-foreground"
              title="Withdraw"
              onClick={() => { setTransactionTab("withdraw"); setTransactionPopupOpen(true); }}
            >
              <ArrowUpCircle className="h-4 w-4" />
            </Button>

            {/* Mobile: Dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => {
                    window.location.href = "/lipa/index.html";
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <ArrowDownCircle className="h-4 w-4 text-success" />
                  <span>Deposit</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setTransactionTab("withdraw");
                    setTransactionPopupOpen(true);
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <ArrowUpCircle className="h-4 w-4 text-warning" />
                  <span>Withdraw</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}

        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => { logout(); navigate("/"); }}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
      <PaymentPopup
        isOpen={transactionPopupOpen}
        onOpenChange={setTransactionPopupOpen}
        initialTab={transactionTab}
      />
    </header>
  );
};

export default DashboardHeader;
