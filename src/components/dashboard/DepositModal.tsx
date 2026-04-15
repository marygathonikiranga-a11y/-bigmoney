import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Wallet, ArrowDownToLine, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DepositModalProps {
  step: "phone" | "amount" | "countdown" | "success";
  phone: string;
  amount: string;
  countdown: number;
  isCounting: boolean;
  onPhoneChange: (phone: string) => void;
  onAmountChange: (amount: string) => void;
  onNext: () => void;
  onRecharge: () => void;
  onClose: () => void;
}

const DepositModal = ({ 
  step, 
  phone, 
  amount, 
  countdown, 
  isCounting, 
  onPhoneChange, 
  onAmountChange, 
  onNext, 
  onRecharge, 
  onClose 
}: DepositModalProps) => {
  const { user, updateBalance } = useStore();
  const { toast } = useToast();

  useEffect(() => {
    if (countdown === 0 && isCounting) {
      // Show success
      setTimeout(() => {
        // Add amount to balance
        const amountValue = parseFloat(amount);
        if (!isNaN(amountValue)) {
          updateBalance("real", amountValue);
          toast({ title: "Success", description: `Deposit of $${amountValue.toFixed(2)} completed successfully.`, variant: "default" });
        }
        onClose();
      }, 1000);
    }
  }, [countdown, isCounting, amount, updateBalance, toast, onClose]);

  const handleNext = () => {
    if (!phone || !/^\d{10}$/.test(phone)) {
      toast({ title: "Invalid Phone", description: "Please enter a valid 10-digit phone number.", variant: "destructive" });
      return;
    }
    if (user?.phone && phone !== user.phone) {
      toast({ title: "Phone Mismatch", description: "Phone number must match the one you signed up with.", variant: "destructive" });
      return;
    }
    onNext();
  };

  const handleRecharge = () => {
    const amountValue = parseFloat(amount);
    if (!amount || isNaN(amountValue) || amountValue <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    onRecharge();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md glass-card neon-glow p-6 space-y-5" style={{ animation: "slideUp 0.4s ease-out" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Deposit</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        {step === "phone" && (
          <div className="space-y-4">
            <div className="text-center p-3 rounded-lg bg-muted/20">
              <div className="text-xs text-muted-foreground">Enter Phone Number</div>
              <div className="font-mono text-sm text-muted-foreground">The phone number you signed up with</div>
            </div>
            <Input 
              type="tel" 
              placeholder="Enter phone number (e.g., 0712345678)" 
              value={phone} 
              onChange={(e) => onPhoneChange(e.target.value)} 
              className="bg-muted/30 border-border/30" 
            />
            <Button onClick={handleNext} className="w-full neon-glow">
              Next
            </Button>
          </div>
        )}

        {step === "amount" && (
          <div className="space-y-4">
            <div className="text-center p-3 rounded-lg bg-muted/20">
              <div className="text-xs text-muted-foreground">Enter Amount</div>
              <div className="font-mono text-sm text-muted-foreground">Amount to deposit</div>
            </div>
            <Input 
              type="number" 
              placeholder="Enter amount ($)" 
              value={amount} 
              onChange={(e) => onAmountChange(e.target.value)} 
              className="bg-muted/30 border-border/30" 
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onPhoneChange("")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleRecharge} className="flex-1 neon-glow">
                Recharge
              </Button>
            </div>
          </div>
        )}

        {step === "countdown" && (
          <div className="py-8 flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-primary border-b-primary" />
            <div className="text-center text-lg font-semibold">
              Waiting for M-Pesa PIN...
            </div>
            <p className="text-center text-sm text-muted-foreground">{countdown}s remaining</p>
            <Button variant="ghost" className="h-10 w-10 rounded-full text-destructive" onClick={() => {
              onClose();
            }}>
              X
            </Button>
          </div>
        )}

        {step === "success" && (
          <div className="py-8 flex flex-col items-center justify-center gap-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <div className="text-center text-lg font-semibold text-green-700">
              Successful Payment
            </div>
            <p className="text-center text-sm text-green-600">Your deposit has been completed successfully.</p>
            <Button onClick={onClose} className="w-full neon-glow">
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DepositModal;