import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamData } from "@/contexts/TeamDataContext";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import {
  Trophy, Calendar, BookOpen, Download,
  Flame, Shield, Star, Heart, Swords,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { type GameScore, type TeamMember, teamBackground } from "@/data/team-data";
import useEmblaCarousel from "embla-carousel-react";
import suncityBadge from "@/assets/suncity-badge.png";
import LottieAnimation from "@/components/LottieAnimation";
import dashboardAnimation from "@/assets/animations/dashboardanimation.json";

const fadeUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } };

const ScoreCard = ({ game, members: allMembers }: { game: GameScore; members: TeamMember[] }) => (
  <div className="py-3 border-b border-border last:border-0">
    <div className="flex items-center justify-between">
      <div className="font-body">
        <p className="text-foreground font-medium">vs {game.opponent}</p>
        <p className="text-xs text-muted-foreground">{new Date(game.date).toLocaleDateString()}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-heading text-lg text-primary">{game.ourScore}</span>
        <span className="text-muted-foreground">-</span>
        <span className="font-heading text-lg text-muted-foreground">{game.theirScore}</span>
        <Badge variant="outline" className={`ml-2 text-xs font-body ${
          game.ourScore > game.theirScore ? "border-green-500/30 text-green-600"
          : game.ourScore < game.theirScore ? "border-destructive/30 text-destructive"
          : "border-primary/30 text-primary"
        }`}>
          {game.ourScore > game.theirScore ? "W" : game.ourScore < game.theirScore ? "L" : "D"}
        </Badge>
      </div>
    </div>
    {game.scorers && game.scorers.length > 0 && (
      <p className="text-xs text-muted-foreground mt-1 font-body">
        ⚽ {game.scorers.map((sid) => allMembers.find((m) => m.id === sid)?.name || sid).join(", ")}
      </p>
    )}
  </div>
);

const storyIcons: Record<string, typeof Flame> = { origin: Flame, struggle: Shield, coachImpact: Star, acknowledgements: Heart, values: Swords };
const storyTitles: Record<string, string> = { origin: "THE BEGINNING", struggle: "THE STRUGGLE", coachImpact: "COACH FABIAN'S IMPACT", acknowledgements: "ACKNOWLEDGEMENTS", values: "OUR VALUES" };
const storyAccents: Record<string, string> = { origin: "border-l-primary", struggle: "border-l-destructive", coachImpact: "border-l-green-500", acknowledgements: "border-l-pink-500", values: "border-l-[hsl(220,70%,40%)]" };

const StorySection = ({ sectionKey, text }: { sectionKey: string; text: string }) => {
  const Icon = storyIcons[sectionKey] || BookOpen;
  const title = storyTitles[sectionKey] || sectionKey;
  const accent = storyAccents[sectionKey] || "border-l-primary";
  const sentences = text.split(". ").filter(Boolean);
  const highlightIdx = Math.floor(sentences.length / 2);
  return (
    <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className={`border-l-4 ${accent} pl-4 py-3 rounded-r-lg navy-accent`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div>
        <h4 className="font-heading text-xs text-primary tracking-wider">{title}</h4>
      </div>
      <div className="space-y-2 font-body text-sm text-muted-foreground leading-relaxed">
        {sentences.map((sentence, i) => {
          const s = sentence.endsWith(".") ? sentence : sentence + ".";
          if (i === highlightIdx) return <p key={i} className="text-foreground font-medium italic border-l-2 border-primary/30 pl-3 my-3">"{s.trim()}"</p>;
          return <p key={i}>{s.trim()}</p>;
        })}
      </div>
    </motion.div>
  );
};

// Individual carousel per date group to fix scroll bug
const DateGallery = ({ items }: { items: { id: string; url: string; caption?: string }[] }) => {
  const [emblaRef] = useEmblaCarousel({ loop: true, align: "start" });
  return (
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex-[0_0_200px] min-w-0">
            <div className="relative group">
              <img src={item.url} alt={item.caption || "Team photo"} className="w-full h-40 object-cover rounded-lg border border-border" loading="lazy" />
              <a href={item.url} download className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                <Download className="w-6 h-6 text-white" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MediaGallery = () => {
  const { mediaItems } = useTeamData();

  if (mediaItems.length === 0) return null;

  const grouped = mediaItems.reduce((acc, item) => {
    const dateKey = item.date.split("T")[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, typeof mediaItems>);
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a)).slice(0, 2);

  return (
    <div className="space-y-4">
      {sortedDates.map((date) => (
        <div key={date}>
          <p className="text-xs text-muted-foreground font-body mb-2">{new Date(date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          <DateGallery items={grouped[date]} />
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { members, gameScores, calendarEvents, mediaItems } = useTeamData();

  const recentScores = gameScores.slice(0, 3);
  const upcomingEvents = useMemo(() => {
    const now = new Date(); now.setHours(0, 0, 0, 0);
    return calendarEvents.filter((e) => { const d = new Date(e.date); d.setHours(23, 59, 59, 999); return d >= now; }).slice(0, 3);
  }, [calendarEvents]);

  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <motion.section {...fadeUp} className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white border-2 border-primary/40 mb-4 overflow-hidden shadow-md">
            <img src={suncityBadge} alt="Suncity FC" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold gold-text text-shadow-gold">SUNCITY FC</h1>
          <p className="text-muted-foreground mt-2 tracking-[0.3em] uppercase text-sm font-body">Discipline • Unity • Victory</p>
          <div className="mt-4 mx-auto max-w-xs border-2 border-primary/20 rounded-2xl overflow-hidden">
            <LottieAnimation animationData={dashboardAnimation} className="h-36" />
          </div>
        </motion.section>

        <div className="grid md:grid-cols-2 gap-6">
          <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-foreground font-heading text-lg">
                  <Trophy className="w-5 h-5 text-primary" /> Recent Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentScores.length === 0 ? <p className="text-muted-foreground text-sm font-body">No results yet</p>
                  : recentScores.map((game) => <ScoreCard key={game.id} game={game} members={members} />)}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-foreground font-heading text-lg">
                  <Calendar className="w-5 h-5 text-primary" /> Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingEvents.length === 0 ? <p className="text-muted-foreground text-sm font-body">No events scheduled</p>
                  : upcomingEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-primary font-heading text-xs">{new Date(event.date).getDate()}</span>
                    </div>
                    <div className="font-body">
                      <p className="text-foreground font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{event.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {mediaItems.length > 0 && (
          <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-foreground font-heading text-lg">Team Gallery</CardTitle>
              </CardHeader>
              <CardContent><MediaGallery /></CardContent>
            </Card>
          </motion.div>
        )}

        <motion.div {...fadeUp} transition={{ delay: 0.4 }}>
          <Card className="bg-card border-border card-glow overflow-hidden">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="flex items-center gap-2 text-foreground font-heading text-lg">
                <BookOpen className="w-5 h-5 text-primary" /> Our Story
              </CardTitle>
              <p className="text-xs text-muted-foreground font-body mt-1">The journey of Sun City FC</p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {Object.entries(teamBackground).filter(([k]) => k !== "contributions").map(([key, text]) => <StorySection key={key} sectionKey={key} text={text} />)}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
