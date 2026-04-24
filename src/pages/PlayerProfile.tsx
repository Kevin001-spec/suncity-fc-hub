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

const PlayerProfile = () => {
  const { user, sendMessage } = useAuth();
  const { 
    members, profilePics, attendance, uploadProfilePicToStorage, 
    gameScores, matchPerformances, currentWeekStart, messages, markMessageRead,
    refreshData
  } = useTeamData();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [showExport, setShowExport] = useState(true);
  const [msgTarget, setMsgTarget] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [showInbox, setShowInbox] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any>(null);

  // Auto-refresh data on mount
  useEffect(() => {
    refreshData();
  }, []);

  if (!user) return <Navigate to="/" />;
  
  const maskId = (id: string) => {
    const isManager = user.role === "manager";
    const isCoach = user.role === "coach" || user.role === "assistant_coach";
    return (isManager || isCoach) ? id : "SCF-***";
  };

  const liveMember = members.find((m) => m.id === user.id) || user;
  const isManager = user.role === "manager";
  const isCoach = user.role === "coach" || user.role === "assistant_coach";

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast({ title: "Compressing & uploading..." });
    const url = await uploadProfilePicToStorage(user.id, file);
    if (url) toast({ title: "Profile Updated" });
    e.target.value = "";
  };

  const handleSendMsg = async () => {
    if (!msgTarget || !msgContent.trim()) return;
    await sendMessage(user.id, msgTarget, msgContent.trim());
    toast({ title: "Message Sent", description: `Sent to ${members.find(m => m.id === msgTarget)?.name || msgTarget}` });
    setMsgContent("");
  };

  const handleExportProfile = async (detailed = false) => {
    const stats = getStatsForPosition(liveMember.position).map(sf => ({
      label: sf.label,
      value: (liveMember as any)?.[sf.key] || 0
    }));

    const attDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => {
      const record = attendance.filter(a => a.playerId === user.id).find(a => a.day === day);
      return { day, status: record?.status || "absent" };
    });

    const mContribMonths = getContribMonthsForMember(user.id);
    const contribs = mContribMonths.map(m => ({
      month: m.label,
      status: liveMember.contributions[m.key] || "unpaid",
    }));

    const logsForExport = (members.find(m => m.id === user.id) as any)?.weeklyStatsLog || [];
    
    // Fetch detailed match history and awards from Supabase
    const { data: detailedMatchHistory } = await supabase
      .from("match_performances")
      .select(`
        *,
        game_scores (*)
      `)
      .eq("player_id", user.id)
      .order("created_at", { ascending: false });

    const { data: awardsData } = await supabase
      .from("match_awards" as any)
      .select("*")
      .eq("player_id", user.id);

    const awardsForDoc = (awardsData || []).map((a: any) => ({
      label: a.award_label,
      reason: a.reason
    }));

    const opponentsPlayed = gameScores.map(g => ({
      opponent: g.opponent,
      date: g.date,
      result: `${g.ourScore}-${g.theirScore}`
    }));

    await generatePlayerProfileDocx(
      liveMember.name, user.id, getFullPositionName(liveMember.position),
      stats, attDays, opponentsPlayed.map(o => ({ ...o, date: new Date(o.date).toLocaleDateString() })),
      contribs, profilePics[user.id], logsForExport,
      detailedMatchHistory.length > 0 ? detailedMatchHistory as any : undefined,
      awardsForDoc.length > 0 ? awardsForDoc : undefined,
    );
    toast({ title: "Profile Exported", description: "Your branded docx is ready." });
  };

  // Stats logic
  const statFields = getStatsForPosition(liveMember.position);
  const iconMap: Record<string, any> = {
    saves: Hand, cleanSheets: Shield, aerialDuels: Crosshair,
    tackles: Shield, interceptions: Crosshair, assists: Footprints,
    goals: Target, directShots: Crosshair, successfulTackles: Shield,
  };

  const getStatCards = () => {
    return statFields.map(sf => ({
      icon: iconMap[sf.key] || Target,
      label: sf.label,
      value: (liveMember as any)[sf.key] || 0,
    }));
  };

  const myMessages = messages.filter(m => m.toId === user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const unreadCount = myMessages.filter(m => !m.read).length;

  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <Helmet>
        <title>{liveMember.name} | SunCity FC Profile</title>
        <meta name="description" content={`View ${liveMember.name}'s football stats, performance history, and match records at SunCity FC.`} />
      </Helmet>
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Profile Header */}
        <section className="text-center space-y-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative inline-block">
            <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-primary shadow-2xl mx-auto">
              {profilePics[user.id] && <AvatarImage src={profilePics[user.id]} className="aspect-square object-cover object-center" />}
              <AvatarFallback className="bg-secondary text-primary font-heading text-3xl">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-all shadow-lg">
              <Upload className="w-5 h-5" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePicUpload} />
          </motion.div>
          
          <div className="space-y-2">
            <h2 className="font-heading text-3xl md:text-4xl text-foreground">{liveMember.name}</h2>
            <div className="flex items-center justify-center gap-3">
              <Badge variant="secondary" className="bg-secondary/50 font-body text-xs px-3">{maskId(user.id)}</Badge>
              <Badge className="bg-primary text-primary-foreground font-body capitalize px-3">{user.role.replace("_", " ")}</Badge>
            </div>
            {liveMember.position && <p className="text-muted-foreground font-body text-sm md:text-base">{getFullPositionName(liveMember.position)}</p>}
          </div>
          
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button size="sm" variant="outline" className="font-body border-primary/20 hover:bg-primary/10" onClick={() => setShowInbox(true)}>
              <MessageCircle className="w-4 h-4 mr-2" /> Inbox {unreadCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-primary text-[10px] rounded-full text-white">{unreadCount}</span>}
            </Button>
            {showExport && (
              <Button size="sm" className="font-body card-glow" onClick={() => handleExportProfile(true)}>
                <Download className="w-4 h-4 mr-2" /> Export Branded Profile
              </Button>
            )}
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {getStatCards().map(({ icon: Icon, label, value }, idx) => (
            <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
              <Card className="bg-card border-border hover:border-primary/40 transition-all card-glow h-full overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-12 h-12 bg-primary/5 rounded-bl-full group-hover:bg-primary/10 transition-all" />
                <CardHeader className="pb-2">
                  <Icon className="w-5 h-5 text-primary mb-1" />
                  <CardTitle className="text-[10px] font-heading text-muted-foreground uppercase tracking-widest">{label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-heading text-foreground">{value}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Match Performance */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg text-primary flex items-center gap-2"><Trophy className="w-5 h-5" /> Recent Match Stats</h3>
              <Button variant="link" className="text-xs font-body" onClick={() => setShowHistory(true)}>Full History</Button>
            </div>
            <div className="space-y-3">
              {matchPerformances.filter(p => p.playerId === user.id).slice(0, 3).map((perf, idx) => {
                const game = gameScores.find(g => g.id === perf.gameId);
                if (!game) return null;
                return (
                  <motion.div key={perf.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + (idx * 0.1) }}
                    className="p-4 rounded-xl bg-card border border-border flex items-center justify-between card-glow relative overflow-hidden group">
                    {perf.is_potm && <div className="absolute top-0 right-0 px-2 py-0.5 bg-primary text-[8px] font-heading text-white rounded-bl-lg">POTM</div>}
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center font-heading text-primary border border-primary/20">
                        {game.ourScore}-{game.theirScore}
                      </div>
                      <div>
                        <h4 className="font-heading text-sm">vs {game.opponent}</h4>
                        <p className="text-[10px] text-muted-foreground font-body uppercase">{format(new Date(game.date), "MMM d, yyyy")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-heading text-primary">{perf.rating.toFixed(1)} <span className="text-[10px] text-muted-foreground uppercase">Rating</span></p>
                      <div className="flex gap-1.5 justify-end mt-1">
                        {perf.goals > 0 && <Badge variant="outline" className="text-[8px] h-4 py-0 font-body">⚽ {perf.goals}</Badge>}
                        {perf.assists > 0 && <Badge variant="outline" className="text-[8px] h-4 py-0 font-body">🅰️ {perf.assists}</Badge>}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              {matchPerformances.filter(p => p.playerId === user.id).length === 0 && (
                <div className="p-8 rounded-xl border border-dashed border-border text-center">
                  <p className="text-sm text-muted-foreground font-body italic">No matches recorded yet. Keep training!</p>
                </div>
              )}
            </div>
          </section>

          {/* Quick Actions & Messaging */}
          <section className="space-y-4">
            <h3 className="font-heading text-lg text-primary flex items-center gap-2"><MessageCircle className="w-5 h-5" /> Quick Contact</h3>
            <Card className="bg-card border-border card-glow h-fit overflow-hidden">
              <CardHeader className="bg-secondary/5 border-b border-border/50 pb-3">
                <CardTitle className="text-xs font-heading text-muted-foreground uppercase">Send Message to Official</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <select 
                  className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm font-body focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                  value={msgTarget}
                  onChange={(e) => setMsgTarget(e.target.value)}
                >
                  <option value="">Select Official</option>
                  {members.filter(m => ["manager", "coach", "assistant_coach", "finance", "captain"].includes(m.role)).map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role.replace("_", " ")})</option>
                  ))}
                </select>
                <Textarea 
                  placeholder="Type your message here..."
                  className="bg-secondary/50 border-border font-body text-sm min-h-[80px]"
                  value={msgContent}
                  onChange={(e) => setMsgContent(e.target.value)}
                />
                <Button onClick={handleSendMsg} className="w-full font-heading" disabled={!msgTarget || !msgContent.trim()}>
                  <Send className="w-4 h-4 mr-2" /> Send Message
                </Button>
              </CardContent>
            </Card>
          </section>
        </div>

        {/* Attendance Summary */}
        <section className="space-y-4">
          <h3 className="font-heading text-lg text-primary flex items-center gap-2"><Calendar className="w-5 h-5" /> Training Attendance</h3>
          <Card className="bg-card border-border overflow-hidden card-glow">
            <CardHeader className="bg-secondary/5 border-b border-border/50 pb-3 flex flex-row items-center justify-between">
              <p className="text-[10px] font-heading text-muted-foreground uppercase italic">Current Week Registry: {currentWeekStart}</p>
              <Badge variant="outline" className="text-[10px] border-primary/30 text-primary uppercase">This Week</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-5 divide-x divide-border">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => {
                  const record = attendance.filter(a => a.playerId === user.id).find(a => a.day === day);
                  const status = record?.status || "absent";
                  return (
                    <div key={day} className="p-4 text-center space-y-2 bg-secondary/5">
                      <p className="text-[10px] font-heading text-muted-foreground uppercase">{day.slice(0, 3)}</p>
                      <div className="flex justify-center">
                        {status === "present" ? (
                          <div className="w-10 h-10 rounded-full bg-green-600/20 flex items-center justify-center text-green-500 shadow-[0_0_15px_rgba(22,163,74,0.1)] border border-green-500/30">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                        ) : status === "excused" ? (
                          <div className="w-10 h-10 rounded-full bg-yellow-600/20 flex items-center justify-center text-yellow-500 border border-yellow-500/30">
                            <Star className="w-5 h-5" />
                          </div>
                        ) : status === "no_activity" ? (
                          <div className="w-10 h-10 rounded-full bg-muted/20 flex items-center justify-center text-muted-foreground/30 border border-border/20">
                            <Hand className="w-5 h-5 opacity-20" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-red-600/10 flex items-center justify-center text-red-600/30 border border-red-600/10">
                            <XCircle className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <p className={`text-[9px] font-heading uppercase ${status === "present" ? "text-green-500" : status === "excused" ? "text-yellow-500" : "text-muted-foreground"}`}>
                        {status === "no_activity" ? "Off" : status}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Inbox Dialog */}
      <Dialog open={showInbox} onOpenChange={setShowInbox}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader className="border-b border-border/50 pb-4">
            <DialogTitle className="font-heading text-primary flex items-center gap-2">
              <MessageCircle className="w-5 h-5" /> Personal Inbox
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {myMessages.length === 0 ? (
              <div className="text-center py-12 space-y-2 opacity-40">
                <MessageCircle className="w-12 h-12 mx-auto" />
                <p className="text-sm font-body italic">Your inbox is empty.</p>
              </div>
            ) : (
              myMessages.map((m) => (
                <div 
                  key={m.id} 
                  className={`p-4 rounded-xl border transition-all ${m.read ? "bg-secondary/10 border-border" : "bg-primary/5 border-primary/30 card-glow"}`}
                  onClick={() => markMessageRead(m.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-heading text-xs text-primary">{members.find(mem => mem.id === m.fromId)?.name || m.fromId}</span>
                    <span className="text-[10px] text-muted-foreground font-body">{format(new Date(m.createdAt), "MMM d, HH:mm")}</span>
                  </div>
                  <p className="text-sm text-foreground font-body leading-relaxed">{m.content}</p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="bg-card border-border max-w-2xl">
          <DialogHeader className="border-b border-border/50 pb-4">
            <DialogTitle className="font-heading text-primary flex items-center gap-2">
              <Trophy className="w-5 h-5" /> Complete Match History
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            <Accordion type="single" collapsible className="w-full">
              {matchPerformances.filter(p => p.playerId === user.id).map((perf) => {
                const game = gameScores.find(g => g.id === perf.gameId);
                if (!game) return null;
                return (
                  <AccordionItem key={perf.id} value={perf.id} className="border-border px-1">
                    <AccordionTrigger className="hover:no-underline py-4">
                      <div className="flex items-center gap-4 text-left w-full">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-heading text-xs ${game.ourScore > game.theirScore ? "bg-green-600/20 text-green-500" : "bg-red-600/20 text-red-500"}`}>
                          {game.ourScore}-{game.theirScore}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-heading text-sm text-foreground">vs {game.opponent}</h4>
                          <p className="text-[10px] text-muted-foreground font-body">{format(new Date(game.date), "MMMM d, yyyy")}</p>
                        </div>
                        <div className="pr-4 text-right">
                          <p className="text-sm font-heading text-primary">{perf.rating.toFixed(1)}</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-secondary/10 rounded-xl p-4">
                        {perf.goals > 0 && (
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground uppercase font-heading">Goals</p>
                            <p className="text-lg font-heading text-primary">{perf.goals}</p>
                          </div>
                        )}
                        {perf.assists > 0 && (
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground uppercase font-heading">Assists</p>
                            <p className="text-lg font-heading text-primary">{perf.assists}</p>
                          </div>
                        )}
                        {perf.saves > 0 && (
                          <div className="text-center">
                            <p className="text-[10px] text-muted-foreground uppercase font-heading">Saves</p>
                            <p className="text-lg font-heading text-primary">{perf.saves}</p>
                          </div>
                        )}
                        <div className="text-center">
                          <p className="text-[10px] text-muted-foreground uppercase font-heading">Game Type</p>
                          <p className="text-[10px] font-body text-foreground uppercase pt-1">{game.gameType}</p>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-between items-center px-2">
                        <p className="text-[10px] text-muted-foreground font-body italic">Recorded: {format(new Date(perf.created_at), "PPP")}</p>
                        {perf.is_potm && <Badge className="bg-primary text-[10px] font-heading">Player of the Match</Badge>}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlayerProfile;
