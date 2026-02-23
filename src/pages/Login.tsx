import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, User, Lock, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"player" | "official">("player");
  const [playerId, setPlayerId] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePlayerLogin = () => {
    setLoading(true);
    setError("");
    const result = login(playerId);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Invalid Player ID");
    }
    setLoading(false);
  };

  const handleOfficialLogin = () => {
    setLoading(true);
    setError("");
    const result = login(username, pin);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Invalid credentials");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-primary/3 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_hsl(var(--background))_70%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-6"
      >
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full border-2 border-primary/50 bg-secondary mb-4"
          >
            <Sun className="w-10 h-10 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-heading font-bold gold-text tracking-wider">
            SUNCITY FC
          </h1>
          <p className="text-muted-foreground mt-2 text-sm tracking-[0.3em] uppercase font-body">
            Discipline • Unity • Victory
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-xl p-6 card-glow">
          <Tabs value={tab} onValueChange={(v) => { setTab(v as "player" | "official"); setError(""); }}>
            <TabsList className="grid w-full grid-cols-2 bg-secondary mb-6">
              <TabsTrigger value="player" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-body">
                <User className="w-4 h-4 mr-2" />
                Player
              </TabsTrigger>
              <TabsTrigger value="official" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-body">
                <Shield className="w-4 h-4 mr-2" />
                Official
              </TabsTrigger>
            </TabsList>

            <TabsContent value="player" className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground font-body mb-1.5 block">Player ID</label>
                <Input
                  placeholder="e.g. SCF-P01"
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handlePlayerLogin()}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground font-body"
                />
              </div>
              <Button
                onClick={handlePlayerLogin}
                disabled={!playerId || loading}
                className="w-full font-body font-semibold text-base"
              >
                Enter Portal
              </Button>
            </TabsContent>

            <TabsContent value="official" className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground font-body mb-1.5 block">Username</label>
                <Input
                  placeholder="e.g. COACH-FAB"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toUpperCase())}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground font-body"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground font-body mb-1.5 block">4-Digit PIN</label>
                <div className="relative">
                  <Input
                    type="password"
                    placeholder="••••"
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && handleOfficialLogin()}
                    className="bg-secondary border-border text-foreground placeholder:text-muted-foreground font-body tracking-[0.5em] text-center"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                </div>
              </div>
              <Button
                onClick={handleOfficialLogin}
                disabled={!username || pin.length !== 4 || loading}
                className="w-full font-body font-semibold text-base"
              >
                Access Dashboard
              </Button>
            </TabsContent>
          </Tabs>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-destructive text-sm text-center mt-4 font-body"
            >
              {error}
            </motion.p>
          )}
        </div>

        <p className="text-center text-muted-foreground text-xs mt-6 font-body">
          © 2026 Suncity FC — All Rights Reserved
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
