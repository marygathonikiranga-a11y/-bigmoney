import { useState } from "react";
import { useStore } from "@/store/useStore";
import { MarketAsset } from "@/lib/marketData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const durations = [
  { label: "30s", value: 30 },
  { label: "1m", value: 60 },
  { label: "5m", value: 300 },
  { label: "15m", value: 900 },
  { label: "1h", value: 3600 },
];

interface Props {
  asset: MarketAsset;
}

const TradePanel = ({ asset }: Props) => {
  const { user, addTrade } = useStore();
  const [amount, setAmount] = useState("100");
  const [duration, setDuration] = useState(60);
  const { toast } = useToast();

  if (!asset || !user) return null;

  const balance = user.accountType === "demo" ? user.demoBalance : user.realBalance;

  const executeTrade = (type: "buy" | "sell") => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { toast({ title: "Invalid amount", variant: "destructive" }); return; }
    if (amt > balance) { toast({ title: "Insufficient funds", description: `Balance: $${balance.toFixed(2)}`, variant: "destructive" }); return; }

    const trade = {
      id: crypto.randomUUID(),
      asset: asset.symbol,
      type,
      amount: amt,
      entryPrice: asset.price,
      status: "open" as const,
      duration,
      timestamp: Date.now(),
      accountType: user.accountType,
    };

    addTrade(trade);
    toast({ title: `${type.toUpperCase()} order placed`, description: `${asset.symbol} @ ${asset.price}` });
  };

  return (
    <div className="border-t border-border/30 bg-card/30 backdrop-blur-sm px-4 py-3 shrink-0">
      <div className="flex items-center gap-4 max-w-3xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Amount ($)</span>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-28 h-8 text-sm bg-muted/30 border-border/30 font-mono"
          />
        </div>

        <div className="flex items-center gap-1">
          {durations.map((d) => (
            <button
              key={d.value}
              onClick={() => setDuration(d.value)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${duration === d.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/50"}`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          <Button onClick={() => executeTrade("buy")} className="trade-btn-buy h-9 px-6">
            ▲ BUY
          </Button>
          <Button onClick={() => executeTrade("sell")} className="trade-btn-sell h-9 px-6">
            ▼ SELL
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TradePanel;
