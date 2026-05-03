import { create } from "zustand";
import { MarketAsset, getInitialAssets } from "@/lib/marketData";

export interface User {
  id: string;
  fullName: string;
  username: string;
  phone: string;
  dateOfBirth: string;
  age: number;
  realBalance: number;
  demoBalance: number;
  accountType: "demo" | "real";
  withdrawPin: string;
}

export interface Trade {
  id: string;
  asset: string;
  type: "buy" | "sell";
  amount: number;
  entryPrice: number;
  exitPrice?: number;
  pnl?: number;
  status: "open" | "closed" | "expired";
  duration: number;
  timestamp: number;
  accountType: "demo" | "real";
}

export interface Transaction {
  id: string;
  type: "deposit" | "withdrawal";
  amount: number;
  status: "pending" | "approved";
  timestamp: number;
  method?: string;
}

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  assets: MarketAsset[];
  selectedAsset: string;
  trades: Trade[];
  transactions: Transaction[];
  showWalletModal: boolean;
  showMarketSidebar: boolean;

  login: (user: User) => void;
  logout: () => void;
  setAssets: (assets: MarketAsset[]) => void;
  selectAsset: (symbol: string) => void;
  addTrade: (trade: Trade) => void;
  closeTrade: (id: string, exitPrice: number) => void;
  addTransaction: (tx: Transaction) => void;
  updateBalance: (type: "real" | "demo", amount: number) => void;
  switchAccountType: (type: "demo" | "real") => void;
  setShowWalletModal: (show: boolean) => void;
  setShowMarketSidebar: (show: boolean) => void;
}

export const useStore = create<AppState>((set, get) => {
  const savedState = typeof window !== 'undefined' ? localStorage.getItem('appState') : null;
  const parsedState = savedState ? JSON.parse(savedState) : null;
  const initialState = parsedState ? {
    ...parsedState,
    showWalletModal: false,
    showMarketSidebar: false,
  } : {
    user: null,
    isAuthenticated: false,
    assets: getInitialAssets(),
    selectedAsset: "BTC/USD",
    trades: [],
    transactions: [],
    showWalletModal: false,
    showMarketSidebar: false,
  };

  const stateManager = {
    ...initialState,
    login: (user: User) => {
      const newState = { user, isAuthenticated: true };
      set(newState);
      if (typeof window !== 'undefined') {
        localStorage.setItem('appState', JSON.stringify({ ...get(), ...newState }));
      }
    },
    logout: () => {
      set({ user: null, isAuthenticated: false, trades: [], transactions: [] });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('appState');
      }
    },
    setAssets: (assets: MarketAsset[]) => {
      set({ assets });
      if (typeof window !== 'undefined') localStorage.setItem('appState', JSON.stringify(get()));
    },
    selectAsset: (symbol: string) => {
      set({ selectedAsset: symbol });
      if (typeof window !== 'undefined') localStorage.setItem('appState', JSON.stringify(get()));
    },
    addTrade: (trade: Trade) => {
      const { user } = get();
      if (!user) return;
      const newState = {
        trades: [trade, ...get().trades],
      };
      set(newState);
      if (typeof window !== 'undefined') localStorage.setItem('appState', JSON.stringify(get()));
    },
    closeTrade: (id: string, exitPrice: number) => {
      const s = get();
      const trade = s.trades.find((t) => t.id === id);
      if (!trade || trade.status !== "open") return;
      const pnl = trade.type === "buy"
        ? (exitPrice - trade.entryPrice) / trade.entryPrice * trade.amount
        : (trade.entryPrice - exitPrice) / trade.entryPrice * trade.amount;
      const balanceKey = trade.accountType === "demo" ? "demoBalance" : "realBalance";
      const newState = {
        trades: s.trades.map((t) =>
          t.id === id ? { ...t, exitPrice, pnl: +pnl.toFixed(2), status: "closed" as const } : t
        ),
        user: s.user ? { ...s.user, [balanceKey]: s.user[balanceKey] + +pnl.toFixed(2) } : null,
      };
      set(newState);
      if (typeof window !== 'undefined') localStorage.setItem('appState', JSON.stringify(get()));
    },
    addTransaction: (tx: Transaction) => {
      const newState = { transactions: [tx, ...get().transactions] };
      set(newState);
      if (typeof window !== 'undefined') localStorage.setItem('appState', JSON.stringify(get()));
    },
    updateBalance: (type: "real" | "demo", amount: number) => {
      const s = get();
      const newState = {
        user: s.user ? { ...s.user, [type === "demo" ? "demoBalance" : "realBalance"]: (s.user[type === "demo" ? "demoBalance" : "realBalance"] || 0) + amount } : null,
      };
      set(newState);
      if (typeof window !== 'undefined') localStorage.setItem('appState', JSON.stringify(get()));
    },
    switchAccountType: (type: "demo" | "real") => {
      const newState = { user: get().user ? { ...get().user!, accountType: type } : null };
      set(newState);
      if (typeof window !== 'undefined') localStorage.setItem('appState', JSON.stringify(get()));
    },
    setShowWalletModal: (show: boolean) => {
      set({ showWalletModal: show });
      if (typeof window !== 'undefined') localStorage.setItem('appState', JSON.stringify(get()));
    },
    setShowMarketSidebar: (show: boolean) => {
      set({ showMarketSidebar: show });
      if (typeof window !== 'undefined') localStorage.setItem('appState', JSON.stringify(get()));
    },
  };

  return stateManager;
});
