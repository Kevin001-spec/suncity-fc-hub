import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import suncityBadge from "@/assets/suncity-badge.png";

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [memberId, setMemberId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isPlayer = useMemo(() => {
    const afterDash = memberId.split("-")[1] || "";
    return afterDash.toUpperCase().includes("P");
  }, [memberId]);

  const isOfficialId = useMemo(() => {
    const upper = memberId.toUpperCase();
    if (!upper.startsWith("SCF-")) return false;
    const afterDash = upper.split("-")[1] || "";
    return afterDash.length > 0 && !afterDash.includes("P") && /^\d+$/.test(afterDash);
  }, [memberId]);

  const handleLogin = () => {
    setLoading(true);
    setError("");
    const result = isPlayer ? login(memberId) : login(memberId, pin);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setError(result.error || "Invalid credentials");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-primary/3 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full navy-bg opacity-20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_hsl(var(--background))_70%)]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-full border-2 border-primary/50 bg-secondary mb-4 overflow-hidden"
          >
            <img src={suncityBadge} alt="Suncity FC Badge" className="w-20 h-20 object-contain" />
          </motion.div>
          <h1 className="text-3xl font-heading font-bold gold-text tracking-wider">SUNCITY FC</h1>
          <p className="text-muted-foreground mt-2 text-sm tracking-[0.3em] uppercase font-body">
            Discipline • Unity • Victory
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 card-glow">
          <h3 className="font-heading text-sm text-primary text-center mb-6 tracking-wider">MEMBER LOGIN</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground font-body mb-1.5 block">Enter Your ID</label>
              <Input
                placeholder="e.g. SCF-P01 or SCF-001"
                value={memberId}
                onChange={(e) => { setMemberId(e.target.value.toUpperCase()); setError(""); setPin(""); }}
                onKeyDown={(e) => e.key === "Enter" && isPlayer && handleLogin()}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground font-body"
              />
              <p className="text-xs text-muted-foreground mt-1 font-body">
                {isPlayer ? "🟢 Player ID detected — no PIN needed" : isOfficialId ? "🔐 Official ID — enter PIN below" : "Type your member ID to continue"}
              </p>
            </div>

            <AnimatePresence>
              {isOfficialId && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                  <label className="text-sm text-muted-foreground font-body mb-1.5 block">4-Digit PIN</label>
                  <div className="relative">
                    <Input
                      type="password" placeholder="••••" maxLength={4} value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                      onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                      className="bg-secondary border-border text-foreground placeholder:text-muted-foreground font-body tracking-[0.5em] text-center"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button onClick={handleLogin} disabled={!memberId || (isOfficialId && pin.length !== 4) || loading} className="w-full font-body font-semibold text-base">
              Enter Portal
            </Button>
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-destructive text-sm text-center mt-4 font-body">
              {error}
            </motion.p>
          )}
        </div>

        <p className="text-center text-muted-foreground text-xs mt-6 font-body">© 2026 Suncity FC — All Rights Reserved</p>
      </motion.div>
    </div>
  );
};

export default Login;
