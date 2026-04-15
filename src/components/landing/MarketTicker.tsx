import { useStore } from "@/store/useStore";
import { TrendingUp, TrendingDown } from "lucide-react";

const MarketTicker = () => {
  const assets = useStore((s) => s.assets);
  const tickerAssets = [...assets.slice(0, 12), ...assets.slice(0, 12)];

  return (
    <div className="w-full overflow-hidden border-y border-border/30 bg-card/30 backdrop-blur-sm">
      <div className="flex animate-ticker whitespace-nowrap py-2">
        {tickerAssets.map((asset, i) => (
          <div key={`${asset.symbol}-${i}`} className="flex items-center gap-2 px-6 border-r border-border/20">
            <span className="font-mono text-sm font-medium text-foreground">{asset.symbol}</span>
            <span className="font-mono text-sm font-semibold text-foreground">
              {asset.price < 1 ? asset.price.toFixed(4) : asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`flex items-center gap-0.5 text-xs font-medium ${asset.changePercent >= 0 ? "price-up" : "price-down"}`}>
              {asset.changePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {asset.changePercent >= 0 ? "+" : ""}{asset.changePercent}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarketTicker;
