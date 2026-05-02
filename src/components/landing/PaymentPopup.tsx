import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/useStore";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiUrl } from "@/lib/api";

interface PaymentPopupProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: "deposit" | "withdraw";
}

const LandingPaymentPopup = ({ isOpen, onOpenChange, initialTab = "deposit" }: PaymentPopupProps) => {
  const user = useStore((s) => s.user);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const login = useStore((s) => s.login);
  const [tab, setTab] = useState<"deposit" | "withdraw">(initialTab);
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState(user?.phone || "");
  const [pin, setPin] = useState("");
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [failed, setFailed] = useState(false);
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pendingMessage, setPendingMessage] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!isOpen) return;

    setAmount("");
    setPhone(user?.phone || "");
    setPin("");
    setTransactionId(null);
    setStatus(null);
    setLoading(false);
    setMessage("");
    setSuccessMessage("");
    setPendingMessage("");
  }, [isOpen, user]);

  useEffect(() => {
    if (!transactionId) return;

    const refreshUser = async () => {
      if (!user?.username) return;
      try {
        const res = await fetch(apiUrl(`/api/user/by-username/${encodeURIComponent(user.username)}`));
        if (!res.ok) return;
        const data = await res.json();
        login(data.user);
      } catch (error) {
        console.error('Unable to refresh user data', error);
      }
    };

    const fetchStatus = async () => {
      try {
        const res = await fetch(apiUrl(`/api/transaction/${transactionId}`));
        if (!res.ok) return;
        const data = await res.json();

        setStatus(data.transaction.status);

        if (data.transaction.status === "approved") {
          setLoading(false);
          setSuccessMessage(tab === "deposit"
            ? "Deposit approved and completed."
            : "Withdrawal approved.");
          setPendingMessage("");
          setMessage("");
          refreshUser();
          return;
        }

        if (data.transaction.status === "pending") {
          setPendingMessage(tab === "deposit"
            ? "Deposit is pending approval..."
            : "Withdrawal is pending approval...");
          setSuccessMessage("");
        }
      } catch (error) {
        console.error("Unable to fetch transaction status", error);
      }
    };

    const interval = setInterval(fetchStatus, 3000);
    fetchStatus();
    return () => clearInterval(interval);
  }, [transactionId, tab, user?.username, login]);

  const handleSubmit = async () => {
    if (!isAuthenticated || !user) {
      toast({ title: "Login required", description: "Please sign in to make payments.", variant: "destructive" });
      return;
    }

    const amountValue = parseFloat(amount);
    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      toast({ title: "Invalid amount", description: "Enter a valid amount.", variant: "destructive" });
      return;
    }

    if (tab === "withdraw") {
      if (!pin || !/^[0-9]{4}$/.test(pin)) {
        toast({ title: "PIN required", description: "Enter your 4-digit withdraw PIN.", variant: "destructive" });
        return;
      }
    }

    if (tab === "deposit" && !phone) {
      toast({ title: "Phone required", description: "Please enter your phone number.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setFailed(false);
    setCountdown(30);
    setSuccessMessage("");
    setPendingMessage("");
    setMessage(tab === "deposit"
      ? "Waiting for the M-Pesa PIN..."
      : "Processing withdrawal...");

    const endpoint = tab === "deposit" ? "/api/deposit" : "/api/withdraw";

    try {
      const body: Record<string, unknown> = { userId: user.id, amount: amountValue };
      if (tab === "deposit") body.phone = phone;
      if (tab === "withdraw") body.pin = pin;

      const res = await fetch(apiUrl(endpoint), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error || "Unable to create transaction.", variant: "destructive" });
        setLoading(false);
        return;
      }

      setTransactionId(data.transaction.id);
      setStatus(data.transaction.status);
      if (tab === "withdraw") {
        setPendingMessage("Withdrawal is pending approval.");
        setMessage("");
      } else {
        setMessage("Waiting for the M-Pesa PIN...");
      }
    } catch (error) {
      console.error("Payment request failed", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!transactionId || status !== 'pending') return;

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [transactionId, status]);

  const isWaiting = tab === 'deposit' && !!transactionId && status === 'pending' && countdown > 0;
  const isTimedOut = tab === 'deposit' && !!transactionId && status === 'pending' && countdown === 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{tab === "deposit" ? "Deposit" : "Withdraw"}</DialogTitle>
        </DialogHeader>

        {isWaiting ? (
          <div className="py-8 flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-primary border-b-primary" />
            <div className="text-center text-lg font-semibold">
              Waiting for the M-Pesa PIN...
            </div>
            <p className="text-center text-sm text-muted-foreground">{countdown > 0 ? `${countdown}s remaining` : "Still waiting for approval..."}</p>
            <Button variant="ghost" className="h-10 w-10 rounded-full text-destructive" onClick={() => {
              setLoading(false);
              setFailed(true);
              setMessage("Payment failed.");
              setSuccessMessage("");
              setPendingMessage("");
              setTransactionId(null);
              setStatus(null);
            }}>
              X
            </Button>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              <Button
                variant={tab === "deposit" ? "secondary" : "ghost"}
                className="flex-1"
                onClick={() => {
                  setTab("deposit");
                  setTransactionId(null);
                  setStatus(null);
                  setLoading(false);
                  setMessage("");
                  setSuccessMessage("");
                  setPendingMessage("");
                  setFailed(false);
                  setCountdown(30);
                }}
              >
                Deposit
              </Button>
              <Button
                variant={tab === "withdraw" ? "secondary" : "ghost"}
                className="flex-1"
                onClick={() => {
                  setTab("withdraw");
                  setTransactionId(null);
                  setStatus(null);
                  setLoading(false);
                  setMessage("");
                  setSuccessMessage("");
                  setPendingMessage("");
                  setFailed(false);
                  setCountdown(30);
                }}
              >
                Withdraw
              </Button>
            </div>
            {tab === "deposit" ? (
              <div className="space-y-4">
                {!isAuthenticated ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Please <Link to="/login" className="text-primary underline">login</Link> or <Link to="/signup" className="text-primary underline">sign up</Link> to create a deposit.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="deposit-amount">Enter Amount</Label>
                      <Input
                        id="deposit-amount"
                        type="number"
                        placeholder="Enter Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="bg-muted/50 border-border/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deposit-phone">Phone Number</Label>
                      <Input
                        id="deposit-phone"
                        type="tel"
                        placeholder="Enter phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={!!user?.phone}
                        className="bg-muted/50 border-border/50"
                      />
                    </div>
                    <Button onClick={handleSubmit} disabled={loading} className="w-full">
                      {loading ? "Processing..." : "Deposit"}
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {!isAuthenticated ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Please <Link to="/login" className="text-primary underline">login</Link> or <Link to="/signup" className="text-primary underline">sign up</Link> to create a withdrawal.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="withdraw-amount">Enter Amount</Label>
                      <Input
                        id="withdraw-amount"
                        type="number"
                        placeholder="Enter Amount"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="bg-muted/50 border-border/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="withdraw-pin">Withdraw PIN</Label>
                      <Input
                        id="withdraw-pin"
                        type="password"
                        maxLength={4}
                        placeholder="Enter PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        className="bg-muted/50 border-border/50"
                      />
                    </div>
                    <Button onClick={handleSubmit} disabled={loading} className="w-full">
                      {loading ? "Processing..." : "Withdraw"}
                    </Button>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {successMessage && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-100 p-4 text-sm text-green-900">
            {successMessage}
          </div>
        )}

        {pendingMessage && (
          <div className="mt-4 rounded-lg border border-muted/30 bg-muted/10 p-4 text-sm text-foreground transition-opacity duration-700">
            {pendingMessage}
          </div>
        )}

        {message && (
          <div className="mt-4 rounded-lg border border-secondary/20 bg-secondary/5 p-4 text-sm text-muted-foreground">
            {message}
          </div>
        )}

        {transactionId && status && (
          <div className="mt-4 rounded-lg border border-muted/40 bg-muted/10 p-3 text-sm">
            <div><span className="font-semibold">Status:</span> {status}</div>
            <div><span className="font-semibold">Transaction:</span> {transactionId}</div>
          </div>
        )}

        {isOpen && !isAuthenticated && (
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => navigate('/login')}>Login</Button>
            <Button variant="outline" onClick={() => navigate('/signup')}>Sign Up</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LandingPaymentPopup;
