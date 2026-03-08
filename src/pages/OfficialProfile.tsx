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
  UserPlus, MessageCircle, Send, Mail, Footprints, Gamepad2, Shield, Hand, Crosshair,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { contributionMonths, getContribMonthsForMember } from "@/data/team-data";
import { generateBrandedDocx, type DocxTableData } from "@/lib/docx-export";
import { getPositionGroup, getFullPositionName } from "@/data/team-data";
import { supabase } from "@/integrations/supabase/client";
import { getStatsForPosition, getPerfFieldsForPosition, calculatePotmScore } from "@/lib/position-stats";
import LineupBuilder from "@/components/LineupBuilder";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

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
  division: string;
}

const OfficialProfile = () => {
  const { user } = useAuth();
  const {
    members, gameScores, calendarEvents, financialRecords, pendingApprovals,
    profilePics, attendance, currentWeekStart, mediaItems, homepageImages,
    addGameScore, addCalendarEvent, deleteGameScore, updateGameScore,
    approveContribution, rejectContribution, addFinancialTransaction,
    uploadProfilePicToStorage, uploadMediaToStorage,
    updateContributionDirect, updateAttendance, markDayNoActivity,
    requestContribution, deleteMediaItem, removePlayer, addPlayer,
    uploadHomepageImages, deleteHomepageImage, updatePlayerStats,
    addMatchPerformance, messages, sendMessage, markMessageRead, matchPerformances,
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
  const [statsSaves, setStatsSaves] = useState("");
  const [statsCleanSheets, setStatsCleanSheets] = useState("");
  const [statsAerialDuels, setStatsAerialDuels] = useState("");
  const [statsTackles, setStatsTackles] = useState("");
  const [statsInterceptions, setStatsInterceptions] = useState("");
  const [statsClearances, setStatsClearances] = useState("");
  const [statsSuccessfulTackles, setStatsSuccessfulTackles] = useState("");
  const [statsDirectTargets, setStatsDirectTargets] = useState("");
  const [statsDirectShots, setStatsDirectShots] = useState("");

  // Position Editor state
  const [posPlayerId, setPosPlayerId] = useState("");
  const [posValue, setPosValue] = useState("");

  // League Teams state
  const [leagueTeams, setLeagueTeams] = useState<LeagueTeam[]>([]);
  const [leagueLoaded, setLeagueLoaded] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editTeamData, setEditTeamData] = useState({ played: 0, won: 0, drawn: 0, lost: 0, gd: 0, pts: 0 });

  // Amateur standings
  const [newAmateurTeamName, setNewAmateurTeamName] = useState("");
  const [editingAmateurTeamId, setEditingAmateurTeamId] = useState<string | null>(null);
  const [editAmateurTeamData, setEditAmateurTeamData] = useState({ played: 0, won: 0, drawn: 0, lost: 0, gd: 0, pts: 0 });

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

  // Manager: Edit/Delete scores
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
  const [editScoreData, setEditScoreData] = useState({ opponent: "", ourScore: 0, theirScore: 0 });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Add Player / Fan
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerSquad, setNewPlayerSquad] = useState("");
  const [newPlayerPos, setNewPlayerPos] = useState("");
  const [newMemberType, setNewMemberType] = useState<"player" | "fan">("player");
  const [newGameType, setNewGameType] = useState("friendly");
  const [newVenue, setNewVenue] = useState("");
  const [newScoreDate, setNewScoreDate] = useState("");
  const [addedFanId, setAddedFanId] = useState<string | null>(null);

  // Game Stats form state
  const [lastAddedGameId, setLastAddedGameId] = useState<string | null>(null);
  const [lastAddedOpponent, setLastAddedOpponent] = useState("");
  const [firstHalfStats, setFirstHalfStats] = useState({ shots: 0, shotsOnTarget: 0, penalties: 0, freekicks: 0, cornerKicks: 0, fouls: 0, offsides: 0, yellowCards: 0, redCards: 0 });
  const [secondHalfStats, setSecondHalfStats] = useState({ shots: 0, shotsOnTarget: 0, penalties: 0, freekicks: 0, cornerKicks: 0, fouls: 0, offsides: 0, yellowCards: 0, redCards: 0 });

  // Match Performance Recorder
  const [perfGameId, setPerfGameId] = useState("");
  const [perfPlayerId, setPerfPlayerId] = useState("");
  const [perfGoals, setPerfGoals] = useState("0");
  const [perfAssists, setPerfAssists] = useState("0");
  const [perfSaves, setPerfSaves] = useState("0");
  const [perfTackles, setPerfTackles] = useState("0");
  const [perfInterceptions, setPerfInterceptions] = useState("0");
  const [perfBlocks, setPerfBlocks] = useState("0");
  const [perfClearances, setPerfClearances] = useState("0");
  const [perfCleanSheet, setPerfCleanSheet] = useState(false);
  const [perfAerialDuels, setPerfAerialDuels] = useState("0");
  const [perfRating, setPerfRating] = useState("5");
  const [perfIsPotm, setPerfIsPotm] = useState(false);

  // Message reply + send
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [sendMsgTo, setSendMsgTo] = useState("");
  const [sendMsgContent, setSendMsgContent] = useState("");

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

  const isCoach = user.role === "coach";
  const isFadhir = user.id === "SCF-002";
  const isManager = user.role === "manager";
  const isFabian = user.id === "SCF-001";
  const isCaptain = user.role === "captain";
  const isAssistantCoach = user.role === "assistant_coach";
  const canUploadMedia = ["coach", "manager", "captain", "assistant_coach"].includes(user.role);
  const canManageFinance = isFadhir || isCoach;
  const canApproveContributions = isFadhir || isCoach;
  const canDeletePhotos = isManager;
  const canManageContribEvents = isFadhir || isCaptain;
  const showContributions = !isFabian && !isAssistantCoach;
  const canManageAttendance = isManager || user.id === "SCF-004" || isAssistantCoach;
  const canAddScoresEvents = isManager || isCaptain;
  const canReceiveMessages = true; // All officials can receive messages now

  const playerMembers = members.filter((m) => m.role === "player" || m.role === "captain");
  const ourScoreNum = parseInt(newOurScore) || 0;

  // League team helpers
  const leagueTeamsMain = leagueTeams.filter(t => !t.division || t.division === "league");
  const leagueTeamsAmateur = leagueTeams.filter(t => t.division === "amateur");

  const addScore = async () => {
    if (!newOpponent || !newOurScore || !newTheirScore) return;
    const opponentName = newOpponent;
    const result = await addGameScore({
      date: newScoreDate || new Date().toISOString().split("T")[0],
      opponent: newOpponent, ourScore: parseInt(newOurScore), theirScore: parseInt(newTheirScore),
      scorers: scorers.filter(Boolean),
      gameType: newGameType,
      venue: newVenue,
    });
    toast({ title: "Score Added", description: `vs ${opponentName} recorded. Now add match stats below.` });
    if (result?.id) {
      setLastAddedGameId(result.id);
      setLastAddedOpponent(opponentName);
      setFirstHalfStats({ shots: 0, shotsOnTarget: 0, penalties: 0, freekicks: 0, cornerKicks: 0, fouls: 0, offsides: 0, yellowCards: 0, redCards: 0 });
      setSecondHalfStats({ shots: 0, shotsOnTarget: 0, penalties: 0, freekicks: 0, cornerKicks: 0, fouls: 0, offsides: 0, yellowCards: 0, redCards: 0 });
    }
    setNewOpponent(""); setNewOurScore(""); setNewTheirScore(""); setScorers([]);
    setNewGameType("friendly"); setNewVenue(""); setNewScoreDate("");
  };

  const handleSaveGameStats = async () => {
    if (!lastAddedGameId) return;
    const saveHalf = async (half: string, stats: any) => {
      const { error } = await supabase.from("game_stats").upsert({
        game_id: lastAddedGameId, half,
        shots: stats.shots ?? 0, shots_on_target: stats.shotsOnTarget ?? 0, penalties: stats.penalties ?? 0,
        freekicks: stats.freekicks ?? 0, corner_kicks: stats.cornerKicks ?? 0, fouls: stats.fouls ?? 0,
        offsides: stats.offsides ?? 0, yellow_cards: stats.yellowCards ?? 0, red_cards: stats.redCards ?? 0,
      } as any, { onConflict: "game_id,half" });
      if (error) {
        console.error("Failed to save game stats:", error);
        toast({ title: "Error saving stats", description: error.message, variant: "destructive" });
        return false;
      }
      return true;
    };
    const r1 = await saveHalf("first", firstHalfStats);
    const r2 = await saveHalf("second", secondHalfStats);
    if (r1 && r2) {
      toast({ title: "Game Stats Saved", description: `Stats for vs ${lastAddedOpponent} recorded.` });
      setLastAddedGameId(null);
      setLastAddedOpponent("");
    }
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
    const player = members.find(m => m.id === statsPlayerId);
    const fields = getStatsForPosition(player?.position);
    const statsObj: Record<string, number> = {};
    const stateMap: Record<string, string> = {
      saves: statsSaves, cleanSheets: statsCleanSheets, aerialDuels: statsAerialDuels,
      tackles: statsTackles, interceptions: statsInterceptions, assists: statsAssists,
      goals: statsGoals, directShots: statsDirectShots,
    };
    for (const f of fields) {
      statsObj[f.key] = parseInt(stateMap[f.key] || "0") || 0;
    }
    await updatePlayerStats(statsPlayerId, statsObj);
    toast({ title: "Stats Updated" });
  };

  const handleUpdatePosition = async () => {
    if (!posPlayerId || !posValue) return;
    await supabase.from("members").update({ position: posValue }).eq("id", posPlayerId);
    toast({ title: "Position Updated" });
    setPosPlayerId(""); setPosValue("");
  };

  // League team management
  const handleAddLeagueTeam = async (division: string = "league") => {
    const name = division === "amateur" ? newAmateurTeamName : newTeamName;
    if (!name) return;
    const { data } = await supabase.from("league_teams").insert({ team_name: name, is_own_team: false, division } as any).select().single();
    if (data) {
      setLeagueTeams(prev => [...prev, data as LeagueTeam].sort((a, b) => b.points - a.points));
      toast({ title: "Team Added" });
    }
    if (division === "amateur") setNewAmateurTeamName(""); else setNewTeamName("");
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

  const handleSaveAmateurTeam = async (teamId: string) => {
    await supabase.from("league_teams").update({
      played: editAmateurTeamData.played, won: editAmateurTeamData.won, drawn: editAmateurTeamData.drawn,
      lost: editAmateurTeamData.lost, goal_difference: editAmateurTeamData.gd, points: editAmateurTeamData.pts,
    } as any).eq("id", teamId);
    setLeagueTeams(prev => prev.map(t => t.id === teamId ? { ...t, played: editAmateurTeamData.played, won: editAmateurTeamData.won, drawn: editAmateurTeamData.drawn, lost: editAmateurTeamData.lost, goal_difference: editAmateurTeamData.gd, points: editAmateurTeamData.pts } : t).sort((a, b) => b.points - a.points));
    setEditingAmateurTeamId(null);
    toast({ title: "Amateur Standings Updated" });
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
    const tables: DocxTableData[] = [];
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
    generateBrandedDocx("Detailed Financial Summary Report", tables, "suncity_fc_financial_detailed.docx");
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
    const tables: DocxTableData[] = [
      { head: [["Starting XI"]], body: starters.filter(Boolean).map((m, i) => [`${i + 1}. ${m!.name} (${getFullPositionName(m!.position)})`]) },
      { head: [["Substitutes"]], body: subs.filter(Boolean).map((m, i) => [`${i + 1}. ${m!.name} (${getFullPositionName(m!.position)})`]) },
    ];
    generateBrandedDocx("Match Day Squad Selection", tables, "suncity_fc_first11.docx");
  };

  const liveMember = members.find((m) => m.id === user.id) || user;

  // When selecting a player for stats editor, load their current stats
  const selectedStatsPlayer = members.find(m => m.id === statsPlayerId);
  const selectedPosGroup = getPositionGroup(selectedStatsPlayer?.position);

  useEffect(() => {
    if (selectedStatsPlayer) {
      setStatsGoals(String(selectedStatsPlayer.goals || 0));
      setStatsAssists(String(selectedStatsPlayer.assists || 0));
      setStatsGames(String(selectedStatsPlayer.gamesPlayed || 0));
      setStatsSaves(String(selectedStatsPlayer.saves || 0));
      setStatsCleanSheets(String(selectedStatsPlayer.cleanSheets || 0));
      setStatsAerialDuels(String(selectedStatsPlayer.aerialDuels || 0));
      setStatsTackles(String(selectedStatsPlayer.tackles || 0));
      setStatsInterceptions(String(selectedStatsPlayer.interceptions || 0));
      setStatsClearances(String(selectedStatsPlayer.clearances || 0));
      setStatsSuccessfulTackles(String(selectedStatsPlayer.successfulTackles || 0));
      setStatsDirectTargets(String(selectedStatsPlayer.directTargets || 0));
      setStatsDirectShots(String(selectedStatsPlayer.directShots || 0));
    }
  }, [statsPlayerId]);

  // Handle add player/fan
  const handleAddPlayer = async () => {
    if (!newPlayerName || (!newPlayerSquad && newMemberType === "player")) return;
    const newId = await addPlayer(newPlayerName, parseInt(newPlayerSquad) || 0, newPlayerPos, newMemberType);
    if (newMemberType === "fan") {
      setAddedFanId(newId);
      toast({ title: "Fan Added", description: `${newPlayerName} — Login ID: ${newId}` });
    } else {
      toast({ title: "Player Added", description: `${newPlayerName} (#${newPlayerSquad})` });
    }
    setNewPlayerName(""); setNewPlayerSquad(""); setNewPlayerPos(""); setNewMemberType("player");
  };

  // Handle edit score
  const handleSaveEditScore = async () => {
    if (!editingScoreId) return;
    await updateGameScore(editingScoreId, {
      opponent: editScoreData.opponent,
      ourScore: editScoreData.ourScore,
      theirScore: editScoreData.theirScore,
    });
    toast({ title: "Score Updated" });
    setEditingScoreId(null);
  };

  const handleDeleteScore = async (id: string) => {
    await deleteGameScore(id);
    toast({ title: "Score Deleted" });
    setDeleteConfirmId(null);
  };

  const handleAddMatchPerf = async () => {
    if (!perfGameId || !perfPlayerId) return;
    const perfPlayer = members.find(m => m.id === perfPlayerId);
    const perfPosGroup = getPositionGroup(perfPlayer?.position);
    
    // Build perf data — only position-relevant fields, rest default to 0
    const perfData: any = {
      gameId: perfGameId, playerId: perfPlayerId,
      goals: 0, assists: 0, saves: 0, tackles: 0,
      interceptions: 0, blocks: 0, clearances: 0,
      cleanSheet: false, aerialDuels: 0, rating: 0, isPotm: false,
    };
    
    if (perfPosGroup === "GK") {
      perfData.saves = parseInt(perfSaves) || 0;
      perfData.aerialDuels = parseInt(perfAerialDuels) || 0;
      perfData.cleanSheet = perfCleanSheet;
    } else if (perfPosGroup === "DEF") {
      perfData.tackles = parseInt(perfTackles) || 0;
      perfData.interceptions = parseInt(perfInterceptions) || 0;
      perfData.goals = parseInt(perfGoals) || 0;
      perfData.assists = parseInt(perfAssists) || 0;
    } else {
      perfData.goals = parseInt(perfGoals) || 0;
      perfData.assists = parseInt(perfAssists) || 0;
      perfData.tackles = parseInt(perfTackles) || 0;
    }
    
    await addMatchPerformance(perfData);
    
    // Auto-calculate POTM for this game
    const { data: allPerfs } = await supabase.from("match_performances")
      .select("*").eq("game_id", perfGameId);
    if (allPerfs && allPerfs.length > 0) {
      let bestId = "";
      let bestScore = -1;
      for (const p of allPerfs) {
        const score = calculatePotmScore({
          goals: p.goals, assists: p.assists, saves: p.saves,
          tackles: p.tackles, interceptions: p.interceptions,
          cleanSheet: p.clean_sheet, aerialDuels: p.aerial_duels,
        });
        if (score > bestScore) { bestScore = score; bestId = p.id; }
      }
      // Reset all POTM flags, then set the best one
      await supabase.from("match_performances").update({ is_potm: false } as any).eq("game_id", perfGameId);
      if (bestId) {
        await supabase.from("match_performances").update({ is_potm: true } as any).eq("id", bestId);
      }
    }
    
    toast({ title: "Performance Recorded", description: "POTM auto-calculated." });
    setPerfPlayerId(""); setPerfGoals("0"); setPerfAssists("0"); setPerfSaves("0");
    setPerfTackles("0"); setPerfInterceptions("0"); setPerfBlocks("0"); setPerfClearances("0");
    setPerfCleanSheet(false); setPerfAerialDuels("0");
  };

  // Handle reply
  const handleReply = async () => {
    if (!replyTo || !replyContent.trim()) return;
    await sendMessage(user.id, replyTo, replyContent.trim());
    toast({ title: "Reply Sent" });
    setReplyTo(null); setReplyContent("");
  };

  // Handle send message
  const handleSendMsg = async () => {
    if (!sendMsgTo || !sendMsgContent.trim()) return;
    await sendMessage(user.id, sendMsgTo, sendMsgContent.trim());
    toast({ title: "Message Sent" });
    setSendMsgTo(""); setSendMsgContent("");
  };

  // Messages for this official
  const myMessages = messages.filter(m => m.toId === user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Captain stats — position-specific
  const captainStatFields = getStatsForPosition(liveMember.position);
  const iconMapOfficial: Record<string, any> = {
    saves: Hand, cleanSheets: Shield, aerialDuels: Crosshair,
    tackles: Shield, interceptions: Crosshair, assists: Footprints,
    goals: Target, directShots: Crosshair,
  };
  const getCaptainStatCards = () => {
    return captainStatFields.map(sf => ({
      icon: iconMapOfficial[sf.key] || Target,
      label: sf.label,
      value: (liveMember as any)[sf.key] || 0,
    }));
  };

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
          <h2 className="font-heading text-2xl text-foreground mt-4">{liveMember.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Badge className="bg-primary text-primary-foreground font-body capitalize">{user.role.replace("_", " ")}</Badge>
            <Badge variant="outline" className="border-primary/30 text-primary font-body">{user.id}</Badge>
          </div>
          {liveMember.position && <p className="text-muted-foreground font-body text-sm mt-1">{getFullPositionName(liveMember.position)}</p>}
        </motion.div>

        {/* ===== CAPTAIN PERSONAL STATS ===== */}
        {(isCaptain || isFadhir) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> My Stats</CardTitle></CardHeader>
              <CardContent>
                <div className={`grid gap-4 ${getCaptainStatCards().length === 4 ? "grid-cols-4" : getCaptainStatCards().length === 5 ? "grid-cols-5" : "grid-cols-3"}`}>
                  {getCaptainStatCards().map(({ icon: Icon, label, value }) => (
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

        <div className="grid md:grid-cols-2 gap-6">
          {/* Game Scores — MANAGER & CAPTAINS ONLY */}
          {canAddScoresEvents && (
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" /> Add Recent Results</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Opponent name" value={newOpponent} onChange={(e) => setNewOpponent(e.target.value)} className="bg-secondary border-border font-body" />
                <div className="grid grid-cols-2 gap-2">
                  <Input placeholder="Our score" type="number" value={newOurScore} onChange={(e) => { setNewOurScore(e.target.value); setScorers([]); }} className="bg-secondary border-border font-body" />
                  <Input placeholder="Their score" type="number" value={newTheirScore} onChange={(e) => setNewTheirScore(e.target.value)} className="bg-secondary border-border font-body" />
                </div>
                <Input type="date" value={newScoreDate} onChange={(e) => setNewScoreDate(e.target.value)} className="bg-secondary border-border font-body" placeholder="Date played" />
                <select value={newGameType} onChange={(e) => setNewGameType(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-secondary px-3 text-foreground font-body">
                  <option value="friendly">Friendly</option>
                  <option value="league">League (Kanjuri)</option>
                  <option value="amateur">Amateur</option>
                </select>
                <select value={newVenue} onChange={(e) => setNewVenue(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-secondary px-3 text-foreground font-body">
                  <option value="">Select venue</option>
                  <option value="Kanjuri Grounds">Kanjuri Grounds</option>
                  <option value="G-Town">G-Town</option>
                  <option value="School Field">School Field</option>
                </select>
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

          {/* Game Stats Form — appears after adding a score */}
          {lastAddedGameId && canAddScoresEvents && (
            <Card className="bg-card border-border card-glow border-primary/30">
              <CardHeader>
                <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" /> Match Stats — vs {lastAddedOpponent}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="overflow-x-auto">
                  <table className="w-full font-body text-sm">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        <th className="text-left py-2 px-2">Stat</th>
                        <th className="text-center py-2 px-2">1st Half</th>
                        <th className="text-center py-2 px-2">2nd Half</th>
                      </tr>
                    </thead>
                    <tbody>
                      {([
                        ["Shots", "shots"],
                        ["Shots on Target", "shotsOnTarget"],
                        ["Penalties", "penalties"],
                        ["Freekicks", "freekicks"],
                        ["Corner Kicks", "cornerKicks"],
                        ["Fouls", "fouls"],
                        ["Offsides", "offsides"],
                        ["Yellow Cards", "yellowCards"],
                        ["Red Cards", "redCards"],
                      ] as [string, keyof typeof firstHalfStats][]).map(([label, key]) => (
                        <tr key={key} className="border-b border-border">
                          <td className="py-2 px-2 text-foreground">{label}</td>
                          <td className="py-1 px-1">
                            <Input type="number" min={0} value={firstHalfStats[key]}
                              onChange={(e) => setFirstHalfStats(p => ({ ...p, [key]: parseInt(e.target.value) || 0 }))}
                              className="bg-secondary border-border text-center h-8 w-16 mx-auto font-body" />
                          </td>
                          <td className="py-1 px-1">
                            <Input type="number" min={0} value={secondHalfStats[key]}
                              onChange={(e) => setSecondHalfStats(p => ({ ...p, [key]: parseInt(e.target.value) || 0 }))}
                              className="bg-secondary border-border text-center h-8 w-16 mx-auto font-body" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveGameStats} className="flex-1 font-body"><Save className="w-4 h-4 mr-1" /> Save Stats</Button>
                  <Button variant="outline" onClick={() => setLastAddedGameId(null)} className="font-body">Skip</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {canAddScoresEvents && (
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

          {/* Record Transaction — Finance only (Fadhir) */}
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

        {/* ===== MANAGER: Manage Recent Results (Edit/Delete) ===== */}
        {isManager && gameScores.length > 0 && (
          <Card className="bg-card border-border card-glow">
            <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" /> Manage Recent Results</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {gameScores.slice(0, 10).map((game) => (
                <div key={game.id} className="border border-border rounded-lg p-3">
                  {editingScoreId === game.id ? (
                    <div className="space-y-2">
                      <Input value={editScoreData.opponent} onChange={(e) => setEditScoreData(p => ({ ...p, opponent: e.target.value }))} className="bg-secondary border-border font-body" placeholder="Opponent" />
                      <div className="grid grid-cols-2 gap-2">
                        <Input type="number" value={editScoreData.ourScore} onChange={(e) => setEditScoreData(p => ({ ...p, ourScore: +e.target.value }))} className="bg-secondary border-border font-body" />
                        <Input type="number" value={editScoreData.theirScore} onChange={(e) => setEditScoreData(p => ({ ...p, theirScore: +e.target.value }))} className="bg-secondary border-border font-body" />
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEditScore} className="font-body text-xs"><Save className="w-3 h-3 mr-1" /> Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingScoreId(null)} className="font-body text-xs">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-body text-sm text-foreground">vs {game.opponent}</span>
                        <span className="ml-2 font-heading text-primary text-sm">{game.ourScore} - {game.theirScore}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{game.date}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => {
                          setEditingScoreId(game.id);
                          setEditScoreData({ opponent: game.opponent, ourScore: game.ourScore, theirScore: game.theirScore });
                        }}><Edit className="w-3 h-3" /></Button>
                        {deleteConfirmId === game.id ? (
                          <div className="flex gap-1">
                            <Button size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={() => handleDeleteScore(game.id)}>Confirm</Button>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setDeleteConfirmId(null)}>No</Button>
                          </div>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => setDeleteConfirmId(game.id)}><Trash2 className="w-3 h-3" /></Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* ===== COACH & MANAGER: Add New Player / Fan ===== */}
        {(isCoach || isManager) && (
          <Card className="bg-card border-border card-glow">
            <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary" /> Add New Member</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button variant={newMemberType === "player" ? "default" : "outline"} onClick={() => setNewMemberType("player")} className="font-body">Player</Button>
                <Button variant={newMemberType === "fan" ? "default" : "outline"} onClick={() => setNewMemberType("fan")} className="font-body">Fan</Button>
              </div>
              <Input placeholder={newMemberType === "fan" ? "Fan name" : "Player name"} value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} className="bg-secondary border-border font-body" />
              <Input placeholder="Squad number" type="number" value={newPlayerSquad} onChange={(e) => setNewPlayerSquad(e.target.value)} className="bg-secondary border-border font-body" />
              {newMemberType === "player" && (
                <select value={newPlayerPos} onChange={(e) => setNewPlayerPos(e.target.value)} className="w-full h-10 rounded-md border border-input bg-secondary px-3 text-foreground font-body">
                  <option value="">Select position</option>
                  <option value="GK">Goalkeeper</option>
                  <option value="DEF">Defender</option>
                  <option value="DEF (LB)">Defender (LB)</option>
                  <option value="DEF (CB)">Defender (CB)</option>
                  <option value="DEF (RB)">Defender (RB)</option>
                  <option value="MID">Midfielder</option>
                  <option value="ATT">Attacker</option>
                </select>
              )}
              <Button onClick={handleAddPlayer} disabled={!newPlayerName || !newPlayerSquad} className="w-full font-body"><UserPlus className="w-4 h-4 mr-1" /> Add {newMemberType === "fan" ? "Fan" : "Player"}</Button>
            </CardContent>
          </Card>
        )}

        {/* ===== MANAGER: Team Stats Editor (EXPANDED) ===== */}
        {isManager && (
          <Card className="bg-card border-border card-glow">
            <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Team Stats Editor</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <select value={statsPlayerId} onChange={(e) => setStatsPlayerId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-secondary px-3 text-foreground font-body">
                <option value="">Select player</option>
                {playerMembers.map((m) => <option key={m.id} value={m.id}>{m.name} ({getFullPositionName(m.position)})</option>)}
              </select>
              {statsPlayerId && (
                <>
                  {/* Common stats for all */}
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
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-primary font-body">Successful Tackles</label>
                      <Input type="number" value={statsSuccessfulTackles} onChange={(e) => setStatsSuccessfulTackles(e.target.value)} className="bg-secondary border-border font-body" />
                    </div>
                    <div>
                      <label className="text-xs text-primary font-body">Direct Targets</label>
                      <Input type="number" value={statsDirectTargets} onChange={(e) => setStatsDirectTargets(e.target.value)} className="bg-secondary border-border font-body" />
                    </div>
                  </div>

                  {/* GK-specific */}
                  {selectedPosGroup === "GK" && (
                    <div className="grid grid-cols-3 gap-2 border-t border-border pt-2">
                      <div>
                        <label className="text-xs text-primary font-body">Saves</label>
                        <Input type="number" value={statsSaves} onChange={(e) => setStatsSaves(e.target.value)} className="bg-secondary border-border font-body" />
                      </div>
                      <div>
                        <label className="text-xs text-primary font-body">Clean Sheets</label>
                        <Input type="number" value={statsCleanSheets} onChange={(e) => setStatsCleanSheets(e.target.value)} className="bg-secondary border-border font-body" />
                      </div>
                      <div>
                        <label className="text-xs text-primary font-body">Aerial Duels</label>
                        <Input type="number" value={statsAerialDuels} onChange={(e) => setStatsAerialDuels(e.target.value)} className="bg-secondary border-border font-body" />
                      </div>
                    </div>
                  )}

                  {/* DEF-specific */}
                  {selectedPosGroup === "DEF" && (
                    <div className="grid grid-cols-2 gap-2 border-t border-border pt-2">
                      <div>
                        <label className="text-xs text-primary font-body">Tackles</label>
                        <Input type="number" value={statsTackles} onChange={(e) => setStatsTackles(e.target.value)} className="bg-secondary border-border font-body" />
                      </div>
                      <div>
                        <label className="text-xs text-primary font-body">Interceptions</label>
                        <Input type="number" value={statsInterceptions} onChange={(e) => setStatsInterceptions(e.target.value)} className="bg-secondary border-border font-body" />
                      </div>
                      <div>
                        <label className="text-xs text-primary font-body">Clearances</label>
                        <Input type="number" value={statsClearances} onChange={(e) => setStatsClearances(e.target.value)} className="bg-secondary border-border font-body" />
                      </div>
                      <div>
                        <label className="text-xs text-primary font-body">Direct Shots</label>
                        <Input type="number" value={statsDirectShots} onChange={(e) => setStatsDirectShots(e.target.value)} className="bg-secondary border-border font-body" />
                      </div>
                    </div>
                  )}

                  <Button onClick={handleUpdateStats} className="w-full font-body"><Save className="w-4 h-4 mr-1" /> Save Stats</Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* ===== MANAGER: Match Day Performance Recorder ===== */}
        {isManager && (
          <Card className="bg-card border-border card-glow">
            <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Star className="w-5 h-5 text-primary" /> Record Match Day Stats</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <select value={perfGameId} onChange={(e) => setPerfGameId(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-secondary px-3 text-foreground font-body">
                <option value="">Select match</option>
                {gameScores.map(g => <option key={g.id} value={g.id}>{g.date} — vs {g.opponent} ({g.ourScore}-{g.theirScore})</option>)}
              </select>
              {perfGameId && (
                <>
                  <select value={perfPlayerId} onChange={(e) => setPerfPlayerId(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-secondary px-3 text-foreground font-body">
                    <option value="">Select player</option>
                    {playerMembers.map(m => <option key={m.id} value={m.id}>{m.name} ({getFullPositionName(m.position)})</option>)}
                  </select>
                  {perfPlayerId && (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        <div><label className="text-xs text-muted-foreground font-body">Goals</label><Input type="number" value={perfGoals} onChange={(e) => setPerfGoals(e.target.value)} className="bg-secondary border-border font-body" /></div>
                        <div><label className="text-xs text-muted-foreground font-body">Assists</label><Input type="number" value={perfAssists} onChange={(e) => setPerfAssists(e.target.value)} className="bg-secondary border-border font-body" /></div>
                        <div><label className="text-xs text-muted-foreground font-body">Rating (1-10)</label><Input type="number" min="1" max="10" step="0.5" value={perfRating} onChange={(e) => setPerfRating(e.target.value)} className="bg-secondary border-border font-body" /></div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div><label className="text-xs text-muted-foreground font-body">Saves</label><Input type="number" value={perfSaves} onChange={(e) => setPerfSaves(e.target.value)} className="bg-secondary border-border font-body" /></div>
                        <div><label className="text-xs text-muted-foreground font-body">Tackles</label><Input type="number" value={perfTackles} onChange={(e) => setPerfTackles(e.target.value)} className="bg-secondary border-border font-body" /></div>
                        <div><label className="text-xs text-muted-foreground font-body">Interceptions</label><Input type="number" value={perfInterceptions} onChange={(e) => setPerfInterceptions(e.target.value)} className="bg-secondary border-border font-body" /></div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div><label className="text-xs text-muted-foreground font-body">Blocks</label><Input type="number" value={perfBlocks} onChange={(e) => setPerfBlocks(e.target.value)} className="bg-secondary border-border font-body" /></div>
                        <div><label className="text-xs text-muted-foreground font-body">Clearances</label><Input type="number" value={perfClearances} onChange={(e) => setPerfClearances(e.target.value)} className="bg-secondary border-border font-body" /></div>
                        <div><label className="text-xs text-muted-foreground font-body">Aerial Duels</label><Input type="number" value={perfAerialDuels} onChange={(e) => setPerfAerialDuels(e.target.value)} className="bg-secondary border-border font-body" /></div>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm font-body text-foreground">
                          <Checkbox checked={perfCleanSheet} onCheckedChange={(c) => setPerfCleanSheet(!!c)} /> Clean Sheet
                        </label>
                        <label className="flex items-center gap-2 text-sm font-body text-primary">
                          <Checkbox checked={perfIsPotm} onCheckedChange={(c) => setPerfIsPotm(!!c)} /> ⭐ Player of the Match
                        </label>
                      </div>
                      <Button onClick={handleAddMatchPerf} className="w-full font-body"><Save className="w-4 h-4 mr-1" /> Record Performance</Button>
                    </>
                  )}
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
              <div className="flex gap-2">
                <Input placeholder="Team name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} className="bg-secondary border-border font-body" />
                <Button onClick={() => handleAddLeagueTeam("league")} disabled={!newTeamName} className="font-body"><Plus className="w-4 h-4 mr-1" /> Add</Button>
              </div>
              <div className="space-y-2">
                {leagueTeamsMain.map((team, i) => (
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

        {/* ===== MANAGER: Amateur Standings Editor ===== */}
        {isManager && (
          <Card className="bg-card border-border card-glow">
            <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" /> Amateur Standings Editor</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="Amateur team name" value={newAmateurTeamName} onChange={(e) => setNewAmateurTeamName(e.target.value)} className="bg-secondary border-border font-body" />
                <Button onClick={() => handleAddLeagueTeam("amateur")} disabled={!newAmateurTeamName} className="font-body"><Plus className="w-4 h-4 mr-1" /> Add</Button>
              </div>
              <div className="space-y-2">
                {leagueTeamsAmateur.map((team, i) => (
                  <div key={team.id} className={`border rounded-lg p-3 ${team.is_own_team ? "border-primary/40 bg-primary/5" : "border-border"}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-body font-medium text-sm ${team.is_own_team ? "text-primary" : "text-foreground"}`}>
                        {i + 1}. {team.team_name} {team.is_own_team && "⭐"}
                      </span>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => {
                          setEditingAmateurTeamId(team.id);
                          setEditAmateurTeamData({ played: team.played, won: team.won, drawn: team.drawn, lost: team.lost, gd: team.goal_difference, pts: team.points });
                        }}><Edit className="w-3 h-3" /></Button>
                        {!team.is_own_team && <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => handleDeleteLeagueTeam(team.id)}><Trash2 className="w-3 h-3" /></Button>}
                      </div>
                    </div>
                    {editingAmateurTeamId === team.id ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-6 gap-1">
                          {[["P", "played"], ["W", "won"], ["D", "drawn"], ["L", "lost"], ["GD", "gd"], ["Pts", "pts"]].map(([label, key]) => (
                            <div key={key}>
                              <label className="text-[10px] text-muted-foreground">{label}</label>
                              <Input type="number" value={(editAmateurTeamData as any)[key]} onChange={(e) => setEditAmateurTeamData(prev => ({ ...prev, [key]: +e.target.value }))} className="h-8 text-xs bg-secondary border-border" />
                            </div>
                          ))}
                        </div>
                        <Button size="sm" onClick={() => handleSaveAmateurTeam(team.id)} className="font-body text-xs"><Save className="w-3 h-3 mr-1" /> Save</Button>
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
                {leagueTeamsAmateur.length === 0 && <p className="text-xs text-muted-foreground font-body">No amateur teams added yet</p>}
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
                      {isPaid ? <span className="text-green-600">✅</span> : <span className="text-muted-foreground">⬜</span>}
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
                    {members.filter((m) => m.id !== "SCF-001").map((m) => {
                      const memberMonths = getContribMonthsForMember(m.id);
                      return (
                        <tr key={m.id} className="border-b border-border">
                          <td className="py-2 text-foreground sticky left-0 bg-card font-medium whitespace-nowrap text-xs">{m.name}</td>
                          {contributionMonths.map((month) => {
                            if (!memberMonths.some(mm => mm.key === month.key)) {
                              return <td key={month.key} className="py-2 text-center text-muted-foreground">—</td>;
                            }
                            const status = m.contributions[month.key] || "unpaid";
                            return (
                              <td key={month.key} className="py-2 text-center">
                                <Checkbox checked={status === "paid"}
                                  onCheckedChange={(checked) => updateContributionDirect(m.id, month.key, checked ? "paid" : "unpaid")} />
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
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
                <Download className="w-3 h-3 mr-1" /> Export
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

        {/* Weekly Attendance — Manager + Ethan + Assistant Coach */}
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
                            const display = status === "present" ? "✅" : status === "excused" ? "🔵" : status === "no_activity" ? "➖" : "⬜";
                            const colors = status === "present" ? "bg-green-500/20 border-green-500/40"
                              : status === "excused" ? "bg-blue-500/20 border-blue-500/40"
                              : status === "no_activity" ? "bg-muted border-border"
                              : "bg-muted/30 border-border";
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
              <p className="text-xs text-muted-foreground font-body mt-2">Click to toggle: ✅ Present → 🔵 Excused → ⬜ Absent</p>
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
                {playerMembers.map((m) => <option key={m.id} value={m.id}>{m.name} ({getFullPositionName(m.position)})</option>)}
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
                        <span className="text-xs text-muted-foreground">({getFullPositionName(m.position)})</span>
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
                  <Download className="w-3 h-3 mr-1" /> Export Squad
                </Button>
                <span className="text-xs text-muted-foreground font-body self-center">{selectedFirst11.length}/11 starters, {selectedSubs.length} subs</span>
              </div>
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
                {playerMembers.filter(m => m.role === "player").map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              {removePlayerId && !showRemoveConfirm && (
                <Button variant="destructive" onClick={() => setShowRemoveConfirm(true)} className="w-full font-body"><Trash2 className="w-4 h-4 mr-1" /> Remove Player</Button>
              )}
              {showRemoveConfirm && (
                <div className="flex gap-2">
                  <Button variant="destructive" onClick={handleRemovePlayer} className="flex-1 font-body">Confirm Remove</Button>
                  <Button variant="outline" onClick={() => setShowRemoveConfirm(false)} className="flex-1 font-body">Cancel</Button>
                </div>
              )}
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
              <Button onClick={async () => {
                if (!seasonEndDate) return;
                await supabase.from("season_config").insert({ end_date: format(seasonEndDate, "yyyy-MM-dd"), created_by: user.id } as any);
                toast({ title: "Season End Date Set" });
              }} disabled={!seasonEndDate} className="w-full font-body"><Save className="w-4 h-4 mr-1" /> Save Season Config</Button>
            </CardContent>
          </Card>
        )}

        {/* ===== SEND MESSAGE (All officials) ===== */}
        <Card className="bg-card border-border card-glow">
          <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><MessageCircle className="w-5 h-5 text-primary" /> Send Message</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <select value={sendMsgTo} onChange={(e) => setSendMsgTo(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-secondary px-3 text-foreground font-body">
              <option value="">Select recipient</option>
              {members.filter(m => m.id !== user.id).map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
              ))}
            </select>
            <Textarea placeholder="Type your message..." value={sendMsgContent} onChange={(e) => setSendMsgContent(e.target.value)}
              className="bg-secondary border-border font-body" />
            <Button onClick={handleSendMsg} disabled={!sendMsgTo || !sendMsgContent.trim()} className="w-full font-body">
              <Send className="w-4 h-4 mr-1" /> Send Message
            </Button>
          </CardContent>
        </Card>

        {/* ===== MESSAGE INBOX ===== */}
        {myMessages.length > 0 && (
          <Card className="bg-card border-border card-glow">
            <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Mail className="w-5 h-5 text-primary" /> Message Inbox</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {myMessages.map(msg => {
                const sender = members.find(m => m.id === msg.fromId);
                return (
                  <div key={msg.id} className={`border rounded-lg p-3 ${msg.read ? "border-border" : "border-primary/40 bg-primary/5"}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-body text-sm font-medium text-foreground">{sender?.name || msg.fromId}</span>
                      <span className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm font-body text-muted-foreground">{msg.content}</p>
                    <div className="flex gap-2 mt-2">
                      {!msg.read && <Button size="sm" variant="ghost" className="text-xs" onClick={() => markMessageRead(msg.id)}>Mark Read</Button>}
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => setReplyTo(msg.fromId)}>
                        <Send className="w-3 h-3 mr-1" /> Reply
                      </Button>
                    </div>
                  </div>
                );
              })}
              {replyTo && (
                <div className="border border-primary/30 rounded-lg p-3 space-y-2">
                  <p className="text-xs text-primary font-body">Replying to {members.find(m => m.id === replyTo)?.name || replyTo}</p>
                  <Textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Type reply..." className="bg-secondary border-border font-body" />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleReply} className="font-body text-xs"><Send className="w-3 h-3 mr-1" /> Send</Button>
                    <Button size="sm" variant="outline" onClick={() => { setReplyTo(null); setReplyContent(""); }} className="font-body text-xs">Cancel</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default OfficialProfile;
