export interface MarketAsset {
  symbol: string;
  name: string;
  category: "forex" | "crypto" | "indices";
  price: number;
  change: number;
  changePercent: number;
  high24h: number;
  low24h: number;
  volume: string;
}

const baseAssets: Omit<MarketAsset, "change" | "changePercent">[] = [
  { symbol: "EUR/USD", name: "Euro / US Dollar", category: "forex", price: 1.0856, high24h: 1.0892, low24h: 1.0821, volume: "2.1B" },
  { symbol: "GBP/USD", name: "British Pound / US Dollar", category: "forex", price: 1.2634, high24h: 1.2678, low24h: 1.2601, volume: "1.8B" },
  { symbol: "USD/JPY", name: "US Dollar / Japanese Yen", category: "forex", price: 149.82, high24h: 150.12, low24h: 149.45, volume: "1.5B" },
  { symbol: "AUD/USD", name: "Australian Dollar / US Dollar", category: "forex", price: 0.6543, high24h: 0.6578, low24h: 0.6512, volume: "890M" },
  { symbol: "USD/CAD", name: "US Dollar / Canadian Dollar", category: "forex", price: 1.3621, high24h: 1.3658, low24h: 1.3589, volume: "780M" },
  { symbol: "NZD/USD", name: "New Zealand Dollar / US Dollar", category: "forex", price: 0.5987, high24h: 0.6012, low24h: 0.5965, volume: "450M" },
  { symbol: "USD/CHF", name: "US Dollar / Swiss Franc", category: "forex", price: 0.8834, high24h: 0.8862, low24h: 0.8801, volume: "620M" },
  { symbol: "EUR/GBP", name: "Euro / British Pound", category: "forex", price: 0.8593, high24h: 0.8615, low24h: 0.8572, volume: "540M" },
  { symbol: "EUR/JPY", name: "Euro / Japanese Yen", category: "forex", price: 162.65, high24h: 163.01, low24h: 162.28, volume: "480M" },
  { symbol: "GBP/JPY", name: "British Pound / Japanese Yen", category: "forex", price: 189.34, high24h: 189.78, low24h: 188.92, volume: "410M" },
  { symbol: "BTC/USD", name: "Bitcoin", category: "crypto", price: 67234.50, high24h: 68100.00, low24h: 66450.00, volume: "28.5B" },
  { symbol: "ETH/USD", name: "Ethereum", category: "crypto", price: 3456.78, high24h: 3520.00, low24h: 3410.00, volume: "15.2B" },
  { symbol: "BNB/USD", name: "Binance Coin", category: "crypto", price: 584.32, high24h: 592.00, low24h: 578.00, volume: "2.1B" },
  { symbol: "SOL/USD", name: "Solana", category: "crypto", price: 142.56, high24h: 145.80, low24h: 140.20, volume: "3.8B" },
  { symbol: "XRP/USD", name: "Ripple", category: "crypto", price: 0.5234, high24h: 0.5312, low24h: 0.5178, volume: "1.9B" },
  { symbol: "ADA/USD", name: "Cardano", category: "crypto", price: 0.4521, high24h: 0.4598, low24h: 0.4467, volume: "890M" },
  { symbol: "DOGE/USD", name: "Dogecoin", category: "crypto", price: 0.1234, high24h: 0.1267, low24h: 0.1208, volume: "1.2B" },
  { symbol: "DOT/USD", name: "Polkadot", category: "crypto", price: 6.78, high24h: 6.92, low24h: 6.65, volume: "540M" },
  { symbol: "AVAX/USD", name: "Avalanche", category: "crypto", price: 34.56, high24h: 35.20, low24h: 33.90, volume: "780M" },
  { symbol: "LINK/USD", name: "Chainlink", category: "crypto", price: 14.23, high24h: 14.56, low24h: 14.01, volume: "620M" },
  { symbol: "US500", name: "S&P 500", category: "indices", price: 5234.18, high24h: 5248.00, low24h: 5218.00, volume: "4.2B" },
  { symbol: "US100", name: "NASDAQ 100", category: "indices", price: 18456.32, high24h: 18520.00, low24h: 18380.00, volume: "3.8B" },
  { symbol: "US30", name: "Dow Jones 30", category: "indices", price: 39234.56, high24h: 39320.00, low24h: 39150.00, volume: "2.9B" },
  { symbol: "UK100", name: "FTSE 100", category: "indices", price: 8234.50, high24h: 8265.00, low24h: 8210.00, volume: "1.5B" },
  { symbol: "DE40", name: "DAX 40", category: "indices", price: 18123.45, high24h: 18180.00, low24h: 18065.00, volume: "1.2B" },
  { symbol: "JP225", name: "Nikkei 225", category: "indices", price: 38456.78, high24h: 38620.00, low24h: 38310.00, volume: "2.1B" },
  { symbol: "HK50", name: "Hang Seng 50", category: "indices", price: 17234.56, high24h: 17380.00, low24h: 17120.00, volume: "1.8B" },
];

export function getInitialAssets(): MarketAsset[] {
  return baseAssets.map((a) => ({
    ...a,
    change: +(Math.random() * 2 - 1).toFixed(4),
    changePercent: +(Math.random() * 4 - 2).toFixed(2),
  }));
}

export function tickAsset(asset: MarketAsset): MarketAsset {
  const volatility = asset.category === "crypto" ? 0.002 : asset.category === "indices" ? 0.0005 : 0.0003;
  const delta = asset.price * (Math.random() * 2 - 1) * volatility;
  const newPrice = +(asset.price + delta).toFixed(asset.price < 1 ? 4 : 2);
  const change = +(newPrice - (asset.price - asset.change)).toFixed(4);
  const changePercent = +(change / (newPrice - change) * 100).toFixed(2);
  return {
    ...asset,
    price: newPrice,
    change,
    changePercent,
    high24h: Math.max(asset.high24h, newPrice),
    low24h: Math.min(asset.low24h, newPrice),
  };
}

export function generateCandlestickData(basePrice: number, count: number = 100, intervalMs: number = 60000) {
  const data: { time: string; open: number; close: number; high: number; low: number }[] = [];
  let price = basePrice;
  const now = Date.now();
  // Use varied volatility per candle to avoid straight lines
  for (let i = count; i >= 0; i--) {
    const baseVol = price * 0.005;
    const spike = Math.random() < 0.15 ? (Math.random() * 2 + 1) : 1;
    const volatility = baseVol * spike;
    const open = price;
    const direction = Math.random() - 0.48;
    const magnitude = Math.random() * 0.8 + 0.2; // avoid near-zero moves
    const change = direction * volatility * magnitude;
    const close = +(open + change).toFixed(open < 1 ? 4 : 2);
    const wickUp = Math.random() * volatility * 0.6;
    const wickDown = Math.random() * volatility * 0.6;
    const high = +(Math.max(open, close) + wickUp).toFixed(open < 1 ? 4 : 2);
    const low = +(Math.min(open, close) - wickDown).toFixed(open < 1 ? 4 : 2);
    price = close;
    data.push({
      time: new Date(now - i * intervalMs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      open, close, high, low,
    });
  }
  return data;
}
