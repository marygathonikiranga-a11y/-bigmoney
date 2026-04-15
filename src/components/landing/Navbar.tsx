import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/useStore";
import { BarChart3 } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const isAuthenticated = useStore((s) => s.isAuthenticated);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary neon-glow">
            <BarChart3 className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">TradeX</span>
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Button onClick={() => navigate("/dashboard")}>Dashboard</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate("/login")} className="text-muted-foreground hover:text-foreground">
                Log In
              </Button>
              <Button onClick={() => navigate("/signup")} className="neon-glow">
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
