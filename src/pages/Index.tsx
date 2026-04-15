import { useEffect, useState } from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import MarketTicker from "@/components/landing/MarketTicker";
import { useStore } from "@/store/useStore";
import { tickAsset } from "@/lib/marketData";
import PaymentPopup from "@/components/landing/PaymentPopup";

const Index = () => {
  const setAssets = useStore((s) => s.setAssets);
  const assets = useStore((s) => s.assets);
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    const iv = setInterval(() => {
      setAssets(assets.map(tickAsset));
    }, 1500);
    return () => clearInterval(iv);
  }, [assets, setAssets]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <MarketTicker />
      <HeroSection />
      <PaymentPopup isOpen={popupOpen} onOpenChange={setPopupOpen} />
    </div>
  );
};

export default Index;
