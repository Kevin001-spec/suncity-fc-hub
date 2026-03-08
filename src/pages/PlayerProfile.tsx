import { useRef, useState, useEffect } from "react";
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Target, Footprints, Gamepad2, Upload, Calendar, Download, Shield, Hand, Crosshair, MessageCircle, Send, Star, Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getContribMonthsForMember, getFullPositionName, getPositionGroup, type WeeklyStatsLog } from "@/data/team-data";
import { generatePlayerProfileDocx } from "@/lib/docx-export";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const PlayerProfile = () => {
  const { user } = useAuth();
  const { members, profilePics, uploadProfilePicToStorage, uploadMediaToStorage, attendance, currentWeekStart, gameScores, sendMessage, updateFavouriteMoment, loadWeeklyStatsLogs } = useTeamData();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [msgRecipient, setMsgRecipient] = useState("");
  const [msgContent, setMsgContent] = useState("");
  const [weeklyLogs, setWeeklyLogs] = useState<WeeklyStatsLog[]>([]);
  const [momentText, setMomentText] = useState("");

  const liveMember = members.find((m) => m.id === user?.id) || user;
  const isFan = user?.role === "fan";
  const isFabianExempt = user?.id === "SCF-001";
  const posGroup = getPositionGroup(liveMember?.position);
  const dayOfWeek = new Date().getDay();
  const showExport = dayOfWeek >= 5 || dayOfWeek === 0;
  const showDetailedExport = showExport;

  // Load weekly stats logs
  useEffect(() => {
    if (user?.id && !isFan) {
      loadWeeklyStatsLogs(user.id).then(setWeeklyLogs);
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

  const getStatCards = () => {
    if (posGroup === "GK") {
      return [
        { icon: Hand, label: "Saves", value: liveMember.saves || 0 },
        { icon: Shield, label: "Clean Sheets", value: liveMember.cleanSheets || 0 },
        { icon: Crosshair, label: "Aerial Duels", value: liveMember.aerialDuels || 0 },
      ];
    }
    if (posGroup === "DEF") {
      return [
        { icon: Shield, label: "Tackles", value: liveMember.tackles || 0 },
        { icon: Crosshair, label: "Interceptions", value: liveMember.interceptions || 0 },
        { icon: Footprints, label: "Clearances", value: liveMember.clearances || 0 },
        { icon: Target, label: "Direct Shots", value: liveMember.directShots || 0 },
      ];
    }
    return [
      { icon: Target, label: "Goals", value: liveMember.goals || 0 },
      { icon: Footprints, label: "Assists", value: liveMember.assists || 0 },
      { icon: Gamepad2, label: "Games", value: liveMember.gamesPlayed || 0 },
      { icon: Shield, label: "Successful Tackles", value: liveMember.successfulTackles || 0 },
      { icon: Crosshair, label: "Direct Targets", value: liveMember.directTargets || 0 },
    ];
  };

  const statCards = isFan ? [] : getStatCards();
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
        stats: [
          { label: "Goals", value: log.goals },
          { label: "Assists", value: log.assists },
          { label: "Games Played", value: log.gamesPlayed },
          { label: "Saves", value: log.saves },
          { label: "Clean Sheets", value: log.cleanSheets },
          { label: "Aerial Duels", value: log.aerialDuels },
          { label: "Tackles", value: log.tackles },
          { label: "Interceptions", value: log.interceptions },
          { label: "Blocks", value: log.blocks },
          { label: "Clearances", value: log.clearances },
          { label: "Successful Tackles", value: log.successfulTackles },
          { label: "Direct Targets", value: log.directTargets },
          { label: "Direct Shots", value: log.directShots },
        ],
      }));
    }

    await generatePlayerProfileDocx(
      liveMember.name, user.id, getFullPositionName(liveMember.position),
      stats, attDays, opponentsPlayed.map(o => ({ ...o, date: new Date(o.date).toLocaleDateString() })),
      contribs, profilePics[user.id], logsForExport
    );
    toast({ title: detailed ? "Detailed Profile Exported" : "Weekly Profile Exported" });
  };

  const handleSendMessage = async () => {
    if (!msgRecipient || !msgContent.trim()) return;
    await sendMessage(user.id, msgRecipient, msgContent.trim());
    toast({ title: "Message Sent" });
    setMsgContent(""); setMsgRecipient("");
  };

  const handleSaveMoment = async () => {
    if (!momentText.trim()) return;
    await updateFavouriteMoment(user.id, momentText.trim());
    toast({ title: "Moment Saved", description: "Your favourite team moment has been updated." });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="relative inline-block">
            <Avatar className="w-24 h-24 border-2 border-primary mx-auto">
              {profilePics[user.id] && <AvatarImage src={profilePics[user.id]} className="aspect-square object-cover object-center" />}
              <AvatarFallback className="bg-secondary text-primary font-heading text-2xl">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <button onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors">
              <Upload className="w-4 h-4" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePicUpload} />
          </div>
          <h2 className="font-heading text-2xl text-foreground mt-4">{liveMember.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Badge variant="outline" className="border-primary/30 text-primary font-body">{user.id}</Badge>
            {user.role === "captain" && <Badge className="bg-primary text-primary-foreground font-body">Field Captain</Badge>}
            {isFan && <Badge className="bg-primary text-primary-foreground font-body">Fan</Badge>}
          </div>
          {!isFan && liveMember.position && <p className="text-muted-foreground font-body text-sm mt-1">{getFullPositionName(liveMember.position)}</p>}
          {!isFan && liveMember.squadNumber && <p className="text-muted-foreground font-body text-sm mt-1">Squad #{liveMember.squadNumber}</p>}

          {/* Fan badge & points */}
          {isFan && liveMember.fanBadge && (
            <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30">
              <Star className="w-4 h-4 text-primary fill-primary" />
              <span className="font-heading text-sm text-primary">{liveMember.fanBadge}</span>
            </div>
          )}
          {isFan && (
            <p className="text-sm text-primary font-heading mt-2">⭐ {liveMember.fanPoints || 0} Points</p>
          )}

          {showExport && !isFan && (
            <div className="flex gap-2 justify-center mt-3">
              <Button onClick={() => handleExportProfile(false)} variant="outline" size="sm" className="font-body text-xs border-primary/30 text-primary">
                <Download className="w-3 h-3 mr-1" /> Export This Week
              </Button>
              {showDetailedExport && weeklyLogs.length > 0 && (
                <Button onClick={() => handleExportProfile(true)} variant="outline" size="sm" className="font-body text-xs border-primary/30 text-primary">
                  <Download className="w-3 h-3 mr-1" /> Export Full Record
                </Button>
              )}
            </div>
          )}
        </motion.div>

        {/* Stats Cards (not for fans) */}
        {!isFan && statCards.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className={`grid gap-4 ${statCards.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
            {statCards.map(({ icon: Icon, label, value }) => (
              <Card key={label} className="bg-card border-border card-glow text-center">
                <CardContent className="pt-6 pb-4">
                  <Icon className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-2xl font-heading text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground font-body">{label}</p>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {/* Fan: Favourite Moment */}
        {isFan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" /> Favourite Team Moment
              </CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Textarea placeholder="Share your favourite team moment..." value={momentText} onChange={(e) => setMomentText(e.target.value)}
                  className="bg-secondary border-border font-body" rows={3} />
                <Button onClick={handleSaveMoment} disabled={!momentText.trim()} className="w-full font-body">
                  <Heart className="w-4 h-4 mr-1" /> Save Moment
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Fan: Upload Photos */}
        {isFan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                <Upload className="w-5 h-5 text-primary" /> Upload Photos
              </CardTitle></CardHeader>
              <CardContent>
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground font-body">Click to select photos</span>
                  <input ref={mediaInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleMediaUpload} />
                </label>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Weekly Attendance (not for fans) */}
        {!isFan && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader>
                <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" /> This Week's Attendance
                </CardTitle>
                <p className="text-xs text-muted-foreground font-body">Week of {currentWeekStart}</p>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 justify-between">
                  {DAYS.map((day) => {
                    const record = myAttendance.find((a) => a.day === day);
                    const status = record?.status || "absent";
                    const display = status === "present" ? "✅" : status === "excused" ? "🔵" : status === "no_activity" ? "➖" : "⬜";
                    const colors: Record<string, string> = {
                      present: "bg-green-500/20 border-green-500/40",
                      absent: "bg-muted/30 border-border",
                      excused: "bg-blue-500/20 border-blue-500/30",
                      no_activity: "bg-muted border-border",
                    };
                    return (
                      <div key={day} className="text-center flex-1">
                        <p className="text-xs text-muted-foreground font-body mb-1">{day.slice(0, 3)}</p>
                        <div className={`w-10 h-10 mx-auto rounded-lg border-2 flex items-center justify-center text-sm ${colors[status]}`}>
                          {display}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Monthly Contributions (not for fans) */}
        {!isFan && !isFabianExempt && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground">Monthly Contributions</CardTitle></CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {memberContribMonths.map(({ key, label }) => {
                    const status = liveMember.contributions[key] || "unpaid";
                    const isPaid = status === "paid";
                    return (
                      <div key={key} className={`px-4 py-3 rounded-xl border-2 text-center transition-all ${
                        isPaid ? "border-primary/40 bg-primary/10 player-card-glow" : "border-border bg-muted/30"
                      }`}>
                        <p className="text-xs font-body text-muted-foreground">{label}</p>
                        <div className="mt-1">
                          {isPaid ? (
                            <div className="flex items-center gap-1 justify-center">
                              <span className="text-green-600">✅</span>
                              <span className="text-sm font-heading text-green-600">Paid</span>
                            </div>
                          ) : (
                            <span className="text-sm font-body text-muted-foreground">⬜ Unpaid</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Weekly Activity Log (not for fans) */}
        {!isFan && weeklyLogs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Weekly Activity Log
              </CardTitle></CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {weeklyLogs.map((log) => {
                    const nonZeroStats = [
                      { label: "Goals", value: log.goals },
                      { label: "Assists", value: log.assists },
                      { label: "Games", value: log.gamesPlayed },
                      { label: "Saves", value: log.saves },
                      { label: "Clean Sheets", value: log.cleanSheets },
                      { label: "Aerial Duels", value: log.aerialDuels },
                      { label: "Tackles", value: log.tackles },
                      { label: "Interceptions", value: log.interceptions },
                      { label: "Blocks", value: log.blocks },
                      { label: "Clearances", value: log.clearances },
                      { label: "Successful Tackles", value: log.successfulTackles },
                      { label: "Direct Targets", value: log.directTargets },
                      { label: "Direct Shots", value: log.directShots },
                    ].filter(s => s.value > 0);
                    if (nonZeroStats.length === 0) return null;
                    return (
                      <AccordionItem key={log.id} value={log.id}>
                        <AccordionTrigger className="font-body text-sm text-foreground">
                          Week of {log.weekStart}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {nonZeroStats.map(s => (
                              <div key={s.label} className="text-center p-2 rounded-lg bg-secondary/50 border border-border">
                                <p className="text-lg font-heading text-primary">{s.value}</p>
                                <p className="text-[10px] text-muted-foreground font-body">{s.label}</p>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Opponents Played Against */}
        {!isFan && opponentsPlayed.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground">Opponents Played Against</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {opponentsPlayed.map((game, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className="font-body text-sm text-foreground">vs {game.opponent}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-body">{new Date(game.date).toLocaleDateString()}</span>
                        <Badge variant="outline" className="text-xs border-primary/30 text-primary">{game.result}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Send Message */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-card border-border card-glow">
            <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" /> Send Message
            </CardTitle></CardHeader>
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
                <Send className="w-4 h-4 mr-1" /> Send Message
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
};

export default PlayerProfile;
