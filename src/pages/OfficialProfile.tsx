import { useState, useRef, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamData } from "@/contexts/TeamDataContext";
import { Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Trophy, Calendar as CalendarIcon, Image, DollarSign, Users, CheckCircle, XCircle, Plus,
  TrendingUp, TrendingDown, Upload, Target, Save, Trash2, Download, UserMinus, Star, BarChart3, Edit,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { contributionMonths } from "@/data/team-data";
import { generateBrandedPdf, type TableData } from "@/lib/pdf-export";
import { supabase } from "@/integrations/supabase/client";
import LineupBuilder from "@/components/LineupBuilder";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

// Correct attendance calculation
function calcAttendancePct(playerAtt: { status: string }[]) {
  const activeDays = playerAtt.filter(a => a.status !== "no_activity");
  const presentDays = activeDays.filter(a => a.status === "present").length;
  const excusedDays = activeDays.filter(a => a.status === "excused").length;
  if (activeDays.length === 0) return 0;
  const dayValue = 100 / activeDays.length;
  return Math.round((presentDays * dayValue) + (excusedDays * dayValue * 0.5));
}

interface LeagueTeam {
  id: string;
  team_name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goal_difference: number;
  points: number;
  is_own_team: boolean;
}

const OfficialProfile = () => {
  const { user } = useAuth();
  const {
    members, gameScores, calendarEvents, financialRecords, pendingApprovals,
    profilePics, attendance, currentWeekStart, mediaItems, homepageImages,
    addGameScore, addCalendarEvent,
    approveContribution, rejectContribution, addFinancialTransaction,
    uploadProfilePicToStorage, uploadMediaToStorage,
    updateContributionDirect, updateAttendance, markDayNoActivity,
    requestContribution, deleteMediaItem, removePlayer,
    uploadHomepageImages, deleteHomepageImage, updatePlayerStats,
  } = useTeamData();
  const { toast } = useToast();

  const [newOpponent, setNewOpponent] = useState("");
  const [newOurScore, setNewOurScore] = useState("");
  const [newTheirScore, setNewTheirScore] = useState("");
  const [scorers, setScorers] = useState<string[]>([]);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [finType, setFinType] = useState<"in" | "out">("out");
  const [finAmount, setFinAmount] = useState("");
  const [finDesc, setFinDesc] = useState("");
  const [finDate, setFinDate] = useState<Date | undefined>();
  const [finMonth, setFinMonth] = useState(() => {
    const now = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  });
  const [removePlayerId, setRemovePlayerId] = useState("");
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  // Team Stats Editor state
  const [statsPlayerId, setStatsPlayerId] = useState("");
  const [statsGoals, setStatsGoals] = useState("");
  const [statsAssists, setStatsAssists] = useState("");
  const [statsGames, setStatsGames] = useState("");
  const [statsOpponent, setStatsOpponent] = useState("");

  // Position Editor state
  const [posPlayerId, setPosPlayerId] = useState("");
  const [posValue, setPosValue] = useState("");

  // League Teams state
  const [leagueTeams, setLeagueTeams] = useState<LeagueTeam[]>([]);
  const [leagueLoaded, setLeagueLoaded] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editTeamData, setEditTeamData] = useState({ played: 0, won: 0, drawn: 0, lost: 0, gd: 0, pts: 0 });

  // Contribution Events
  const [ceTitle, setCeTitle] = useState("");
  const [ceDesc, setCeDesc] = useState("");
  const [ceAmountPer, setCeAmountPer] = useState("");
  const [ceTarget, setCeTarget] = useState("");
  const [contribEvents, setContribEvents] = useState<any[]>([]);
  const [contribPayments, setContribPayments] = useState<any[]>([]);
  const [ceLoaded, setCeLoaded] = useState(false);

  // First 11
  const [showFirst11, setShowFirst11] = useState(false);
  const [selectedFirst11, setSelectedFirst11] = useState<string[]>([]);
  const [selectedSubs, setSelectedSubs] = useState<string[]>([]);

  // Season config
  const [seasonEndDate, setSeasonEndDate] = useState<Date | undefined>();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const homepageInputRef = useRef<HTMLInputElement>(null);

  // Load contribution events
  useEffect(() => {
    if (!ceLoaded) {
      Promise.all([
        supabase.from("contribution_events").select("*").order("created_at", { ascending: false }),
        supabase.from("contribution_event_payments").select("*"),
      ]).then(([{ data: events }, { data: payments }]) => {
        setContribEvents(events || []);
        setContribPayments(payments || []);
        setCeLoaded(true);
      });
    }
  }, [ceLoaded]);

  // Load league teams
  useEffect(() => {
    if (!leagueLoaded) {
      supabase.from("league_teams").select("*").then(({ data }) => {
        if (data) setLeagueTeams((data as LeagueTeam[]).sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference));
        setLeagueLoaded(true);
      });
    }
  }, [leagueLoaded]);

  // Load league teams
  useEffect(() => {
    if (!leagueLoaded) {
      supabase.from("league_teams").select("*").then(({ data }) => {
        if (data) setLeagueTeams((data as LeagueTeam[]).sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference));
        setLeagueLoaded(true);
      });
    }
  }, [leagueLoaded]);

  const isCoach = user.role === "coach";
  const isFadhir = user.id === "SCF-002";
  const isManager = user.role === "manager";
  const isFabian = user.id === "SCF-001";
  const isCaptain = user.role === "captain";
  const canManageScores = ["coach", "manager", "captain"].includes(user.role);
  const canManageEvents = ["coach", "manager", "captain"].includes(user.role);
  const canUploadMedia = ["coach", "manager", "captain"].includes(user.role);
  const canManageFinance = isFadhir || isCoach;
  const canApproveContributions = isFadhir || isCoach;
  const canDeletePhotos = isManager;
  const canManageContribEvents = isFadhir || isCaptain;
  const showContributions = !isFabian;
  const canManageAttendance = isManager || user.id === "SCF-004";

  const playerMembers = members.filter((m) => m.role === "player" || m.role === "captain");
  const ourScoreNum = parseInt(newOurScore) || 0;

  const addScore = () => {
    if (!newOpponent || !newOurScore || !newTheirScore) return;
    addGameScore({
      date: new Date().toISOString().split("T")[0],
      opponent: newOpponent, ourScore: parseInt(newOurScore), theirScore: parseInt(newTheirScore),
      scorers: scorers.filter(Boolean),
    });
    toast({ title: "Score Added", description: `vs ${newOpponent} recorded.` });
    setNewOpponent(""); setNewOurScore(""); setNewTheirScore(""); setScorers([]);
  };

  const addEvent = () => {
    if (!newEventTitle || !newEventDate) return;
    addCalendarEvent({ date: newEventDate, title: newEventTitle, description: newEventDesc });
    toast({ title: "Event Added", description: newEventTitle });
    setNewEventTitle(""); setNewEventDate(""); setNewEventDesc("");
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    toast({ title: "Compressing & uploading...", description: `Processing ${files.length} photo(s)...` });
    await uploadMediaToStorage(Array.from(files), user.name);
    toast({ title: "Media Uploaded", description: `${files.length} photo(s) uploaded to gallery.` });
    e.target.value = "";
  };

  const handleHomepageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    if (files.length > 4) { toast({ title: "Max 4 images", variant: "destructive" }); return; }
    toast({ title: "Compressing & uploading...", description: "Processing homepage photos..." });
    await uploadHomepageImages(Array.from(files));
    toast({ title: "Homepage Updated", description: "Photos uploaded to homepage carousel." });
    e.target.value = "";
  };

  const handleRecordTransaction = () => {
    if (!finAmount || !finDesc || !finDate) return;
    addFinancialTransaction(finMonth, finDesc, parseInt(finAmount), format(finDate, "MMM d"), finType);
    toast({ title: "Transaction Recorded", description: `${finType === "in" ? "Income" : "Expense"}: KSh ${finAmount}` });
    setFinAmount(""); setFinDesc(""); setFinDate(undefined);
  };

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    toast({ title: "Compressing & uploading..." });
    const url = await uploadProfilePicToStorage(user.id, file);
    if (url) toast({ title: "Profile Updated" });
    e.target.value = "";
  };

  const handleRemovePlayer = async () => {
    if (!removePlayerId) return;
    const playerName = members.find((m) => m.id === removePlayerId)?.name;
    await removePlayer(removePlayerId);
    toast({ title: "Player Removed", description: `${playerName} has been removed.` });
    setRemovePlayerId(""); setShowRemoveConfirm(false);
  };

  const handleUpdateStats = async () => {
    if (!statsPlayerId) return;
    const goals = parseInt(statsGoals) || 0;
    const assists = parseInt(statsAssists) || 0;
    const games = parseInt(statsGames) || 0;
    await updatePlayerStats(statsPlayerId, goals, assists, games);
    toast({ title: "Stats Updated" });
  };

  const handleUpdatePosition = async () => {
    if (!posPlayerId || !posValue) return;
    await supabase.from("members").update({ position: posValue }).eq("id", posPlayerId);
    toast({ title: "Position Updated" });
    setPosPlayerId(""); setPosValue("");
  };

  // League team management
  const handleAddLeagueTeam = async () => {
    if (!newTeamName) return;
    const { data } = await supabase.from("league_teams").insert({ team_name: newTeamName, is_own_team: false } as any).select().single();
    if (data) {
      setLeagueTeams(prev => [...prev, data as LeagueTeam].sort((a, b) => b.points - a.points));
      toast({ title: "Team Added" });
    }
    setNewTeamName("");
  };

  const handleSaveLeagueTeam = async (teamId: string) => {
    await supabase.from("league_teams").update({
      played: editTeamData.played, won: editTeamData.won, drawn: editTeamData.drawn,
      lost: editTeamData.lost, goal_difference: editTeamData.gd, points: editTeamData.pts,
    } as any).eq("id", teamId);
    setLeagueTeams(prev => prev.map(t => t.id === teamId ? { ...t, played: editTeamData.played, won: editTeamData.won, drawn: editTeamData.drawn, lost: editTeamData.lost, goal_difference: editTeamData.gd, points: editTeamData.pts } : t).sort((a, b) => b.points - a.points));
    setEditingTeamId(null);
    toast({ title: "Standings Updated" });
  };

  const handleDeleteLeagueTeam = async (teamId: string) => {
    await supabase.from("league_teams").delete().eq("id", teamId);
    setLeagueTeams(prev => prev.filter(t => t.id !== teamId));
    toast({ title: "Team Removed" });
  };

  const handleAddContribEvent = async () => {
    if (!ceTitle || !ceAmountPer || !ceTarget) return;
    const { data } = await supabase.from("contribution_events").insert({
      title: ceTitle, goal_description: ceDesc, amount_per_person: parseFloat(ceAmountPer),
      target_amount: parseFloat(ceTarget), created_by: user.id,
    }).select().single();
    if (data) {
      setContribEvents(prev => [data, ...prev]);
      toast({ title: "Contribution Event Created", description: ceTitle });
    }
    setCeTitle(""); setCeDesc(""); setCeAmountPer(""); setCeTarget("");
  };

  const toggleContribPayment = async (eventId: string, memberId: string) => {
    const existing = contribPayments.find((p: any) => p.event_id === eventId && p.member_id === memberId);
    if (existing) {
      const newPaid = !(existing as any).paid;
      setContribPayments(prev => prev.map((p: any) => p.id === existing.id ? { ...p, paid: newPaid } : p));
      await supabase.from("contribution_event_payments").update({ paid: newPaid }).eq("id", (existing as any).id);
    } else {
      const { data } = await supabase.from("contribution_event_payments").insert({
        event_id: eventId, member_id: memberId, paid: true,
      }).select().single();
      if (data) setContribPayments(prev => [...prev, data]);
    }
  };

  const deleteContribEvent = async (eventId: string) => {
    await supabase.from("contribution_events").delete().eq("id", eventId);
    setContribEvents(prev => prev.filter((e: any) => e.id !== eventId));
    toast({ title: "Event Deleted" });
  };

  const exportFinancialPdf = () => {
    const tables: TableData[] = [];
    financialRecords.forEach((f) => {
      const totalExp = f.expenses.reduce((sum, e) => sum + e.amount, 0);
      const head = [[`${f.month} — Financial Details`, ""]];
      const body: string[][] = [
        ["Opening Balance", `KSh ${f.openingBalance.toLocaleString()}`],
        ["Contributors", `${f.contributors} members`],
        ["Total Contributions", `KSh ${f.contributions.toLocaleString()}`],
      ];
      if (f.contributorNote) body.push(["Note", f.contributorNote]);
      f.expenses.forEach(exp => body.push([`Expense: ${exp.description} (${exp.date})`, `-KSh ${exp.amount.toLocaleString()}`]));
      body.push(["Total Expenses", `-KSh ${totalExp.toLocaleString()}`]);
      body.push(["Closing Balance", `KSh ${f.closingBalance.toLocaleString()}`]);
      tables.push({ head, body });
    });
    const contribHead = [["Month", "Contributors Who Paid"]];
    const contribBody = contributionMonths.map(month => {
      const paidMembers = members.filter(m => m.contributions[month.key] === "paid").map(m => m.name).join(", ");
      return [month.label, paidMembers || "None"];
    });
    tables.push({ head: contribHead, body: contribBody });
    generateBrandedPdf("Detailed Financial Summary Report", tables, "suncity_fc_financial_detailed.pdf");
  };

  // First 11 analytics
  const playerAnalytics = useMemo(() => {
    return playerMembers.map(m => {
      const playerAtt = attendance.filter(a => a.playerId === m.id);
      const attPct = calcAttendancePct(playerAtt);
      const score = attPct * 0.4 + (m.goals || 0) * 30 + (m.assists || 0) * 20;
      return { ...m, attPct, score };
    }).sort((a, b) => b.score - a.score);
  }, [playerMembers, attendance]);

  const exportFirst11Pdf = () => {
    const starters = selectedFirst11.map(id => members.find(m => m.id === id));
    const subs = selectedSubs.map(id => members.find(m => m.id === id));
    const tables: TableData[] = [
      { head: [["Starting XI"]], body: starters.filter(Boolean).map((m, i) => [`${i + 1}. ${m!.name} (${m!.position || "N/A"})`]) },
      { head: [["Substitutes"]], body: subs.filter(Boolean).map((m, i) => [`${i + 1}. ${m!.name} (${m!.position || "N/A"})`]) },
    ];
    generateBrandedPdf("Match Day Squad Selection", tables, "suncity_fc_first11.pdf");
  };

  const liveMember = members.find((m) => m.id === user.id) || user;

  // When selecting a player for stats editor, load their current stats
  const selectedStatsPlayer = members.find(m => m.id === statsPlayerId);
  useEffect(() => {
    if (selectedStatsPlayer) {
      setStatsGoals(String(selectedStatsPlayer.goals || 0));
      setStatsAssists(String(selectedStatsPlayer.assists || 0));
      setStatsGames(String(selectedStatsPlayer.gamesPlayed || 0));
    }
  }, [statsPlayerId]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Profile Header */}
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
          <h2 className="font-heading text-2xl text-foreground mt-4">{user.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Badge className="bg-primary text-primary-foreground font-body capitalize">{user.role}</Badge>
            <Badge variant="outline" className="border-primary/30 text-primary font-body">{user.id}</Badge>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Game Scores */}
          {canManageScores && (
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" /> Update Scores</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Opponent name" value={newOpponent} onChange={(e) => setNewOpponent(e.target.value)} className="bg-secondary border-border font-body" />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Our score" type="number" value={newOurScore} onChange={(e) => { setNewOurScore(e.target.value); setScorers([]); }} className="bg-secondary border-border font-body" />
                  <Input placeholder="Their score" type="number" value={newTheirScore} onChange={(e) => setNewTheirScore(e.target.value)} className="bg-secondary border-border font-body" />
                </div>
                {ourScoreNum > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-body">Who scored? ({ourScoreNum} goal{ourScoreNum > 1 ? "s" : ""})</p>
                    {Array.from({ length: ourScoreNum }).map((_, i) => (
                      <select key={i} value={scorers[i] || ""}
                        onChange={(e) => { const ns = [...scorers]; ns[i] = e.target.value; setScorers(ns); }}
                        className="w-full h-9 rounded-md border border-input bg-secondary px-3 text-foreground font-body text-sm">
                        <option value="">Select scorer {i + 1}</option>
                        {playerMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    ))}
                  </div>
                )}
                <Button onClick={addScore} className="w-full font-body"><Plus className="w-4 h-4 mr-1" /> Add Score</Button>
              </CardContent>
            </Card>
          )}

          {/* Calendar Events */}
          {canManageEvents && (
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-primary" /> Add Event</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Event title" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} className="bg-secondary border-border font-body" />
                <Input type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} className="bg-secondary border-border font-body" />
                <Textarea placeholder="Description" value={newEventDesc} onChange={(e) => setNewEventDesc(e.target.value)} className="bg-secondary border-border font-body" />
                <Button onClick={addEvent} className="w-full font-body"><Plus className="w-4 h-4 mr-1" /> Add Event</Button>
              </CardContent>
            </Card>
          )}

          {/* Media Upload */}
          {canUploadMedia && (
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Image className="w-5 h-5 text-primary" /> Upload Media</CardTitle></CardHeader>
              <CardContent>
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground font-body">Click to select photos</span>
                  <input ref={mediaInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleMediaUpload} />
                </label>
              </CardContent>
            </Card>
          )}

          {/* Record Transaction — Finance/Coach only (NOT coach per plan) */}
          {canManageFinance && !isCoach && (
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /> Record Transaction</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button variant={finType === "in" ? "default" : "outline"} onClick={() => setFinType("in")} className="font-body"><TrendingUp className="w-4 h-4 mr-1" /> Money In</Button>
                  <Button variant={finType === "out" ? "default" : "outline"} onClick={() => setFinType("out")} className="font-body"><TrendingDown className="w-4 h-4 mr-1" /> Money Out</Button>
                </div>
                <select value={finMonth} onChange={(e) => setFinMonth(e.target.value)} className="w-full h-10 rounded-md border border-input bg-secondary px-3 text-foreground font-body">
                  {contributionMonths.map((m) => <option key={m.key} value={m.label}>{m.label}</option>)}
                </select>
                <Input placeholder="Amount (KSh)" type="number" value={finAmount} onChange={(e) => setFinAmount(e.target.value)} className="bg-secondary border-border font-body" />
                <Input placeholder="Description" value={finDesc} onChange={(e) => setFinDesc(e.target.value)} className="bg-secondary border-border font-body" />
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-body", !finDate && "text-muted-foreground")}>
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {finDate ? format(finDate, "PPP") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                    <Calendar mode="single" selected={finDate} onSelect={setFinDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
                <Button onClick={handleRecordTransaction} className="w-full font-body"><Plus className="w-4 h-4 mr-1" /> Record</Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ===== MANAGER: Team Stats Editor ===== */}
        {isManager && (
          <Card className="bg-card border-border card-glow">
            <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Team Stats Editor</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <select value={statsPlayerId} onChange={(e) => setStatsPlayerId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-secondary px-3 text-foreground font-body">
                <option value="">Select player</option>
                {playerMembers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              {statsPlayerId && (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground font-body">Goals</label>
                      <Input type="number" value={statsGoals} onChange={(e) => setStatsGoals(e.target.value)} className="bg-secondary border-border font-body" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground font-body">Assists</label>
                      <Input type="number" value={statsAssists} onChange={(e) => setStatsAssists(e.target.value)} className="bg-secondary border-border font-body" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground font-body">Games</label>
                      <Input type="number" value={statsGames} onChange={(e) => setStatsGames(e.target.value)} className="bg-secondary border-border font-body" />
                    </div>
                  </div>
                  <Input placeholder="Opponent name (optional)" value={statsOpponent} onChange={(e) => setStatsOpponent(e.target.value)} className="bg-secondary border-border font-body" />
                  <Button onClick={handleUpdateStats} className="w-full font-body"><Save className="w-4 h-4 mr-1" /> Save Stats</Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* ===== MANAGER: League Standings Editor ===== */}
        {isManager && (
          <Card className="bg-card border-border card-glow">
            <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" /> League Standings Editor</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {/* Add team */}
              <div className="flex gap-2">
                <Input placeholder="Team name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} className="bg-secondary border-border font-body" />
                <Button onClick={handleAddLeagueTeam} disabled={!newTeamName} className="font-body"><Plus className="w-4 h-4 mr-1" /> Add</Button>
              </div>
              {/* Teams list */}
              <div className="space-y-2">
                {leagueTeams.map((team, i) => (
                  <div key={team.id} className={`border rounded-lg p-3 ${team.is_own_team ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-body font-medium text-sm ${team.is_own_team ? "text-primary" : "text-foreground"}`}>
                        {i + 1}. {team.team_name} {team.is_own_team && "⭐"}
                      </span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => {
                          setEditingTeamId(team.id);
                          setEditTeamData({ played: team.played, won: team.won, drawn: team.drawn, lost: team.lost, gd: team.goal_difference, pts: team.points });
                        }}><Edit className="w-3 h-3" /></Button>
                        {!team.is_own_team && <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => handleDeleteLeagueTeam(team.id)}><Trash2 className="w-3 h-3" /></Button>}
                      </div>
                    </div>
                    {editingTeamId === team.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-6 gap-1">
                          {[["P", "played"], ["W", "won"], ["D", "drawn"], ["L", "lost"], ["GD", "gd"], ["Pts", "pts"]].map(([label, key]) => (
                            <div key={key}>
                              <label className="text-[10px] text-muted-foreground">{label}</label>
                              <Input type="number" value={(editTeamData as any)[key]} onChange={(e) => setEditTeamData(prev => ({ ...prev, [key]: +e.target.value }))} className="h-8 text-xs bg-secondary border-border" />
                            </div>
                          ))}
                        </div>
                        <Button size="sm" onClick={() => handleSaveLeagueTeam(team.id)} className="font-body text-xs"><Save className="w-3 h-3 mr-1" /> Save</Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-6 gap-2 text-xs text-muted-foreground font-body">
                        <span>P: {team.played}</span>
                        <span className="text-green-600">W: {team.won}</span>
                        <span>D: {team.drawn}</span>
                        <span className="text-destructive">L: {team.lost}</span>
                        <span>GD: {team.goal_difference}</span>
                        <span className="text-primary font-bold">Pts: {team.points}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Official's contribution section */}
        {showContributions && (
          <Card className="bg-card border-border card-glow">
            <CardHeader><CardTitle className="font-heading text-lg text-foreground">My Monthly Contributions</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {contributionMonths.map(({ key, label }) => {
                  const status = liveMember.contributions[key] || "unpaid";
                  const isPaid = status === "paid";
                  return (
                    <div key={key} className={`px-4 py-3 rounded-xl border-2 text-center ${isPaid ? "border-primary/40 bg-primary/10" : "border-border bg-muted/30"}`}>
                      <p className="text-xs font-body text-muted-foreground">{label}</p>
                      {isPaid ? <span className="text-green-600">✅</span> : <span className="text-muted-foreground">❌</span>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contribution Approvals */}
        {canApproveContributions && pendingApprovals.length > 0 && (
          <Card className="bg-card border-border card-glow">
            <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Pending Approvals</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {pendingApprovals.map((req) => (
                <div key={req.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="font-body">
                    <p className="text-foreground">{req.playerName}</p>
                    <p className="text-xs text-muted-foreground">{req.monthLabel}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => { approveContribution(req.id); toast({ title: "Approved" }); }}
                      className="font-body text-xs bg-green-600 hover:bg-green-700"><CheckCircle className="w-3 h-3 mr-1" /> Accept</Button>
                    <Button size="sm" variant="outline" onClick={() => { rejectContribution(req.id); toast({ title: "Rejected", variant: "destructive" }); }}
                      className="font-body text-xs border-destructive/30 text-destructive"><XCircle className="w-3 h-3 mr-1" /> Reject</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Fadhir's Contribution Grid */}
        {isFadhir && (
          <Card className="bg-card border-border card-glow">
            <CardHeader>
              <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><CheckCircle className="w-5 h-5 text-primary" /> Contribution Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full font-body text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 sticky left-0 bg-card">Player</th>
                      {contributionMonths.map((m) => <th key={m.key} className="text-center py-2 px-2 whitespace-nowrap">{m.label}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {members.filter((m) => m.id !== "SCF-001").map((m) => (
                      <tr key={m.id} className="border-b border-border">
                        <td className="py-2 text-foreground sticky left-0 bg-card font-medium whitespace-nowrap text-xs">{m.name}</td>
                        {contributionMonths.map((month) => {
                          const status = m.contributions[month.key] || "unpaid";
                          return (
                            <td key={month.key} className="py-2 text-center">
                              <Checkbox checked={status === "paid"}
                                onCheckedChange={(checked) => updateContributionDirect(m.id, month.key, checked ? "paid" : "unpaid")} />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contribution Events — Fadhir & Captains */}
        {canManageContribEvents && (
          <Card className="bg-card border-border card-glow">
            <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Target className="w-5 h-5 text-primary" /> Contribution Events</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Event title" value={ceTitle} onChange={(e) => setCeTitle(e.target.value)} className="bg-secondary border-border font-body" />
                <Input placeholder="Target amount" type="number" value={ceTarget} onChange={(e) => setCeTarget(e.target.value)} className="bg-secondary border-border font-body" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Amount per person" type="number" value={ceAmountPer} onChange={(e) => setCeAmountPer(e.target.value)} className="bg-secondary border-border font-body" />
                <Input placeholder="Description" value={ceDesc} onChange={(e) => setCeDesc(e.target.value)} className="bg-secondary border-border font-body" />
              </div>
              <Button onClick={handleAddContribEvent} className="w-full font-body" disabled={!ceTitle || !ceAmountPer || !ceTarget}>
                <Plus className="w-4 h-4 mr-1" /> Add Event
              </Button>

              {contribEvents.map((event: any) => {
                const eventPayments = contribPayments.filter((p: any) => p.event_id === event.id && p.paid);
                const collected = eventPayments.length * (event.amount_per_person || 0);
                const progress = event.target_amount > 0 ? Math.min((collected / event.target_amount) * 100, 100) : 0;
                return (
                  <div key={event.id} className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-heading text-sm text-foreground">{event.title}</h4>
                        {event.goal_description && <p className="text-xs text-muted-foreground">{event.goal_description}</p>}
                      </div>
                      {progress >= 100 && (
                        <Button size="sm" variant="destructive" onClick={() => deleteContribEvent(event.id)}>
                          <Trash2 className="w-3 h-3 mr-1" /> Delete
                        </Button>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-body">
                      KSh {collected.toLocaleString()} / {Number(event.target_amount).toLocaleString()} ({eventPayments.length} contributors @ KSh {Number(event.amount_per_person).toLocaleString()} each)
                    </div>
                    <Progress value={progress} className="h-2" />
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                      {playerMembers.map(m => {
                        const paid = contribPayments.some((p: any) => p.event_id === event.id && p.member_id === m.id && p.paid);
                        return (
                          <label key={m.id} className="flex items-center gap-1.5 text-xs font-body text-foreground">
                            <Checkbox checked={paid} onCheckedChange={() => toggleContribPayment(event.id, m.id)} />
                            {m.name}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Financial Overview with Export */}
        {canManageFinance && (
          <Card className="bg-card border-border card-glow">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-lg text-foreground">Financial Overview</CardTitle>
              <Button size="sm" variant="outline" onClick={exportFinancialPdf} className="font-body text-xs border-primary/30 text-primary">
                <Download className="w-3 h-3 mr-1" /> Export PDF
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {financialRecords.map((f) => {
                const totalExpenses = f.expenses.reduce((sum, e) => sum + e.amount, 0);
                return (
                  <div key={f.month} className="border border-border rounded-lg p-4 navy-accent">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-heading text-sm text-primary tracking-wider">{f.month}</h4>
                      <Badge variant="outline" className="font-body text-xs border-primary/30 text-primary">{f.contributors} contributors</Badge>
                    </div>
                    {f.contributorNote && <p className="text-xs text-muted-foreground font-body mb-3 italic">{f.contributorNote}</p>}
                    <div className="space-y-2 font-body text-sm">
                      <div className="flex justify-between text-muted-foreground"><span>Opening Balance</span><span>KSh {f.openingBalance.toLocaleString()}</span></div>
                      <div className="flex justify-between text-green-600"><span>Contributions</span><span>+KSh {f.contributions.toLocaleString()}</span></div>
                      {f.expenses.length > 0 && f.expenses.map((exp, i) => (
                        <div key={i} className="flex justify-between text-destructive/80">
                          <span className="text-xs">{exp.date} — {exp.description}</span>
                          <span>-KSh {exp.amount.toLocaleString()}</span>
                        </div>
                      ))}
                      <div className={`flex justify-between font-heading text-sm pt-2 border-t border-border ${f.closingBalance >= 0 ? "text-primary" : "text-destructive"}`}>
                        <span>Closing Balance</span><span>KSh {f.closingBalance.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* Weekly Attendance — Manager + Ethan */}
        {canManageAttendance && (
          <Card className="bg-card border-border card-glow">
            <CardHeader>
              <CardTitle className="font-heading text-lg text-foreground">Weekly Attendance — {currentWeekStart}</CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                {DAYS.map((day) => (
                  <Button key={day} size="sm" variant="outline" onClick={() => { markDayNoActivity(day); toast({ title: `${day}: No Activity` }); }}
                    className="font-body text-xs">{day.slice(0, 3)} — No Activity</Button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full font-body text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left py-2 sticky left-0 bg-card">Player</th>
                      {DAYS.map((d) => <th key={d} className="text-center py-2 px-2">{d.slice(0, 3)}</th>)}
                      <th className="text-center py-2 px-2">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {playerMembers.map((m) => {
                      const playerAtt = attendance.filter((a) => a.playerId === m.id);
                      const pct = calcAttendancePct(playerAtt);

                      return (
                        <tr key={m.id} className="border-b border-border">
                          <td className="py-2 text-foreground sticky left-0 bg-card whitespace-nowrap text-xs">{m.name}</td>
                          {DAYS.map((day) => {
                            const record = playerAtt.find((a) => a.day === day);
                            const status = record?.status || "";
                            const isNoActivity = status === "no_activity";
                            const handleClick = () => {
                              if (isNoActivity) return;
                              if (status === "present") updateAttendance(m.id, day, "excused");
                              else if (status === "excused") updateAttendance(m.id, day, "absent");
                              else updateAttendance(m.id, day, "present");
                            };
                            const display = status === "present" ? "✅" : status === "excused" ? "🔵" : status === "no_activity" ? "➖" : "❌";
                            const colors = status === "present" ? "bg-green-500/20 border-green-500/40"
                              : status === "excused" ? "bg-blue-500/20 border-blue-500/40"
                              : status === "no_activity" ? "bg-muted border-border"
                              : "bg-destructive/10 border-destructive/30";
                            return (
                              <td key={day} className="py-2 text-center">
                                <button onClick={handleClick} disabled={isNoActivity}
                                  className={`w-8 h-8 rounded-md border-2 text-xs transition-all ${colors} ${isNoActivity ? "cursor-not-allowed" : "cursor-pointer hover:opacity-80"}`}>
                                  {display}
                                </button>
                              </td>
                            );
                          })}
                          <td className="py-2 text-center font-heading text-primary text-xs">{playerAtt.filter(a => a.status !== "no_activity").length > 0 ? `${pct}%` : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground font-body mt-2">Click to toggle: ✅ Present → 🔵 Excused → ❌ Absent</p>
            </CardContent>
          </Card>
        )}

        {/* Manager: Delete Gallery Photos */}
        {canDeletePhotos && mediaItems.length > 0 && (
          <Card className="bg-card border-border card-glow">
            <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Trash2 className="w-5 h-5 text-destructive" /> Manage Gallery</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {mediaItems.map((item) => (
                  <div key={item.id} className="relative group">
                    <img src={item.url} alt={item.caption || "Photo"} className="w-full h-24 object-cover rounded-lg border border-border" />
                    <button onClick={() => { deleteMediaItem(item.id, item.url); toast({ title: "Deleted" }); }}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Homepage Photos — Manager only */}
        {isManager && (
          <Card className="bg-card border-border card-glow">
            <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Image className="w-5 h-5 text-primary" /> Homepage Photos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {homepageImages.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {homepageImages.map((img) => (
                    <div key={img.id} className="relative group">
                      <img src={img.url} alt="Homepage photo" className="w-full h-24 object-cover rounded-lg border border-border" />
                      <button onClick={() => { deleteHomepageImage(img.id, img.url); toast({ title: "Removed" }); }}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50">
                <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                <span className="text-xs text-muted-foreground font-body">Upload up to 4 homepage photos</span>
                <input ref={homepageInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleHomepageUpload} />
              </label>
            </CardContent>
          </Card>
        )}

        {/* Coach: Edit Player Positions */}
        {isCoach && (
          <Card className="bg-card border-border card-glow">
            <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Edit className="w-5 h-5 text-primary" /> Edit Player Positions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <select value={posPlayerId} onChange={(e) => setPosPlayerId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-secondary px-3 text-foreground font-body">
                <option value="">Select player</option>
                {playerMembers.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.position || "No position"})</option>)}
              </select>
              {posPlayerId && (
                <>
                  <select value={posValue} onChange={(e) => setPosValue(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-secondary px-3 text-foreground font-body">
                    <option value="">Select position</option>
                    <option value="GK">Goalkeeper</option>
                    <option value="DEF">Defender</option>
                    <option value="DEF (LB)">Defender (LB)</option>
                    <option value="DEF (CB)">Defender (CB)</option>
                    <option value="DEF (RB)">Defender (RB)</option>
                    <option value="MID">Midfielder</option>
                    <option value="ATT">Attacker</option>
                  </select>
                  <Button onClick={handleUpdatePosition} className="w-full font-body"><Save className="w-4 h-4 mr-1" /> Update Position</Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Lineup Builder — Coach only */}
        {isCoach && <LineupBuilder />}

        {/* Coach: First 11 Selector */}
        {isCoach && (
          <Card className="bg-card border-border card-glow">
            <CardHeader>
              <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Star className="w-5 h-5 text-primary" /> First 11 Selector</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground font-body">Players ranked by training attendance, goals & assists</p>
              <div className="space-y-2">
                {playerAnalytics.map((m, i) => {
                  const isStarter = selectedFirst11.includes(m.id);
                  const isSub = selectedSubs.includes(m.id);
                  return (
                    <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-5">{i + 1}</span>
                        <span className="text-sm font-body text-foreground">{m.name}</span>
                        <span className="text-xs text-muted-foreground">({m.position || "N/A"})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground font-body">Att: {m.attPct}%</span>
                        <span className="text-xs text-primary font-body">G:{m.goals || 0} A:{m.assists || 0}</span>
                        <Button size="sm" variant={isStarter ? "default" : "outline"} className="text-xs h-7 px-2"
                          onClick={() => setSelectedFirst11(prev => isStarter ? prev.filter(id => id !== m.id) : prev.length < 11 ? [...prev, m.id] : prev)}>
                          {isStarter ? "Starting" : "Start"}
                        </Button>
                        <Button size="sm" variant={isSub ? "secondary" : "outline"} className="text-xs h-7 px-2"
                          onClick={() => setSelectedSubs(prev => isSub ? prev.filter(id => id !== m.id) : [...prev, m.id])}>
                          Sub
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <Button onClick={exportFirst11Pdf} variant="outline" className="font-body text-xs" disabled={selectedFirst11.length === 0}>
                  <Download className="w-3 h-3 mr-1" /> Export Squad PDF
                </Button>
                <span className="text-xs text-muted-foreground font-body self-center">{selectedFirst11.length}/11 starters, {selectedSubs.length} subs</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Coach: Season End Date */}
        {isCoach && (
          <Card className="bg-card border-border card-glow">
            <CardHeader><CardTitle className="font-heading text-lg text-foreground">Season Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-body", !seasonEndDate && "text-muted-foreground")}>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {seasonEndDate ? format(seasonEndDate, "PPP") : "Set season end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                  <Calendar mode="single" selected={seasonEndDate} onSelect={setSeasonEndDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              {seasonEndDate && (
                <Button onClick={async () => {
                  await supabase.from("season_config").upsert({ id: "main", end_date: seasonEndDate.toISOString(), created_by: user.id } as any);
                  toast({ title: "Season end date set", description: format(seasonEndDate, "PPP") });
                }} className="font-body"><Save className="w-4 h-4 mr-1" /> Save</Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Coach: Remove Player */}
        {isCoach && (
          <Card className="bg-card border-border card-glow">
            <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><UserMinus className="w-5 h-5 text-destructive" /> Remove Player</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <select value={removePlayerId} onChange={(e) => setRemovePlayerId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-secondary px-3 text-foreground font-body">
                <option value="">Select player to remove</option>
                {playerMembers.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.id})</option>)}
              </select>
              <Button variant="destructive" onClick={() => setShowRemoveConfirm(true)} disabled={!removePlayerId} className="w-full font-body">
                <UserMinus className="w-4 h-4 mr-1" /> Remove Player
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
          <DialogContent className="bg-card border-border">
            <DialogHeader><DialogTitle className="font-heading text-foreground">Confirm Removal</DialogTitle></DialogHeader>
            <p className="font-body text-muted-foreground">Remove <span className="text-foreground font-medium">{members.find((m) => m.id === removePlayerId)?.name}</span> permanently?</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowRemoveConfirm(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleRemovePlayer}>Remove</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default OfficialProfile;
