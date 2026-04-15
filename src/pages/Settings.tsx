import { useNavigate } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import BottomNav from "@/components/dashboard/BottomNav";
import { ArrowLeft, Moon, Sun, Bell, Volume2, Globe, Shield, Type } from "lucide-react";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useStore();
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [fontSize, setFontSize] = useState([14]);

  useEffect(() => {
    if (!isAuthenticated) navigate("/login");
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex items-center gap-3 h-14 px-4 border-b border-border/30 bg-card/50 backdrop-blur-xl shrink-0">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="h-8 w-8"><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="font-bold text-lg">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        <div className="glass-card p-4 space-y-4">
          <h3 className="font-semibold text-sm">Appearance</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {darkMode ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-warning" />}
              <Label>Dark Mode</Label>
            </div>
            <Switch checked={darkMode} onCheckedChange={setDarkMode} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <Label>Font Size: {fontSize[0]}px</Label>
            </div>
            <Slider value={fontSize} onValueChange={setFontSize} min={12} max={20} step={1} className="w-full" />
          </div>
        </div>

        <div className="glass-card p-4 space-y-4">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Bell className="h-4 w-4 text-muted-foreground" /><Label>Push Notifications</Label></div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Volume2 className="h-4 w-4 text-muted-foreground" /><Label>Sound Effects</Label></div>
            <Switch checked={sounds} onCheckedChange={setSounds} />
          </div>
        </div>

        <div className="glass-card p-4 space-y-4">
          <h3 className="font-semibold text-sm">Privacy & Security</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-muted-foreground" /><Label>Two-Factor Auth</Label></div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><Globe className="h-4 w-4 text-muted-foreground" /><Label>Language</Label></div>
            <span className="text-sm text-muted-foreground">English</span>
          </div>
        </div>

        <Button variant="destructive" className="w-full" onClick={() => { logout(); navigate("/"); }}>
          Sign Out
        </Button>
      </div>

      <BottomNav />
    </div>
  );
};

export default SettingsPage;
