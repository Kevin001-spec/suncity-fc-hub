import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamData } from "@/contexts/TeamDataContext";
import { Lock, Flame, Shield, Star, Heart, Swords, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import useEmblaCarousel from "embla-carousel-react";
import suncityBadge from "@/assets/suncity-badge.png";
import { teamBackground } from "@/data/team-data";

const storyIcons: Record<string, typeof Flame> = { origin: Flame, struggle: Shield, coachImpact: Star, acknowledgements: Heart, values: Swords };
const storyTitles: Record<string, string> = { origin: "THE BEGINNING", struggle: "THE STRUGGLE", coachImpact: "COACH FABIAN'S IMPACT", acknowledgements: "ACKNOWLEDGEMENTS", values: "OUR VALUES" };

const StoryBlock = ({ sectionKey, text }: { sectionKey: string; text: string }) => {
  const Icon = storyIcons[sectionKey] || BookOpen;
  const title = storyTitles[sectionKey] || sectionKey;
  const sentences = text.split(". ").filter(Boolean);
  const highlightIdx = Math.floor(sentences.length / 2);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
      className="border-l-4 border-l-primary pl-4 py-3 rounded-r-lg navy-accent">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div>
        <h4 className="font-heading text-xs text-primary tracking-wider">{title}</h4>
      </div>
      <div className="space-y-2 font-body text-sm text-secondary-foreground leading-relaxed">
        {sentences.map((sentence, i) => {
          const s = sentence.endsWith(".") ? sentence : sentence + ".";
          if (i === highlightIdx) return <p key={i} className="text-foreground font-medium italic border-l-2 border-primary/30 pl-3 my-3">"{s.trim()}"</p>;
          return <p key={i}>{s.trim()}</p>;
        })}
      </div>
    </motion.div>
  );
};

const Login = () => {
  const { login } = useAuth();
  const { gameScores, homepageImages } = useTeamData();
  const navigate = useNavigate();
  const [memberId, setMemberId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });

  // Auto-scroll carousel
  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => emblaApi.scrollNext(), 4000);
    return () => clearInterval(interval);
  }, [emblaApi]);

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

  const recentResults = gameScores.slice(0, 3);

  // Exclude "contributions" section from story
  const storyEntries = Object.entries(teamBackground).filter(([key]) => key !== "contributions");

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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-primary/3 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full navy-bg opacity-20 blur-3xl" />
        </div>

        <div className="relative z-10 text-center py-16 px-4">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-28 h-28 rounded-full bg-white border-2 border-primary/50 mb-6 overflow-hidden">
            <img src={suncityBadge} alt="Suncity FC Official Team Badge" className="w-24 h-24 object-contain" />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-4xl md:text-6xl font-heading font-bold gold-text text-shadow-gold tracking-wider">
            SUNCITY FC
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-muted-foreground mt-3 text-sm tracking-[0.3em] uppercase font-body">
            Discipline • Unity • Victory
          </motion.p>
        </div>
      </header>

      {/* Feature Carousel */}
      {homepageImages.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 py-8">
          <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
            <div className="flex">
              {homepageImages.map((img, i) => (
                <div key={img.id} className="flex-[0_0_100%] sm:flex-[0_0_50%] min-w-0 px-2">
                  <img src={img.url} alt={`SunCity FC team photo ${i + 1}`}
                    className="w-full h-56 sm:h-72 object-cover rounded-xl border border-border" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Our Story */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="font-heading text-2xl gold-text text-center mb-8">Our Story</h2>
          <div className="space-y-6">
            {storyEntries.map(([key, text]) => (
              <StoryBlock key={key} sectionKey={key} text={text} />
            ))}
          </div>
        </motion.div>
      </section>

      {/* Recent Results */}
      {recentResults.length > 0 && (
        <section className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="font-heading text-xl gold-text text-center mb-6">Recent Results</h2>
          <div className="overflow-x-auto">
            <table className="w-full font-body text-sm border border-border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-secondary border-b border-border">
                  <th className="text-left py-3 px-4 text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 text-muted-foreground">Opponent</th>
                  <th className="text-center py-3 px-4 text-muted-foreground">Score</th>
                  <th className="text-center py-3 px-4 text-muted-foreground">Result</th>
                </tr>
              </thead>
              <tbody>
                {recentResults.map((game) => (
                  <tr key={game.id} className="border-b border-border">
                    <td className="py-3 px-4 text-muted-foreground">{new Date(game.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-foreground font-medium">{game.opponent}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-primary font-heading">{game.ourScore}</span>
                      <span className="text-muted-foreground mx-1">-</span>
                      <span className="font-heading text-muted-foreground">{game.theirScore}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="outline" className={`text-xs ${
                        game.ourScore > game.theirScore ? "border-green-500/30 text-green-400"
                        : game.ourScore < game.theirScore ? "border-destructive/30 text-destructive"
                        : "border-primary/30 text-primary"
                      }`}>
                        {game.ourScore > game.theirScore ? "W" : game.ourScore < game.theirScore ? "L" : "D"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Login Section */}
      <section className="max-w-md mx-auto px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
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

          <p className="text-center text-muted-foreground text-xs mt-6 font-body">© 2026 Suncity FC — All Rights Reserved</p>
        </motion.div>
      </section>
    </div>
  );
};

export default Login;
