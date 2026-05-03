import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { tickAsset, generateCandlestickData } from "@/lib/marketData";
import { apiUrl } from "@/lib/api";
import TradingChart from "@/components/dashboard/TradingChart";
import MarketSidebar from "@/components/dashboard/MarketSidebar";
import TradePanel from "@/components/dashboard/TradePanel";
import BottomNav from "@/components/dashboard/BottomNav";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import WalletModal from "@/components/dashboard/WalletModal";
import TradeHistoryDrawer from "@/components/dashboard/TradeHistoryDrawer";

const Dashboard = () => {
  const navigate = useNavigate();
  const { isAuthenticated, assets, setAssets, selectedAsset, showWalletModal, setShowWalletModal, user, login } = useStore();
  const [transactions, setTransactions] = useState<Array<{id:string;type:string;amount:number;status:string;created_at:string}>>([]);
  const [tradeHistoryOpen, setTradeHistoryOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { navigate("/login"); return; }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated || !user?.username) return;

    const fetchUser = async () => {
      try {
        const res = await fetch(apiUrl(`/api/user/by-username/${encodeURIComponent(user.username)}`));
        if (!res.ok) return;
        const data = await res.json();
        login(data.user);
      } catch (error) {
        console.error('Unable to refresh user data', error);
      }
    };

    fetchUser();
    const interval = setInterval(fetchUser, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user?.username, login]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const fetchTransactions = async () => {
      try {
        const res = await fetch(apiUrl(`/api/user/by-id/${user.id}/transactions`));
        if (!res.ok) return;
        const data = await res.json();
        setTransactions(data.transactions || []);
      } catch (error) {
        console.error('Unable to fetch transaction status', error);
      }
    };

    fetchTransactions();
    const interval = setInterval(fetchTransactions, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    const iv = setInterval(() => setAssets(assets.map(tickAsset)), 1000);
    return () => clearInterval(iv);
  }, [assets, setAssets]);

  const currentAsset = useMemo(() => assets.find((a) => a.symbol === selectedAsset), [assets, selectedAsset]);
  const chartData = useMemo(() => generateCandlestickData(currentAsset?.price || 1000), [selectedAsset]);

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <DashboardHeader onTradeHistoryClick={() => setTradeHistoryOpen(true)} />
      {transactions.length > 0 && (
        <div className="px-4 py-3 bg-card/70 border-b border-border/30 text-sm text-foreground">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              Latest transaction: <span className="font-semibold capitalize">{transactions[0].type}</span> of <span className="font-mono">${transactions[0].amount.toFixed(2)}</span>
            </div>
            <div className={`font-semibold ${transactions[0].status === 'approved' ? 'text-success' : 'text-warning'}`}>
              {transactions[0].status}
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <MarketSidebar />
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <TradingChart data={chartData} asset={currentAsset!} />
          <TradePanel asset={currentAsset!} />
        </div>
      </div>
      <BottomNav />
      {showWalletModal && <WalletModal onClose={() => setShowWalletModal(false)} />}
      <TradeHistoryDrawer isOpen={tradeHistoryOpen} onClose={() => setTradeHistoryOpen(false)} />
    </div>
  );
};

export default Dashboard;
