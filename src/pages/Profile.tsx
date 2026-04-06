import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PlayerProfile from "./PlayerProfile";
import OfficialProfile from "./OfficialProfile";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import LottieCarousel from "@/components/LottieCarousel";
import suncityBadge from "@/assets/suncity-badge.png";

// All carousel animations for the login screen
import dashboardAnimation from "@/assets/animations/dashboardanimation.json";
import dashboardc1 from "@/assets/animations/dashboardc1.json";
import dashboardc2 from "@/assets/animations/dashboardc2.json";
import dashboardc3 from "@/assets/animations/dashboardc3.json";
import statsAnimation from "@/assets/animations/statsanimation.json";
import playersAnimation from "@/assets/animations/playersanimation.json";
import resultsAnimation from "@/assets/animations/resultsanimation.json";
import allmembersProfile from "@/assets/animations/allmembers_profile.json";
import everyoneprofilecarrousel1 from "@/assets/animations/everyoneprofilecarrousel1.json";
import everyoneprofilecarrousel2 from "@/assets/animations/everyoneprofilecarrousel2.json";
import everyoneprofilecarrousel3 from "@/assets/animations/everyoneprofilecarrousel3.json";
import everyoneprofilecarrousel5 from "@/assets/animations/everyoneprofilecarrousel5.json";
import statsnplayerspagec1 from "@/assets/animations/statsnplayerspagec1.json";
import statsnplayerspagec2 from "@/assets/animations/statsnplayerspagec2.json";

const loginCarouselAnimations = [
  dashboardAnimation, dashboardc1, dashboardc2, dashboardc3,
  statsAnimation, playersAnimation, resultsAnimation,
  allmembersProfile, everyoneprofilecarrousel1, everyoneprofilecarrousel2,
  everyoneprofilecarrousel3, everyoneprofilecarrousel5,
  statsnplayerspagec1, statsnplayerspagec2,
];

