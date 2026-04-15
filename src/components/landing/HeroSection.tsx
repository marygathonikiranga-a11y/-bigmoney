import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, BarChart3 } from "lucide-react";
import AnimatedChart from "./AnimatedChart";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 z-0">
        <AnimatedChart />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto space-y-8" style={{ animation: "slideUp 0.8s ease-out" }}>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <Zap className="h-3.5 w-3.5" />
            Advanced Trading Platform
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            Trade Smarter.
            <br />
            <span className="text-gradient">Trade Faster.</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Access 27+ global markets with professional-grade tools, real-time data, and institutional-level execution — all in one platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="h-13 px-8 text-base font-semibold neon-glow"
              onClick={() => navigate("/signup")}
            >
              Start Trading <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-13 px-8 text-base font-semibold border-border/50 bg-card/50 backdrop-blur-sm"
              onClick={() => navigate("/signup")}
            >
              Try Demo Account
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto pt-8">
            {[
              { icon: BarChart3, label: "27+ Markets" },
              { icon: Zap, label: "< 1ms Execution" },
              { icon: Shield, label: "Bank-Grade Security" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 text-muted-foreground">
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
