import { useNavigate, useLocation } from "react-router-dom";
import { BarChart3, LineChart, Wallet, User, Settings } from "lucide-react";

const items = [
  { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
  { icon: LineChart, label: "Trade", path: "/dashboard" },
  { icon: Wallet, label: "Wallet", path: "/wallet" },
  { icon: User, label: "Profile", path: "/profile" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="flex items-center justify-around border-t border-border/30 bg-card/50 backdrop-blur-xl h-14 shrink-0 sm:hidden">
      {items.map(({ icon: Icon, label, path }) => {
        const active = location.pathname === path;
        return (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
