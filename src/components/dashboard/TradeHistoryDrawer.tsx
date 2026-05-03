import { useState, useEffect, useMemo } from "react";
import { useStore } from "@/store/useStore";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, Search, TrendingUp, TrendingDown } from "lucide-react";

interface MockTrade {
  id: string;
  asset: string;
  type: "buy" | "sell";
  entryPrice: number;
  quantity: number;
  currentPrice: number;
  timestamp: number;
  status: "open" | "closed" | "expired";
}

interface TradeHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const TradeHistoryDrawer = ({ isOpen, onClose }: TradeHistoryDrawerProps) => {
  const { trades, closeTrade, assets } = useStore();
  const { toast } = useToast();
  const [localTrades, setLocalTrades] = useState<MockTrade[]>([
    {
      id: "1",
      asset: "BTC/USD",
      type: "buy",
      entryPrice: 65000,
      quantity: 0.5,
      currentPrice: 67234.5,
      timestamp: Date.now() - 3600000,
      status: "open",
    },
    {
      id: "2",
      asset: "EUR/USD",
      type: "sell",
      entryPrice: 1.09,
      quantity: 1000,
      currentPrice: 1.0856,
      timestamp: Date.now() - 7200000,
      status: "open",
    },
    {
      id: "3",
      asset: "US500",
      type: "buy",
      entryPrice: 5200,
      quantity: 1,
      currentPrice: 5234.18,
      timestamp: Date.now() - 10800000,
      status: "open",
    },
    {
      id: "4",
      asset: "ETH/USD",
      type: "buy",
      entryPrice: 3400,
      quantity: 2,
      currentPrice: 3456.78,
      timestamp: Date.now() - 14400000,
      status: "closed",
    },
  ]);

  const [filter, setFilter] = useState<"all" | "buy" | "sell" | "profit" | "loss">("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Update current prices from live market data
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setLocalTrades((prevTrades) =>
        prevTrades.map((trade) => {
          const assetData = assets.find((a) => a.symbol === trade.asset);
          return assetData ? { ...trade, currentPrice: assetData.price } : trade;
        })
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, assets]);

  const calculatePnL = (trade: MockTrade) => {
    if (trade.type === "buy") {
      return (trade.currentPrice - trade.entryPrice) * trade.quantity;
    } else {
      return (trade.entryPrice - trade.currentPrice) * trade.quantity;
    }
  };

  const calculatePnLPercent = (trade: MockTrade) => {
    if (trade.type === "buy") {
      return ((trade.currentPrice - trade.entryPrice) / trade.entryPrice) * 100;
    } else {
      return ((trade.entryPrice - trade.currentPrice) / trade.entryPrice) * 100;
    }
  };

  const mappedStoreTrades = trades.map((trade) => {
    const assetData = assets.find((a) => a.symbol === trade.asset);
    const currentPrice = assetData?.price ?? trade.entryPrice;
    const quantity = trade.entryPrice > 0 ? trade.amount / trade.entryPrice : trade.amount;
    return {
      ...trade,
      currentPrice,
      quantity,
      status: trade.status,
    } as MockTrade;
  });

  const activeTrades = mappedStoreTrades.length > 0 ? mappedStoreTrades : localTrades;

  const filteredTrades = useMemo(() => {
    return activeTrades.filter((trade) => {
      const matchesSearch = trade.asset.toLowerCase().includes(searchTerm.toLowerCase());
      const pnl = calculatePnL(trade);

      if (trade.status !== "open") return false;

      switch (filter) {
        case "buy":
          return trade.type === "buy" && matchesSearch;
        case "sell":
          return trade.type === "sell" && matchesSearch;
        case "profit":
          return pnl > 0 && matchesSearch;
        case "loss":
          return pnl < 0 && matchesSearch;
        default:
          return matchesSearch;
      }
    });
  }, [activeTrades, filter, searchTerm]);

