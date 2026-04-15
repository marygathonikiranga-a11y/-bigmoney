import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Wallet, ArrowDownToLine, ArrowUpFromLine, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiUrl } from "@/lib/api";

interface Props {
  onClose: () => void;
  initialTab?: "deposit" | "withdraw";
}

const WalletModal = ({ onClose, initialTab = "deposit" }: Props) => {
  const { user, updateBalance, addTransaction, switchAccountType, login } = useStore();
  const [tab, setTab] = useState<"withdraw">("withdraw");
  const [amount, setAmount] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");
  const { toast } = useToast();


  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Error", description: "User not found", variant: "destructive" });
      return;
    }

    const amountValue = parseFloat(amount);
    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      toast({ title: "Invalid amount", description: "Enter a valid amount.", variant: "destructive" });
      return;
    }

    if (!pin || !/^[0-9]{4}$/.test(pin)) {
      toast({ title: "PIN required", description: "Enter your 4-digit withdraw PIN.", variant: "destructive" });
      return;
    }

    if (amountValue > user.realBalance) {
      toast({ title: "Insufficient Funds", description: `Available: $${user.realBalance.toFixed(2)}`, variant: "destructive" });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(apiUrl("/api/withdraw"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, amount: amountValue, pin }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast({ title: "Error", description: data.error || "Unable to process withdrawal.", variant: "destructive" });
        setLoading(false);
        return;
      }

      if (!data.transaction || !data.transaction.id) {
        toast({ title: "Error", description: "Invalid response from server.", variant: "destructive" });
        setLoading(false);
        return;
      }

      // Add transaction to store
      addTransaction({ 
        id: data.transaction.id, 
        type: "withdrawal", 
        amount: amountValue, 
        status: "pending", 
        timestamp: Date.now() 
      });
      
      // Deduct amount immediately
      updateBalance("real", -amountValue);
      setPendingMessage("Withdrawal is pending approval.");
      setLoading(false);
    } catch (error) {
      console.error("Transaction failed", error);
      toast({ title: "Error", description: "Transaction failed. Please try again.", variant: "destructive" });
      setLoading(false);
    }
  };



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md glass-card neon-glow p-6 space-y-5" style={{ animation: "slideUp 0.4s ease-out" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Wallet</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>


        <div className="text-center p-3 rounded-lg bg-muted/20">
          <div className="text-xs text-muted-foreground">Real Balance</div>
          <div className="font-mono text-2xl font-bold">${user.realBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
        </div>

        {pendingMessage && (
          <div className="mt-4 rounded-lg border border-muted/30 bg-muted/10 p-4 text-sm text-foreground transition-opacity duration-700">
            {pendingMessage}
          </div>
        )}

        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-primary border-b-primary" />
            <div className="text-center text-lg font-semibold">
              Processing...
            </div>
            <Button variant="ghost" className="h-10 w-10 rounded-full text-destructive" onClick={() => {
              setLoading(false);
            }}>
              X
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Input type="number" placeholder="Amount ($)" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-muted/30 border-border/30" />
            <Input type="password" maxLength={4} placeholder="Withdraw PIN" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} className="bg-muted/30 border-border/30" />
            <Button onClick={handleSubmit} disabled={loading} className="w-full neon-glow">
              {loading ? "Processing..." : "Withdraw"}
            </Button>
          </div>
        )}


        <div className="text-center">
          <Button variant="ghost" onClick={() => {
            switchAccountType("demo");
            onClose();
            toast({ title: "Demo Mode", description: "Trading with $100,000 virtual balance" });
          }} className="text-muted-foreground hover:text-foreground text-sm">
            Continue with Demo ($100,000)
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;