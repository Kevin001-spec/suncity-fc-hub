import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTeamData } from "@/contexts/TeamDataContext";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Trophy, Star, Footprints, Target, TrendingUp, Award, Gamepad2, 
  Calendar, Shield, Crosshair, Users, ChevronRight, X, BarChart3,
  Flame, Zap, Heart, Crown
} from "lucide-react";
import { getFullPositionName, getPositionGroup } from "@/data/team-data";
import { getStatsForPosition } from "@/lib/position-stats";
import LottieAnimation from "@/components/LottieAnimation";
import stats_profile from "@/assets/animations/stats_profile.json";
import { getAwardAnimation } from "@/lib/award-animations";

const StatCard = ({ label, value, icon: Icon, color, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-card border border-border p-4 rounded-xl flex items-center gap-4 card-glow group"
  >
    <div className={`p-3 rounded-lg ${color} text-white group-hover:scale-110 transition-transform`}>
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <p className="text-xs text-muted-foreground font-body uppercase tracking-wider">{label}</p>
      <p className="text-xl font-heading text-foreground">{value}</p>
    </div>
  </motion.div>
);

const PlayerModal = ({ member, profilePic, onClose }: any) => {
  const { matchPerformances, gameScores } = useTeamData();
  const playerPerfs = matchPerformances.filter(p => p.playerId === member.id);
  const avgRating = playerPerfs.length > 0 
    ? (playerPerfs.reduce((sum, p) => sum + p.rating, 0) / playerPerfs.length).toFixed(1) 
    : "N/A";
  
  const posGroup = getPositionGroup(member.position);
  const isFan = member.role === "fan";
  const isPlayerLike = member.role === "player" || member.role === "captain" || member.role === "finance";
  const hasStats = isPlayerLike && (member.goals || member.assists || member.gamesPlayed || member.saves || member.tackles);

  const roleLabel = member.role === "coach" ? "Head Coach" : member.role === "assistant_coach" ? "Assistant Coach"
    : member.role === "finance" ? "Finance Manager" : member.role === "captain" ? "Field Captain"
    : member.role === "manager" ? "Team Manager" : member.role === "fan" ? "Fan" : "Player";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-card border border-border rounded-xl p-6 w-full max-w-sm card-glow" onClick={(e) => e.stopPropagation()}>
        <div className="text-center">
          <Avatar className="w-20 h-20 mx-auto mb-4 border-2 border-primary">
            {profilePic && <AvatarImage src={profilePic} className="aspect-square object-cover object-center" />}
            <AvatarFallback className="bg-secondary text-primary font-heading text-xl">{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <h3 className="font-heading text-lg text-foreground">{member.name}</h3>
          <Badge className="bg-primary text-primary-foreground font-body mt-1">{roleLabel}</Badge>
          {member.position && <p className="text-muted-foreground font-body text-sm mt-1">{getFullPositionName(member.position)}</p>}
          {member.squadNumber && <p className="text-muted-foreground font-body text-sm mt-1">Squad #{member.squadNumber}</p>}

          {/* Fan-specific: badge, points, favourite moment */}
          {isFan && (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              {member.fanBadge && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30">
                  <Award className="w-4 h-4 text-primary" />
                  <span className="text-sm font-heading text-primary">{member.fanBadge}</span>
                </div>
              )}
              {member.fanPoints !== undefined && (
                <div className="bg-secondary/50 p-3 rounded-lg border border-border">
                  <p className="text-[10px] text-muted-foreground uppercase font-body tracking-wider">Fan Points</p>
                  <p className="text-2xl font-heading text-primary">{member.fanPoints} pts</p>
                </div>
              )}
              {member.favouriteMoment && (
                <div className="text-left">
                  <p className="text-[10px] text-muted-foreground uppercase font-body mb-1">Favourite Moment</p>
                  <p className="text-xs text-foreground italic font-body">"{member.favouriteMoment}"</p>
                </div>
              )}
            </div>
          )}

          {hasStats && (
            <div className="grid grid-cols-2 gap-3 mt-6 pt-6 border-t border-border">
              <div className="bg-secondary/50 p-3 rounded-lg border border-border">
                <p className="text-[10px] text-muted-foreground uppercase font-body">Games</p>
                <p className="text-lg font-heading text-foreground">{member.gamesPlayed || 0}</p>
              </div>
              <div className="bg-secondary/50 p-3 rounded-lg border border-border">
                <p className="text-[10px] text-muted-foreground uppercase font-body">Rating</p>
                <p className="text-lg font-heading text-primary">{avgRating}</p>
              </div>
              <div className="bg-secondary/50 p-3 rounded-lg border border-border">
                <p className="text-[10px] text-muted-foreground uppercase font-body">Goals</p>
                <p className="text-lg font-heading text-foreground">{member.goals || 0}</p>
              </div>
              <div className="bg-secondary/50 p-3 rounded-lg border border-border">
                <p className="text-[10px] text-muted-foreground uppercase font-body">Assists</p>
                <p className="text-lg font-heading text-foreground">{member.assists || 0}</p>
              </div>
            </div>
          )}
          <button className="mt-6 w-full py-2 rounded-lg bg-secondary text-foreground text-xs font-heading hover:bg-secondary/80 transition-colors"
            onClick={onClose}>Close Profile</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Stats = () => {
  const { members, matchPerformances, profilePics } = useTeamData();
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [tab, setTab] = useState("scorers");

  const playerMembers = members.filter(m => m.role === "player" || m.role === "captain" || m.role === "finance" || m.role === "manager");
  const fanMembers = members.filter(m => m.role === "fan");

  const topScorers = useMemo(() => 
    [...playerMembers].sort((a, b) => (b.goals || 0) - (a.goals || 0)).slice(0, 10),
  [playerMembers]);

  const topAssisters = useMemo(() => 
    [...playerMembers].sort((a, b) => (b.assists || 0) - (a.assists || 0)).slice(0, 10),
  [playerMembers]);

  const topRatings = useMemo(() => {
    return playerMembers.map(m => {
      const perfs = matchPerformances.filter(p => p.playerId === m.id);
      const avg = perfs.length > 0 ? perfs.reduce((sum, p) => sum + p.rating, 0) / perfs.length : 0;
      return { ...m, avgRating: avg, perfCount: perfs.length };
    }).filter(m => m.perfCount > 0).sort((a, b) => b.avgRating - a.avgRating).slice(0, 10);
  }, [playerMembers, matchPerformances]);

  const topFans = useMemo(() =>
    [...fanMembers].sort((a, b) => (b.fanPoints || 0) - (a.fanPoints || 0)).slice(0, 10),
  [fanMembers]);

  // Aggregate stats
  const totalGoals = playerMembers.reduce((sum, m) => sum + (m.goals || 0), 0);
  const totalGames = useMemo(() => {
    const gameIds = new Set(matchPerformances.map(p => p.gameId));
    return gameIds.size;
  }, [matchPerformances]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-4xl mx-auto p-4 pt-24 pb-12">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center gap-6 mb-12">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-primary/20 shadow-2xl overflow-hidden bg-card card-glow">
            <LottieAnimation animationData={stats_profile} className="w-full h-full scale-110" />
          </div>
          <div className="text-center md:text-left">
            <Badge className="bg-primary/10 text-primary border-primary/30 font-heading mb-2">SEASON 2025/26</Badge>
            <h1 className="text-4xl md:text-5xl font-heading text-foreground mb-2">Team Analytics</h1>
            <p className="text-muted-foreground font-body max-w-md">
              Tracking every goal, assist, and match performance across the SunCity FC squad.
            </p>
          </div>
        </div>

        {/* Aggregate Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <StatCard label="Total Goals" value={totalGoals} icon={Target} color="bg-blue-600" delay={0.1} />
          <StatCard label="Games Played" value={totalGames} icon={Gamepad2} color="bg-green-600" delay={0.2} />
          <StatCard label="Squad Size" value={members.length} icon={Users} color="bg-purple-600" delay={0.3} />
          <StatCard label="Match Rating" value={topRatings[0]?.avgRating.toFixed(1) || "0.0"} icon={TrendingUp} color="bg-yellow-600" delay={0.4} />
        </div>

        {/* Leaderboards */}
        <Tabs defaultValue="scorers" onValueChange={setTab} className="space-y-8">
          <TabsList className="w-full grid grid-cols-4 bg-secondary/50 h-12 p-1 rounded-xl">
            <TabsTrigger value="scorers" className="rounded-lg font-heading text-xs">Scorers</TabsTrigger>
            <TabsTrigger value="assists" className="rounded-lg font-heading text-xs">Assists</TabsTrigger>
            <TabsTrigger value="ratings" className="rounded-lg font-heading text-xs">Ratings</TabsTrigger>
            <TabsTrigger value="fans" className="rounded-lg font-heading text-xs">Fans</TabsTrigger>
          </TabsList>

          <AnimatePresence mode="wait">
            <TabsContent value="scorers" className="mt-0">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-3">
                {topScorers.map((player, i) => (
                  <motion.div key={player.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedMember(player)}
                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <span className="font-heading text-lg text-muted-foreground w-6">{i + 1}</span>
                      <Avatar className="w-10 h-10 border border-primary/20">
                        {profilePics[player.id] && <AvatarImage src={profilePics[player.id]} className="aspect-square object-cover object-center" />}
                        <AvatarFallback className="bg-secondary text-primary font-heading text-xs">{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-heading text-sm text-foreground">{player.name}</p>
                        <p className="text-[10px] text-muted-foreground font-body uppercase">{getFullPositionName(player.position)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-heading text-xl text-primary">{player.goals || 0}</p>
                        <p className="text-[10px] text-muted-foreground font-body uppercase">Goals</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </TabsContent>

            <TabsContent value="assists" className="mt-0">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-3">
                {topAssisters.map((player, i) => (
                  <motion.div key={player.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedMember(player)}
                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <span className="font-heading text-lg text-muted-foreground w-6">{i + 1}</span>
                      <Avatar className="w-10 h-10 border border-primary/20">
                        {profilePics[player.id] && <AvatarImage src={profilePics[player.id]} className="aspect-square object-cover object-center" />}
                        <AvatarFallback className="bg-secondary text-primary font-heading text-xs">{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-heading text-sm text-foreground">{player.name}</p>
                        <p className="text-[10px] text-muted-foreground font-body uppercase">{getFullPositionName(player.position)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-heading text-xl text-primary">{player.assists || 0}</p>
                        <p className="text-[10px] text-muted-foreground font-body uppercase">Assists</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </TabsContent>

            <TabsContent value="ratings" className="mt-0">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-3">
                {topRatings.map((player, i) => (
                  <motion.div key={player.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedMember(player)}
                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <span className="font-heading text-lg text-muted-foreground w-6">{i + 1}</span>
                      <Avatar className="w-10 h-10 border border-primary/20">
                        {profilePics[player.id] && <AvatarImage src={profilePics[player.id]} className="aspect-square object-cover object-center" />}
                        <AvatarFallback className="bg-secondary text-primary font-heading text-xs">{player.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-heading text-sm text-foreground">{player.name}</p>
                        <p className="text-[10px] text-muted-foreground font-body uppercase">Avg. Rating</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-heading text-xl text-yellow-600">{player.avgRating.toFixed(1)}</p>
                        <p className="text-[10px] text-muted-foreground font-body uppercase">{player.perfCount} Match{player.perfCount !== 1 ? 'es' : ''}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </TabsContent>

            <TabsContent value="fans" className="mt-0">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-3">
                {topFans.map((fan, i) => (
                  <motion.div key={fan.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedMember(fan)}
                    className="flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <span className="font-heading text-lg text-muted-foreground w-6">{i + 1}</span>
                      <Avatar className="w-10 h-10 border border-primary/20">
                        {profilePics[fan.id] && <AvatarImage src={profilePics[fan.id]} className="aspect-square object-cover object-center" />}
                        <AvatarFallback className="bg-secondary text-primary font-heading text-xs">{fan.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-heading text-sm text-foreground">{fan.name}</p>
                        {fan.fanBadge && <Badge variant="outline" className="text-[9px] border-primary/40 text-primary uppercase">{fan.fanBadge}</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-heading text-xl text-primary">{fan.fanPoints || 0}</p>
                        <p className="text-[10px] text-muted-foreground font-body uppercase">Fan Pts</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>

        {/* Player of the Season Mockup Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 p-8 rounded-2xl bg-gradient-to-br from-primary/10 via-background to-secondary/30 border border-primary/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 items-center gap-8">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 mb-4">
                <Crown className="w-4 h-4" />
                <span className="text-xs font-heading uppercase">Current MVP Leader</span>
              </div>
              <h2 className="text-4xl font-heading text-foreground mb-4">Season Spotlight</h2>
              <p className="text-muted-foreground font-body mb-6">
                Based on overall contribution, goals, and consistency across all matches played this season.
              </p>
              <Button onClick={() => setSelectedMember(topScorers[0])} className="font-heading h-11 px-8 rounded-xl shadow-lg shadow-primary/20">
                View Leader Profile
              </Button>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative">
                <Avatar className="w-40 h-40 border-4 border-primary/20 shadow-2xl">
                  {profilePics[topScorers[0]?.id] && <AvatarImage src={profilePics[topScorers[0]?.id]} className="aspect-square object-cover" />}
                  <AvatarFallback className="bg-secondary text-primary font-heading text-3xl">{topScorers[0]?.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
                  <LottieAnimation animationData={getAwardAnimation("top_scorer")} className="w-32 h-32" />
                </div>
              </div>
              <p className="mt-8 font-heading text-xl text-foreground">{topScorers[0]?.name}</p>
              <p className="text-sm text-primary font-body font-bold">{topScorers[0]?.goals || 0} Goals this season</p>
            </div>
          </div>
        </motion.div>
      </main>

      <AnimatePresence>
        {selectedMember && (
          <PlayerModal 
            member={selectedMember} 
            profilePic={profilePics[selectedMember.id]} 
            onClose={() => setSelectedMember(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Stats;