  const openTrades = filteredTrades;
  const totalPnL = useMemo(() => openTrades.reduce((acc, trade) => acc + calculatePnL(trade), 0), [openTrades]);
  const profitableTrades = useMemo(
    () => openTrades.filter((trade) => calculatePnL(trade) > 0).length,
    [openTrades]
  );
  const winRate = useMemo(() => openTrades.length > 0 ? ((profitableTrades / openTrades.length) * 100).toFixed(1) : "0", [openTrades, profitableTrades]);

  const handleCloseTrade = (trade: MockTrade) => {
    if (trades.length > 0) {
      closeTrade(trade.id, trade.currentPrice);
    } else {
      setLocalTrades((prev) => prev.map((item) => item.id === trade.id ? { ...item, status: "closed" } : item));
    }
    const pnl = calculatePnL(trade);
    toast({
      title: "Trade Closed",
      description: `Closed ${trade.asset} for ${pnl >= 0 ? "profit" : "loss"} of $${pnl.toFixed(2)}.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="fixed inset-y-0 right-0 top-0 w-full sm:w-[40%] lg:w-[38%] max-w-[720px] max-h-full rounded-none rounded-l-2xl shadow-2xl border-l border-border/50 p-0 bg-background">
        <DialogHeader className="px-6 pt-4 pb-2 border-b border-border/30">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold">Open Trades</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-destructive/20"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {/* Summary Section */}
          <div className="px-6 py-4 bg-card/40 border-b border-border/20 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground font-medium">Total P/L</div>
                <div className={`text-lg font-bold ${totalPnL >= 0 ? "text-success" : "text-destructive"}`}>
                  {totalPnL >= 0 ? "+" : ""}{totalPnL.toFixed(2)}
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground font-medium">Total Trades</div>
                <div className="text-lg font-bold text-foreground">{openTrades.length}</div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground font-medium">Win Rate</div>
                <div className="text-lg font-bold text-success">{winRate}%</div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by asset..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 bg-muted/50 border-border/50 text-sm"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {(["all", "buy", "sell", "profit", "loss"] as const).map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(f)}
                    className="text-xs capitalize"
                  >
                    {f === "profit" ? "Profitable" : f === "loss" ? "Loss" : f}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Trades List */}
          <div className="px-6 py-4 space-y-2">
            {openTrades.length > 0 ? (
              openTrades.map((trade) => {
                const pnl = calculatePnL(trade);
                const pnlPercent = calculatePnLPercent(trade);
                const isProfit = pnl >= 0;

                return (
                  <div key={trade.id} className="bg-card/50 hover:bg-card/70 border border-border/30 rounded-lg p-3 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3 flex-1">
                        <div
                          className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                            trade.type === "buy" ? "bg-success/20" : "bg-warning/20"
                          }`}
                        >
                          {trade.type === "buy" ? (
                            <TrendingUp className="h-5 w-5 text-success" />
                          ) : (
                            <TrendingDown className="h-5 w-5 text-warning" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{trade.asset}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {trade.type} • {trade.status}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-bold ${isProfit ? "text-success" : "text-destructive"}`}>
                          {isProfit ? "+" : ""}{pnl.toFixed(2)}
                        </div>
                        <div className={`text-xs font-semibold ${isProfit ? "text-success" : "text-destructive"}`}>
                          ({isProfit ? "+" : ""}{pnlPercent.toFixed(2)}%)
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-xs mb-3">
                      <div>
                        <div className="text-muted-foreground">Entry</div>
                        <div className="font-mono font-semibold">${trade.entryPrice.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Current</div>
                        <div className="font-mono font-semibold text-foreground">${(trade.currentPrice ?? trade.entryPrice).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Amount</div>
                        <div className="font-mono font-semibold">${(trade.entryPrice * trade.quantity).toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Time</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(trade.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="text-xs text-muted-foreground">P/L: <span className={`font-semibold ${isProfit ? "text-success" : "text-destructive"}`}>{isProfit ? "+" : ""}${pnl.toFixed(2)}</span></div>
                      <Button size="sm" variant="outline" onClick={() => handleCloseTrade(trade)}>
                        Close
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No trades match your filter</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TradeHistoryDrawer;
