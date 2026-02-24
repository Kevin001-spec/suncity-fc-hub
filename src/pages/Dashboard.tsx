import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamData } from "@/contexts/TeamDataContext";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import {
  Trophy, Calendar, Users, BookOpen, ChevronRight, Download,
  Flame, Shield, Star, Heart, Swords, Handshake,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type TeamMember, type GameScore, teamBackground } from "@/data/team-data";
import useEmblaCarousel from "embla-carousel-react";
import suncityBadge from "@/assets/suncity-badge.png";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const PlayerCard = ({ member, profilePic, onClose }: { member: TeamMember; profilePic?: string; onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
    onClick={onClose}
  >
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className="bg-card border border-border rounded-xl p-6 w-full max-w-sm card-glow" onClick={(e) => e.stopPropagation()}>
      <div className="text-center">
        <Avatar className="w-20 h-20 mx-auto mb-4 border-2 border-primary">
          {profilePic && <AvatarImage src={profilePic} />}
          <AvatarFallback className="bg-secondary text-primary font-heading text-xl">{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <h3 className="font-heading text-lg text-foreground">{member.name}</h3>
        <p className="text-primary font-body text-sm">{member.id}</p>
        <Badge variant="outline" className="mt-2 border-primary/30 text-primary capitalize font-body">{member.role}</Badge>
        {member.squadNumber && <p className="text-muted-foreground font-body text-sm mt-2">Squad #{member.squadNumber}</p>}
        <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-border">
          <div><p className="text-xl font-heading text-primary">{member.goals || 0}</p><p className="text-xs text-muted-foreground font-body">Goals</p></div>
          <div><p className="text-xl font-heading text-primary">{member.assists || 0}</p><p className="text-xs text-muted-foreground font-body">Assists</p></div>
          <div><p className="text-xl font-heading text-primary">{member.gamesPlayed || 0}</p><p className="text-xs text-muted-foreground font-body">Games</p></div>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

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
          game.ourScore > game.theirScore ? "border-green-500/30 text-green-400"
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

const storyIcons: Record<string, typeof Flame> = { origin: Flame, struggle: Shield, coachImpact: Star, acknowledgements: Heart, values: Swords, contributions: Handshake };
const storyTitles: Record<string, string> = { origin: "THE BEGINNING", struggle: "THE STRUGGLE", coachImpact: "COACH FABIAN'S IMPACT", acknowledgements: "ACKNOWLEDGEMENTS", values: "OUR VALUES", contributions: "COMMITMENT" };
const storyAccents: Record<string, string> = { origin: "border-l-primary", struggle: "border-l-destructive", coachImpact: "border-l-green-500", acknowledgements: "border-l-pink-500", values: "navy-border border-l-[hsl(220,60%,40%)]", contributions: "border-l-primary" };

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

const MediaGallery = () => {
  const { mediaItems } = useTeamData();
  const [emblaRef] = useEmblaCarousel({ loop: true, align: "start" });

  if (mediaItems.length === 0) {
    return <div className="flex items-center justify-center h-40 rounded-lg border border-dashed border-border text-muted-foreground font-body text-sm">No media uploaded yet — Officials can upload from their profile</div>;
  }

  const grouped = mediaItems.reduce((acc, item) => {
    const dateKey = item.date.split("T")[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {} as Record<string, typeof mediaItems>);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <p className="text-xs text-muted-foreground font-body mb-2">📅 {new Date(date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-3">
              {items.map((item) => (
                <div key={item.id} className="flex-[0_0_200px] min-w-0">
                  <div className="relative group">
                    <img src={item.url} alt={item.caption || "Team photo"} className="w-full h-40 object-cover rounded-lg border border-border" />
                    <a href={item.url} download className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                      <Download className="w-6 h-6 text-primary" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const { members, gameScores, calendarEvents, profilePics } = useTeamData();
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  // Dashboard: max 3 recent results, newest first
  const recentScores = gameScores.slice(0, 3);

  // Dashboard: max 3 upcoming events, filter out past events (end of day)
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return calendarEvents
      .filter((e) => {
        const eventDate = new Date(e.date);
        eventDate.setHours(23, 59, 59, 999);
        return eventDate >= now;
      })
      .slice(0, 3);
  }, [calendarEvents]);

  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        <motion.section {...fadeUp} className="text-center py-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border-2 border-primary/40 bg-secondary mb-4 overflow-hidden">
            <img src={suncityBadge} alt="Suncity FC" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold gold-text text-shadow-gold">SUNCITY FC</h1>
          <p className="text-muted-foreground mt-2 tracking-[0.3em] uppercase text-sm font-body">Discipline • Unity • Victory</p>
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
                {recentScores.length === 0 ? (
                  <p className="text-muted-foreground text-sm font-body">No results yet</p>
                ) : (
                  recentScores.map((game) => <ScoreCard key={game.id} game={game} members={members} />)
                )}
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
                {upcomingEvents.length === 0 ? (
                  <p className="text-muted-foreground text-sm font-body">No events scheduled</p>
                ) : (
                  upcomingEvents.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-primary font-heading text-xs">{new Date(event.date).getDate()}</span>
                      </div>
                      <div className="font-body">
                        <p className="text-foreground font-medium text-sm">{event.title}</p>
                        <p className="text-xs text-muted-foreground">{event.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
          <Card className="bg-card border-border card-glow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground font-heading text-lg">📸 Team Gallery</CardTitle>
            </CardHeader>
            <CardContent><MediaGallery /></CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.4 }}>
          <Card className="bg-card border-border card-glow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-foreground font-heading text-lg">
                <Users className="w-5 h-5 text-primary" /> Team Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {members.map((member) => (
                  <button key={member.id} onClick={() => setSelectedMember(member)}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary border border-transparent hover:border-primary/20 transition-all group text-left">
                    <Avatar className="w-8 h-8 border border-border group-hover:border-primary/30 transition-colors">
                      {profilePics[member.id] && <AvatarImage src={profilePics[member.id]} />}
                      <AvatarFallback className="bg-muted text-primary font-heading text-xs">{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-body font-medium text-foreground truncate">{member.name}</p>
                      <p className="text-xs text-muted-foreground font-body capitalize">{member.role}</p>
                    </div>
                    <ChevronRight className="w-3 h-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...fadeUp} transition={{ delay: 0.5 }}>
          <Card className="bg-card border-border card-glow overflow-hidden">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="flex items-center gap-2 text-foreground font-heading text-lg">
                <BookOpen className="w-5 h-5 text-primary" /> Our Story
              </CardTitle>
              <p className="text-xs text-muted-foreground font-body mt-1">The journey of Sun City FC — from dusty fields to league glory</p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {Object.entries(teamBackground).map(([key, text]) => <StorySection key={key} sectionKey={key} text={text} />)}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      {selectedMember && <PlayerCard member={selectedMember} profilePic={profilePics[selectedMember.id]} onClose={() => setSelectedMember(null)} />}
    </div>
  );
};

export default Dashboard;
