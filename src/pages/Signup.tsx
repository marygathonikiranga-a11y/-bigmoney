import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BarChart3, Eye, EyeOff, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";

const passwordRules = [
  { label: "At least 6 characters", test: (p: string) => p.length >= 6 },
  { label: "Uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { label: "Number", test: (p: string) => /\d/.test(p) },
  { label: "Special character", test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
];

const Signup = () => {
  const [form, setForm] = useState({
    fullName: "", username: "", phone: "", email: "", dob: "", password: "", confirmPassword: "", withdrawPin: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const update = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const getAge = (dob: string) => {
    if (!dob) return 0;
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / 31557600000);
  };

  const passStrength = passwordRules.filter((r) => r.test(form.password)).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const age = getAge(form.dob);
    if (age < 18) { toast({ title: "Error", description: "You must be 18 or older", variant: "destructive" }); return; }
    if (passStrength < 5) { toast({ title: "Error", description: "Password doesn't meet requirements", variant: "destructive" }); return; }
    if (form.password !== form.confirmPassword) { toast({ title: "Error", description: "Passwords don't match", variant: "destructive" }); return; }
    if (form.withdrawPin.length !== 4 || !/^\d{4}$/.test(form.withdrawPin)) { toast({ title: "Error", description: "PIN must be 4 digits", variant: "destructive" }); return; }
    if (!terms) { toast({ title: "Error", description: "Accept the terms", variant: "destructive" }); return; }

    setLoading(true);
    try {
      const response = await fetch(apiUrl('/api/signup'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          username: form.username,
          phone: form.phone,
          email: form.email,
          dob: form.dob,
          password: form.password,
          withdrawPin: form.withdrawPin,
          termsAccepted: terms,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: "Welcome!", description: "Account created successfully" });
        navigate("/login");
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-12">
      <div className="w-full max-w-lg glass-card p-8 space-y-6 neon-glow" style={{ animation: "slideUp 0.5s ease-out" }}>
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary neon-glow">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">TradeX</span>
          </Link>
          <p className="text-muted-foreground text-sm">Create your trading account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input placeholder="John Doe" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} required className="bg-muted/50 border-border/50" />
            </div>
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input placeholder="johndoe" value={form.username} onChange={(e) => update("username", e.target.value)} required className="bg-muted/50 border-border/50" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Phone Number</Label>
              <Input placeholder="+254700000000" value={form.phone} onChange={(e) => update("phone", e.target.value)} required className="bg-muted/50 border-border/50" />
            </div>
            <div className="space-y-1.5">
              <Label>Email (Optional)</Label>
              <Input type="email" placeholder="john@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} className="bg-muted/50 border-border/50" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Date of Birth {form.dob && <span className="text-muted-foreground text-xs">({getAge(form.dob)} yrs)</span>}</Label>
            <Input type="date" value={form.dob} onChange={(e) => update("dob", e.target.value)} required className="bg-muted/50 border-border/50" />
          </div>

          <div className="space-y-1.5">
            <Label>Password</Label>
            <div className="relative">
              <Input type={showPass ? "text" : "password"} placeholder="Strong password" value={form.password} onChange={(e) => update("password", e.target.value)} required className="bg-muted/50 border-border/50 pr-10" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className={`h-1 flex-1 rounded-full transition-colors ${passStrength >= n ? (passStrength <= 2 ? "bg-destructive" : passStrength <= 4 ? "bg-warning" : "bg-success") : "bg-muted"}`} />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-2">
              {passwordRules.map((r) => (
                <div key={r.label} className={`flex items-center gap-1 text-xs ${r.test(form.password) ? "text-success" : "text-muted-foreground"}`}>
                  {r.test(form.password) ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  {r.label}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Confirm Password</Label>
            <Input type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={(e) => update("confirmPassword", e.target.value)} required className="bg-muted/50 border-border/50" />
          </div>

          <div className="space-y-1.5">
            <Label>Withdraw PIN (4 digits)</Label>
            <Input type="password" maxLength={4} placeholder="••••" value={form.withdrawPin} onChange={(e) => update("withdrawPin", e.target.value.replace(/\D/g, "").slice(0, 4))} required className="bg-muted/50 border-border/50 max-w-[120px]" />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="terms" checked={terms} onCheckedChange={(c) => setTerms(c === true)} />
            <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
              I agree to the Terms & Conditions and Privacy Policy
            </Label>
          </div>

          <Button type="submit" className="w-full neon-glow" disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
