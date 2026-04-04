import { useRef, useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamData } from "@/contexts/TeamDataContext";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Target, Footprints, Gamepad2, Upload, Calendar, Download, Shield, Hand, Crosshair, MessageCircle, Send, Star, Heart, Trophy, MapPin, Award } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/hooks/use-toast";
import { getContribMonthsForMember, getFullPositionName, getPositionGroup, type WeeklyStatsLog, type PlayerGameLog } from "@/data/team-data";
import { generatePlayerProfileDocx } from "@/lib/docx-export";
import { getStatsForPosition } from "@/lib/position-stats";
import { supabase } from "@/integrations/supabase/client";
import LottieAnimation from "@/components/LottieAnimation";
import LottieCarousel from "@/components/LottieCarousel";
import allmembersProfile from "@/assets/animations/allmembers_profile.json";
import { getAwardAnimation } from "@/lib/award-animations";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const iconMap: Record<string, any> = {
  saves: Hand, cleanSheets: Shield, aerialDuels: Crosshair,
  interceptions: Crosshair, assists: Footprints,
  goals: Target, directShots: Target, successfulTackles: Shield,
  gamesPlayed: Gamepad2,
};

const PlayerProfile = () => {
  const { user } = useAuth();
  const { members, profilePics, uploadProfilePicToStorage, uploadMediaToStorage, attendance, currentWeekStart, gameScores, sendMessage, updateFavouriteMoment, loadWeeklyStatsLogs, loadPlayerGameLogs } = useTeamData();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [msgRecipient, setMsgRecipient] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [weeklyLogs, setWeeklyLogs] = useState<WeeklyStatsLog[]>([]);
  const [momentText, setMomentText] = useState("");
  const [playerGameLogs, setPlayerGameLogs] = useState<PlayerGameLog[]>([]);
  const [recentAward, setRecentAward] = useState<any>(null);
  const [historicalAwards, setHistoricalAwards] = useState<any[]>([]);
  const [trophyCabinetOpen, setTrophyCabinetOpen] = useState(false);

  const liveMember = members.find((m) => m.id === user?.id) || user;
  const isFan = user?.role === "fan";
  const isFabianExempt = user?.id === "SCF-001";
  const posGroup = getPositionGroup(liveMember?.position);
  const dayOfWeek = new Date().getDay();
  const showExport = dayOfWeek >= 5 || dayOfWeek === 0;
  const [detailedExportEnabled, setDetailedExportEnabled] = useState(false);
  const [matchPerfsForExport, setMatchPerfsForExport] = useState<any[]>([]);
  const [matchAwardsForExport, setMatchAwardsForExport] = useState<any[]>([]);
  const showDetailedExport = showExport || detailedExportEnabled;

  // Load weekly stats logs, export_enabled, match perfs & awards
  useEffect(() => {
    if (user?.id && !isFan) {
      loadWeeklyStatsLogs(user.id).then(setWeeklyLogs);
      loadPlayerGameLogs(user.id).then(setPlayerGameLogs);
      supabase.from("season_config").select("*").order("created_at", { ascending: false }).limit(1).then(({ data }) => {
        if (data && data.length > 0 && (data[0] as any).export_enabled) setDetailedExportEnabled(true);
      });
      supabase.from("match_performances").select("*").eq("player_id", user.id).order("created_at", { ascending: false }).then(({ data }) => {
        if (data) setMatchPerfsForExport(data);
      });
      supabase.from("match_awards" as any).select("*").eq("player_id", user.id).order("created_at", { ascending: false }).then(({ data }: any) => {
        if (data) {
          setMatchAwardsForExport(data);
          if (data.length > 0) {
            setRecentAward(data[0]);
            setHistoricalAwards(data.slice(1));
          }
        }
      });
    }
  }, [user?.id, isFan]);

  // Init moment text
  useEffect(() => {
    if (isFan && liveMember?.favouriteMoment) {
      setMomentText(liveMember.favouriteMoment);
    }
  }, [isFan, liveMember?.favouriteMoment]);

  if (!user) return <Navigate to="/" replace />;

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast({ title: "Compressing & uploading...", description: "Processing your photo..." });
    const url = await uploadProfilePicToStorage(user.id, file);
    if (url) toast({ title: "Profile Updated", description: "Your profile picture has been saved permanently." });
    else toast({ title: "Upload Failed", description: "Could not upload profile picture.", variant: "destructive" });
    e.target.value = "";
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    toast({ title: "Compressing & uploading...", description: `Processing ${files.length} photo(s)...` });
    await uploadMediaToStorage(Array.from(files), user.name);
    toast({ title: "Media Uploaded", description: `${files.length} photo(s) uploaded to gallery.` });
    e.target.value = "";
  };

  const myAttendance = attendance.filter((a) => a.playerId === user.id);

  const opponentsPlayed = gameScores
    .filter(game => game.scorers?.includes(user.id))
    .map(game => ({ opponent: game.opponent, date: game.date, result: `${game.ourScore}-${game.theirScore}` }));

  // Position-specific stats using centralized definition
  const statFields = getStatsForPosition(liveMember?.position);
  const statCards = isFan ? [] : statFields.map(sf => ({
    icon: iconMap[sf.key] || Target,
    label: sf.label,
    value: (liveMember as any)?.[sf.key] || 0,
  }));

  const memberContribMonths = getContribMonthsForMember(user.id);

  const handleExportProfile = async (detailed = false) => {
    const stats = statCards.map(s => ({ label: s.label, value: s.value }));
    const attDays = DAYS.map(day => {
      const record = myAttendance.find(a => a.day === day);
      return { day, status: record?.status || "absent" };
    });
    const contribs = memberContribMonths.map(m => ({
      month: m.label, status: liveMember.contributions[m.key] || "unpaid",
    }));

    let logsForExport: { weekStart: string; stats: { label: string; value: number }[] }[] | undefined;
    if (detailed && weeklyLogs.length > 0) {
      logsForExport = weeklyLogs.map(log => ({
        weekStart: log.weekStart,
        stats: statFields.map(sf => ({
          label: sf.label,
          value: (log as any)[sf.key] || 0,
        })),
      }));
    }

    // Build match history with detailed performance data
    const detailedMatchHistory = matchHistory.map(m => {
      const game = gameScores.find(g => g.opponent === m.opponent && new Date(g.date).toLocaleDateString() === m.date);
      const perf = game ? matchPerfsForExport.find((p: any) => p.game_id === game.id) : null;
      return { ...m, performance: perf };
    });

    // Build awards list
    const awardsForDoc = matchAwardsForExport.map((a: any) => ({
      label: a.award_label,
      reason: a.reason,
    }));

    await generatePlayerProfileDocx(
      liveMember.name, user.id, getFullPositionName(liveMember.position),
      stats, attDays, opponentsPlayed.map(o => ({ ...o, date: new Date(o.date).toLocaleDateString() })),
      contribs, profilePics[user.id], logsForExport,
      detailedMatchHistory.length > 0 ? detailedMatchHistory as any : undefined,
      awardsForDoc.length > 0 ? awardsForDoc : undefined,
    );
    toast({ title: detailed ? "📄 Detailed Profile Exported" : "📄 Weekly Profile Exported" });
  };

  const handleSendMessage = async () => {
    if (!msgRecipient || !msgContent.trim()) return;
    await sendMessage(user.id, msgRecipient, msgContent.trim());
    toast({ title: "Message Sent" });
    setMsgRecipient("");
    setMsgContent("");
  };

  const matchHistory = playerGameLogs.map(log => {
    const game = gameScores.find(g => g.id === log.gameId);
    if (!game) return null;
    return {
      opponent: game.opponent,
      date: new Date(game.date).toLocaleDateString(),
      result: `${game.ourScore}-${game.theirScore}`,
      gameType: game.gameType || "friendly",
      venue: game.venue || "—",
    };
  }).filter(Boolean) as { opponent: string; date: string; result: string; gameType: string; venue: string }[];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{liveMember.name} — SunCity FC Profile</title>
        <meta name="description" content={`${liveMember.name}'s player profile on SunCity FC. View stats, match history, and contributions.`} />
      </Helmet>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="flex flex-row items-center justify-center gap-3">
            <div className="relative">
              <Avatar className="w-20 h-20 border-2 border-primary">
                {profilePics[user.id] && <AvatarImage src={profilePics[user.id]} className="aspect-square object-cover object-center" />}
                <AvatarFallback className="bg-secondary text-primary font-heading text-2xl">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <button onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors">
                <Upload className="w-4 h-4" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePicUpload} />
            </div>
            <LottieAnimation animationData={allmembersProfile} className="w-10 h-10 md:w-16 md:h-16" />
          </div>
          <h2 className="font-heading text-2xl text-foreground mt-4">{liveMember.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Badge className="bg-primary text-primary-foreground font-body capitalize">{user.role}</Badge>
          </div>
          {liveMember.position && <p className="text-muted-foreground font-body text-sm mt-1">{getFullPositionName(liveMember.position)}</p>}
        </motion.div>

        {/* Stats */}
        {!isFan && statCards.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground">Performance Stats</CardTitle></CardHeader>
              <CardContent>
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(statCards.length, 5)}, 1fr)` }}>
                  {statCards.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="text-center">
                      <Icon className="w-5 h-5 text-primary mx-auto mb-1" />
                      <p className="text-xl font-heading text-foreground">{value}</p>
                      <p className="text-[10px] text-muted-foreground font-body">{label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recent Honour */}
        {!isFan && recentAward && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
            <div className="border-2 border-yellow-500 rounded-lg p-4 bg-card">
              <div className="flex items-center gap-3">
                <LottieAnimation animationData={getAwardAnimation(recentAward.award_type)} className="w-16 h-16" />
                <div>
                  <p className="font-heading text-sm text-foreground">{recentAward.award_label}</p>
                  <p className="text-xs text-muted-foreground font-body italic">{recentAward.reason}</p>
                </div>
              </div>
              {historicalAwards.length > 0 && (
                <Button size="sm" variant="outline" onClick={() => setTrophyCabinetOpen(true)} className="mt-3 font-body text-xs w-full border-primary/30 text-primary">
                  <Award className="w-3 h-3 mr-1" /> View Award History ({historicalAwards.length})
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* Trophy Cabinet Modal */}
        <Dialog open={trophyCabinetOpen} onOpenChange={setTrophyCabinetOpen}>
          <DialogContent className="max-w-md bg-card border-border">
            <DialogHeader><DialogTitle className="font-heading text-primary">🏆 Trophy Cabinet</DialogTitle></DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
              {historicalAwards.map((award: any, i: number) => (
                <div key={i} className="border border-border rounded-lg p-3 text-center">
                  <LottieAnimation animationData={getAwardAnimation(award.award_type)} className="h-20 w-20 mx-auto" />
                  <p className="font-heading text-xs text-foreground mt-2">{award.award_label}</p>
                  <p className="text-[10px] text-muted-foreground font-body italic">{award.reason}</p>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {isFan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Heart className="w-5 h-5 text-primary" /> Fan Profile</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {liveMember.fanBadge && (
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    <Badge className="bg-primary text-primary-foreground">{liveMember.fanBadge}</Badge>
                  </div>
                )}
                <div className="flex gap-4">
                  <div className="text-center flex-1 p-3 bg-secondary/50 rounded-lg">
                    <Star className="w-5 h-5 text-primary mx-auto mb-1" />
                    <p className="text-2xl font-heading text-primary">{liveMember.fanPoints || 0}</p>
                    <p className="text-xs text-muted-foreground font-body">Fan Points</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-body text-muted-foreground">My Favourite Sun City Moment</label>
                  <Textarea value={momentText} onChange={(e) => setMomentText(e.target.value)}
                    placeholder="Share your favourite team moment..."
                    className="bg-secondary border-border font-body" />
                  <Button onClick={async () => {
                    await updateFavouriteMoment(user.id, momentText);
                    toast({ title: "Moment Saved!" });
                  }} size="sm" className="font-body">Save Moment</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Training Attendance */}
        {!isFan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Calendar className="w-5 h-5 text-primary" /> Training Attendance</CardTitle></CardHeader>
              <CardContent>
                <div className="flex gap-3 justify-center">
                  {DAYS.map((day) => {
                    const record = myAttendance.find((a) => a.day === day);
                    const status = record?.status || "";
                    const display = status === "present" ? "✅" : status === "excused" ? "🔵" : status === "no_activity" ? "➖" : "⬜";
                    const colors = status === "present" ? "border-green-500/40 bg-green-500/10"
                      : status === "excused" ? "border-blue-500/40 bg-blue-500/10"
                      : status === "no_activity" ? "border-border bg-muted/30"
                      : "border-border bg-muted/10";
                    return (
                      <div key={day} className={`flex flex-col items-center p-2 rounded-lg border-2 ${colors}`}>
                        <span className="text-xs font-body text-muted-foreground mb-1">{day.slice(0, 3)}</span>
                        <span className="text-lg">{display}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground font-body mt-2 text-center">Week of {currentWeekStart}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Match History */}
        {!isFan && matchHistory.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><MapPin className="w-5 h-5 text-primary" /> Match History</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {matchHistory.map((m, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="font-body text-sm text-foreground">vs {m.opponent}</p>
                        <p className="text-xs text-muted-foreground">{m.date} • {m.gameType} • {m.venue}</p>
                      </div>
                      <Badge variant="outline" className="border-primary/30 text-primary font-heading">{m.result}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Contributions */}
        {!isFan && !isFabianExempt && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground">My Contributions</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {memberContribMonths.map(({ key, label }) => {
                    const status = liveMember.contributions[key] || "unpaid";
                    const isPaid = status === "paid";
                    const isPending = status === "pending";
                    return (
                      <div key={key} className={`px-4 py-3 rounded-xl border-2 text-center ${isPaid ? "border-primary/40 bg-primary/10" : isPending ? "border-yellow-500/40 bg-yellow-500/10" : "border-border bg-muted/30"}`}>
                        <p className="text-xs font-body text-muted-foreground">{label}</p>
                        {isPaid ? <span className="text-green-600">✅</span> : isPending ? <span>⏳</span> : <span className="text-muted-foreground">⬜</span>}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Export buttons */}
        {!isFan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <div className="flex gap-3 flex-wrap">
              <Button variant="outline" onClick={() => handleExportProfile(false)} className="font-body text-xs border-primary/30 text-primary" disabled={!showExport}>
                <Download className="w-3 h-3 mr-1" /> Export Weekly Profile
              </Button>
              <Button variant="outline" onClick={() => handleExportProfile(true)} className="font-body text-xs border-primary/30 text-primary" disabled={!showDetailedExport}>
                <Download className="w-3 h-3 mr-1" /> Export Detailed Profile
              </Button>
              {!showExport && <p className="text-xs text-muted-foreground font-body self-center">Available Fri-Sun</p>}
            </div>
          </motion.div>
        )}

        {/* Media Upload */}
        {!isFan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Upload className="w-5 h-5 text-primary" /> Upload to Gallery</CardTitle></CardHeader>
              <CardContent>
                <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground font-body">Click to upload photos</span>
                  <input ref={mediaInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleMediaUpload} />
                </label>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Message */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
          <Card className="bg-card border-border card-glow">
            <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><MessageCircle className="w-5 h-5 text-primary" /> Send Message</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <select value={msgRecipient} onChange={(e) => setMsgRecipient(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-secondary px-3 text-foreground font-body">
                <option value="">Select recipient</option>
                {members.filter(m => m.id !== user.id).map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                ))}
              </select>
              <Textarea placeholder="Type your message..." value={msgContent} onChange={(e) => setMsgContent(e.target.value)}
                className="bg-secondary border-border font-body" />
              <Button onClick={handleSendMessage} disabled={!msgRecipient || !msgContent.trim()} className="w-full font-body">
                <Send className="w-4 h-4 mr-1" /> Send
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Logs Accordion */}
        {!isFan && weeklyLogs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground">Weekly Activity Log</CardTitle></CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  {weeklyLogs.slice(0, 8).map((log) => (
                    <AccordionItem key={log.id} value={log.id}>
                      <AccordionTrigger className="font-body text-sm text-foreground">Week of {log.weekStart}</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-3 gap-3">
                          {statFields.map(sf => (
                            <div key={sf.key} className="text-center p-2 bg-secondary/50 rounded-lg">
                              <p className="text-lg font-heading text-primary">{(log as any)[sf.key] || 0}</p>
                              <p className="text-[10px] text-muted-foreground font-body">{sf.label}</p>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default PlayerProfile;
