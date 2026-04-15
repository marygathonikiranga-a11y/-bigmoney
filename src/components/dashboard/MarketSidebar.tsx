import { useStore } from "@/store/useStore";
import { useState } from "react";
import { TrendingUp, TrendingDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const categories = ["All", "Forex", "Crypto", "Indices"] as const;

const MarketSidebar = () => {
  const { assets, selectedAsset, selectAsset, showMarketSidebar, setShowMarketSidebar } = useStore();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<typeof categories[number]>("All");

  const filtered = assets.filter((a) => {
    const matchSearch = a.symbol.toLowerCase().includes(search.toLowerCase()) || a.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = cat === "All" || a.category === cat.toLowerCase();
    return matchSearch && matchCat;
  });

  return (
    <aside className={`w-64 border-r border-border/30 bg-card/30 backdrop-blur-sm flex flex-col shrink-0 ${showMarketSidebar ? 'fixed inset-y-14 left-0 z-50 bg-background' : 'hidden'} lg:flex lg:static lg:bg-card/30`}>
      <div className="p-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search markets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8 text-xs bg-muted/30 border-border/30" />
        </div>
        <div className="flex gap-1">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${cat === c ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map((asset) => (
          <button
            key={asset.symbol}
            onClick={() => { selectAsset(asset.symbol); setShowMarketSidebar(false); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-all hover:bg-muted/30 ${selectedAsset === asset.symbol ? "bg-primary/10 border-l-2 border-primary" : "border-l-2 border-transparent"}`}
          >
            <div>
              <div className="text-xs font-semibold">{asset.symbol}</div>
              <div className="text-[10px] text-muted-foreground">{asset.name}</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-xs font-semibold">
                {asset.price < 1 ? asset.price.toFixed(4) : asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className={`flex items-center gap-0.5 text-[10px] font-medium ${asset.changePercent >= 0 ? "price-up" : "price-down"}`}>
                {asset.changePercent >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                {asset.changePercent >= 0 ? "+" : ""}{asset.changePercent}%
              </div>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
};

export default MarketSidebar;
