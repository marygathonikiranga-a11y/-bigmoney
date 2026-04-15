import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/useStore";
import { BarChart3, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const login = useStore((s) => s.login);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(apiUrl('/api/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        toast({ title: 'Error', description: data.error || 'Invalid credentials', variant: 'destructive' });
        return;
      }

      login(data.user);
      navigate('/dashboard');
    } catch (error) {
      toast({ title: 'Error', description: 'Unable to sign in', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md glass-card p-8 space-y-6 neon-glow" style={{ animation: "slideUp 0.5s ease-out" }}>
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary neon-glow">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">TradeX</span>
          </Link>
          <p className="text-muted-foreground text-sm">Sign in to your trading account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} className="bg-muted/50 border-border/50" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" type={showPass ? "text" : "password"} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-muted/50 border-border/50 pr-10" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" className="w-full neon-glow" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="text-primary hover:underline font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