const Profile = () => {
  const { user, login, loginWithGoogle, linkGoogleAccount, isLinking, googleEmail, setIsLinking } = useAuth();
  const { toast } = useToast();
  const badgeChecked = useRef(false);
  const [memberId, setMemberId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [linkId, setLinkId] = useState("");
  const [linkError, setLinkError] = useState("");

  const isPlayer = (() => {
    const afterDash = memberId.split("-")[1] || "";
    return afterDash.toUpperCase().includes("P");
  })();

  const isOfficialId = (() => {
    const upper = memberId.toUpperCase();
    if (!upper.startsWith("SCF-")) return false;
    const afterDash = upper.split("-")[1] || "";
    return afterDash.length > 0 && !afterDash.includes("P") && /^\d+$/.test(afterDash);
  })();

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const result = await (isPlayer ? login(memberId) : login(memberId, pin));
    if (!result.success) setError(result.error || "Invalid credentials");
    else {
      // Welcome toast
      const saved = localStorage.getItem("suncity_user");
      if (saved) {
        const u = JSON.parse(saved);
        toast({ title: `Welcome ${u.name}! 👋`, description: "You're now logged in." });
      }
    }
    setLoading(false);
  };

  const handleLinkAccount = async () => {
    setLinkError("");
    const result = await linkGoogleAccount(linkId);
    if (!result.success) setLinkError(result.error || "Failed to link account.");
  };

  // Listen for unread messages notification
  useEffect(() => {
    const handler = (e: Event) => {
      const count = (e as CustomEvent).detail;
      if (count > 0) {
        toast({ title: `📬 You have ${count} unread message${count > 1 ? "s" : ""}`, description: "Check your inbox." });
      }
    };
    window.addEventListener("suncity-unread", handler);
    return () => window.removeEventListener("suncity-unread", handler);
  }, [toast]);

  // POTM / Match Awards login badge notification
  useEffect(() => {
    if (!user || badgeChecked.current) return;
    badgeChecked.current = true;

    (async () => {
      const { data: potmData } = await supabase
        .from("match_performances")
        .select("player_id, game_id")
        .eq("is_potm", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (potmData && potmData.length > 0 && potmData[0].player_id === user.id) {
        const { data: game } = await supabase
          .from("game_scores")
          .select("opponent")
          .eq("id", potmData[0].game_id)
          .limit(1);
        const opponent = game?.[0]?.opponent || "last match";
        toast({ title: "🏆 Player of the Match!", description: `You were named POTM vs ${opponent}! Keep up the great work!` });
      }

      const { data: awards } = await supabase
        .from("match_awards" as any)
        .select("*")
        .eq("player_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      
      if (awards && awards.length > 0) {
        const nonPotmAward = (awards as any[]).find((a: any) => a.award_type !== "potm");
        if (nonPotmAward) {
          toast({ title: `${nonPotmAward.award_label}`, description: `${nonPotmAward.reason}` });
        }
      }

      if (user.role === "player" || user.role === "captain" || user.role === "finance") {
        const { data: logs } = await supabase
          .from("weekly_stats_log")
          .select("*")
          .eq("player_id", user.id)
          .order("week_start", { ascending: false })
          .limit(2);

        if (logs && logs.length === 2) {
          const recent = logs[0];
          const prev = logs[1];
          const recentTotal = (recent.goals || 0) + (recent.assists || 0) + (recent.successful_tackles || 0) + (recent.saves || 0);
          const prevTotal = (prev.goals || 0) + (prev.assists || 0) + (prev.successful_tackles || 0) + (prev.saves || 0);
          if (recentTotal > prevTotal && prevTotal > 0) {
            const pct = Math.round(((recentTotal - prevTotal) / prevTotal) * 100);
            if (pct >= 20) {
              toast({ title: "📈 Most Improved Player!", description: `Your stats improved by ${pct}% this week! Amazing progress!` });
            }
          }
        }
      }
    })();
  }, [user, toast]);

  // Google ID Linking Screen
  if (isLinking && !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center px-4 py-12">
          <Helmet><title>Link Account | SunCity FC</title></Helmet>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6 max-w-md w-full card-glow text-center">
            <img src={suncityBadge} alt="SunCity FC" className="w-16 h-16 mx-auto mb-4 object-contain" />
            <h3 className="font-heading text-lg text-primary mb-2">Link your SunCity ID with your Google account.</h3>
            <p className="text-sm text-muted-foreground font-body mb-4">
              You only need to do this once to permanently secure your account.
              <br /><span className="text-foreground font-medium">{googleEmail}</span>
            </p>
            <Input
              placeholder="e.g. SCF-P01 or SCF-001"
              value={linkId}
              onChange={(e) => { setLinkId(e.target.value.toUpperCase()); setLinkError(""); }}
              className="bg-secondary border-border font-body mb-3"
            />
            <Button onClick={handleLinkAccount} disabled={!linkId} className="w-full font-body mb-2">Link & Continue</Button>
            <Button variant="ghost" onClick={() => setIsLinking(false)} className="w-full font-body text-xs text-muted-foreground">
              Cancel
            </Button>
            {linkError && <p className="text-destructive text-sm mt-2 font-body">{linkError}</p>}
          </motion.div>
        </div>
      </div>
    );
  }

  // Not logged in — show inline login
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Helmet>
          <title>Login | SunCity FC</title>
          <meta name="description" content="Log in to your SunCity FC profile to view stats, match history, and team updates." />
        </Helmet>
        <Navbar />
        <main className="max-w-md mx-auto px-4 py-8 space-y-6">
          <div className="mx-auto max-w-xs border-2 border-primary/20 rounded-2xl overflow-hidden">
            <LottieCarousel animations={loginCarouselAnimations} interval={4000} className="h-44" />
          </div>

          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-card border border-border rounded-xl p-6 card-glow">
              <h3 className="font-heading text-sm text-primary text-center mb-6 tracking-wider">MEMBER LOGIN</h3>
              <div className="space-y-4">
                <Button onClick={loginWithGoogle} variant="outline" className="w-full font-body text-sm border-border hover:bg-secondary/50">
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Sign in with Google
                </Button>

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground font-body">or use Member ID</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

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
                        <Input type="password" placeholder="••••" maxLength={4} value={pin}
                          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                          className="bg-secondary border-border text-foreground placeholder:text-muted-foreground font-body tracking-[0.5em] text-center" />
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
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-destructive text-sm text-center mt-4 font-body">{error}</motion.p>
              )}
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  // Logged in — show appropriate profile
  if (user.role === "player" || user.role === "fan") {
    return <PlayerProfile />;
  }

  return <OfficialProfile />;
};

export default Profile;
