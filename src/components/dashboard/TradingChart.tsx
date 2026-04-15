import { useMemo, useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, CartesianGrid } from "recharts";
import { MarketAsset } from "@/lib/marketData";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Props {
  data: { time: string; open: number; close: number; high: number; low: number }[];
  asset: MarketAsset;
}

const TradingChart = ({ data, asset }: Props) => {
  const [liveData, setLiveData] = useState(data);

  useEffect(() => {
    setLiveData(data);
  }, [data]);

  useEffect(() => {
    const iv = setInterval(() => {
      setLiveData((prev) => {
        const last = prev[prev.length - 1];
        const volatility = last.close * 0.003;
        const spike = Math.random() < 0.15 ? 2.5 : 1;
        const change = (Math.random() - 0.48) * volatility * spike * (Math.random() * 0.8 + 0.4);
        const newClose = +(last.close + change).toFixed(last.close < 1 ? 4 : 2);
        const newPoint = {
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          open: last.close,
          close: newClose,
          high: +(Math.max(last.close, newClose) + Math.random() * volatility * 0.3).toFixed(2),
          low: +(Math.min(last.close, newClose) - Math.random() * volatility * 0.3).toFixed(2),
        };
        return [...prev.slice(1), newPoint];
      });
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const lineData = useMemo(() => liveData.map((d) => ({ time: d.time, price: d.close })), [liveData]);

  if (!asset) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center gap-4 px-4 py-2 border-b border-border/20">
        <div>
          <span className="text-lg font-bold">{asset.symbol}</span>
          <span className="text-xs text-muted-foreground ml-2">{asset.name}</span>
        </div>
        <div className="font-mono text-xl font-bold">
          {asset.price < 1 ? asset.price.toFixed(4) : asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className={`flex items-center gap-1 text-sm font-semibold ${asset.changePercent >= 0 ? "price-up" : "price-down"}`}>
          {asset.changePercent >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {asset.changePercent >= 0 ? "+" : ""}{asset.changePercent}%
        </div>
        <div className="ml-auto flex gap-4 text-xs text-muted-foreground">
          <span>H: <span className="text-foreground font-mono">{asset.high24h.toLocaleString()}</span></span>
          <span>L: <span className="text-foreground font-mono">{asset.low24h.toLocaleString()}</span></span>
          <span>Vol: <span className="text-foreground font-mono">{asset.volume}</span></span>
        </div>
      </div>

      <div className="flex-1 p-2" style={{ minHeight: "300px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={lineData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={asset.changePercent >= 0 ? "hsl(142 71% 45%)" : "hsl(0 72% 51%)"} stopOpacity={0.3} />
                <stop offset="100%" stopColor={asset.changePercent >= 0 ? "hsl(142 71% 45%)" : "hsl(0 72% 51%)"} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 16%)" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: "hsl(215 15% 55%)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "hsl(215 15% 55%)" }} axisLine={false} tickLine={false} width={60} tickFormatter={(v) => v.toLocaleString()} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(220 18% 9%)", border: "1px solid hsl(220 14% 16%)", borderRadius: "8px", fontSize: "12px" }}
              labelStyle={{ color: "hsl(215 15% 55%)" }}
              itemStyle={{ color: "hsl(210 40% 95%)" }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={asset.changePercent >= 0 ? "hsl(142 71% 45%)" : "hsl(0 72% 51%)"}
              strokeWidth={2}
              fill="url(#chartGrad)"
              animationDuration={300}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TradingChart;
