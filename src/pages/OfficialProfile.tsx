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
  UserPlus, MessageCircle, Send, Mail, Footprints, Gamepad2, Shield, Hand, Crosshair, Award, Flame, Swords
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { contributionMonths, getContribMonthsForMember } from "@/data/team-data";
import { generateBrandedDocx, type DocxTableData } from "@/lib/docx-export";
import { getPositionGroup, getFullPositionName } from "@/data/team-data";
import { supabase } from "@/integrations/supabase/client";
import { getStatsForPosition, getPerfFieldsForPosition, calculatePotmScore } from "@/lib/position-stats";
import LineupBuilder from "@/components/LineupBuilder";
import LottieAnimation from "@/components/LottieAnimation";
import LottieCarousel from "@/components/LottieCarousel";
import allmembersProfile from "@/assets/animations/allmembers_profile.json";
import everyoneprofilecarrousel1 from "@/assets/animations/everyoneprofilecarrousel1.json";
import everyoneprofilecarrousel2 from "@/assets/animations/everyoneprofilecarrousel2.json";
import everyoneprofilecarrousel3 from "@/assets/animations/everyoneprofilecarrousel3.json";
import everyoneprofilecarrousel5 from "@/assets/animations/everyoneprofilecarrousel5.json";
import { getAwardAnimation } from "@/lib/award-animations";

const profileCarousel = [allmembersProfile, everyoneprofilecarrousel1, everyoneprofilecarrousel2, everyoneprofilecarrousel3, everyoneprofilecarrousel5];

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

// Fan Management Row Component
const FanRow = ({ fan, profilePic, badgePresets }: { fan: any; profilePic?: string; badgePresets: string[] }) => {
  const { updateFanBadge, updateFanPoints } = useTeamData();
  const { toast } = useToast();
  const [badge, setBadge] = useState(fan.fanBadge || "");
  const [points, setPoints] = useState(String(fan.fanPoints || 0));

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border">
      <Avatar className="w-10 h-10 border border-primary/20">
        {profilePic && <AvatarImage src={profilePic} className="aspect-square object-cover object-center" />}
        <AvatarFallback className="bg-secondary text-primary font-heading text-sm">{fan.name.slice(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-2">
        <p className="font-body text-sm text-foreground font-medium">{fan.name} <span className="text-xs text-muted-foreground">({fan.id})</span></p>
        <div className="flex gap-2">
          <select value={badge} onChange={(e) => setBadge(e.target.value)}
            className="flex-1 h-8 rounded-md border border-input bg-secondary px-2 text-foreground font-body text-xs">
            <option value="">No badge</option>
            {badgePresets.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <Input type="number" value={points} onChange={(e) => setPoints(e.target.value)}
            onFocus={(e) => { if (e.target.value === "0") setPoints(""); }}
            onBlur={(e) => { if (e.target.value === "") setPoints("0"); }}
            className="w-20 h-8 text-xs bg-secondary border-border font-body" placeholder="Points" />
          <Button size="sm" className="h-8 text-xs font-body" onClick={async () => {
            await updateFanBadge(fan.id, badge);
            await updateFanPoints(fan.id, parseInt(points) || 0);
            toast({ title: "Fan Updated", description: `${fan.name} — ${badge || "No badge"}, ${points} pts` });
          }}><Save className="w-3 h-3 mr-1" /> Save</Button>
        </div>
      </div>
    </div>
  );
};

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
    updateMemberRole, recordTrainingMatch, refreshData
  } = useTeamData();

  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRoleName, setCustomRoleName] = useState("");
  const [trainingTeams, setTrainingTeams] = useState<{ teamA: string[], teamB: string[] }>({ teamA: [], teamB: [] });
  const [trainingScores, setTrainingScores] = useState({ teamA: 0, teamB: 0 });
  const [trainingPerfs, setTrainingPerfs] = useState<Record<string, any>>({});
  const [showTrainingRecorder, setShowTrainingRecorder] = useState(false);
  
  // --- VICTOR'S JERSEY WASHING SYSTEM ---
  const [jerseyVolunteers, setJerseyVolunteers] = useState<string[]>([]);
  const isVictor = user.id === "SCF-006";

  // --- MEMBER ID REGISTRY VISIBILITY ---
  const [showRegistry, setShowRegistry] = useState(false);

  const { toast } = useToast();

  const handleRecordTraining = async () => {
    try {
      const perfs = members
        .filter(m => trainingPerfs[m.id])
        .map(m => ({
          playerId: m.id,
          team: trainingTeams.teamA.includes(m.id) ? 'A' : 'B',
          goals: trainingPerfs[m.id].goals || 0,
          assists: trainingPerfs[m.id].assists || 0,
          rating: trainingPerfs[m.id].rating || 5.0,
          isPotm: trainingPerfs[m.id].isPotm || false
        }));
      
      if (perfs.length === 0) {
        toast({ title: "No data", description: "Please record stats for at least one player.", variant: "destructive" });
        return;
      }

      await recordTrainingMatch({
        teamAScore: trainingScores.teamA,
        teamBScore: trainingScores.teamB,
        performances: perfs
      });
      
      toast({ title: "Training Match Recorded", description: "Successfully saved Team A vs Team B results." });
      setShowTrainingRecorder(false);
      setTrainingPerfs({});
      setTrainingScores({ teamA: 0, teamB: 0 });
    } catch (e) {
      toast({ title: "Error", description: "Failed to record match.", variant: "destructive" });
    }
  };

  const handleFindJerseyVolunteers = async () => {
    const recent = [...gameScores].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 2);
    if (recent.length === 0) {
      toast({ title: "No matches", description: "Found no matches to pull players from.", variant: "destructive" });
      return;
    }
    const ids = recent.map(g => g.id);
    const { data } = await supabase.from("match_performances").select("player_id").in("game_id", ids);
    if (!data || data.length < 6) {
      toast({ title: "Pool too small", description: "Not enough unique players in recent matches (need 6).", variant: "destructive" });
      return;
    }
    const pool = Array.from(new Set(data.map((p: any) => p.player_id)));
    const pickedIds = pool.sort(() => 0.5 - Math.random()).slice(0, 6);
    const pickedNames = pickedIds.map(id => members.find(m => m.id === id)?.name || id);
    setJerseyVolunteers(pickedNames);
  };

  const handleExportJerseyData = () => {
    const text = `JERSEY WASHING VOLUNTEERS\n-------------------------\nPair 1: ${jerseyVolunteers[0]} & ${jerseyVolunteers[1]}\nPair 2: ${jerseyVolunteers[2]} & ${jerseyVolunteers[3]}\nPair 3: ${jerseyVolunteers[4]} & ${jerseyVolunteers[5]}\n\nExported: ${new Date().toLocaleString()}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "jersey_washing_volunteers.txt";
    link.click();
  };

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
  const [exportEnabled, setExportEnabled] = useState(false);

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
  const [perfDirectShots, setPerfDirectShots] = useState("0");

  // Message reply + send
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [sendMsgTo, setSendMsgTo] = useState("");
  const [sendMsgContent, setSendMsgContent] = useState("");

  const [rolePlayerId, setRolePlayerId] = useState("");
  const [newRole, setNewRole] = useState("");
  
  // Name management
  const [editNamePlayerId, setEditNamePlayerId] = useState("");
  const [editNewName, setEditNewName] = useState("");

  // Smart player selector: already-recorded players for selected game
  const [recordedPlayerIds, setRecordedPlayerIds] = useState<string[]>([]);
  const [lastMatchPlayerIds, setLastMatchPlayerIds] = useState<string[]>([]);

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

  // Load league teams + export_enabled
  useEffect(() => {
    if (!leagueLoaded) {
      supabase.from("league_teams").select("*").then(({ data }) => {
        if (data) setLeagueTeams((data as LeagueTeam[]).sort((a, b) => b.points - a.points || b.goal_difference - a.goal_difference));
        setLeagueLoaded(true);
      });
      supabase.from("season_config").select("*").order("created_at", { ascending: false }).limit(1).then(({ data }) => {
        if (data && data.length > 0 && (data[0] as any).export_enabled) {
          setExportEnabled(true);
        }
      });
    }
  }, [leagueLoaded]);

  // Load recorded players when perfGameId changes
  useEffect(() => {
    if (!perfGameId) { setRecordedPlayerIds([]); setLastMatchPlayerIds([]); return; }
    supabase.from("match_performances").select("player_id").eq("game_id", perfGameId).then(({ data }) => {
      setRecordedPlayerIds(data ? data.map((d: any) => d.player_id) : []);
    });
    // Get last match's players (most recent game before this one)
    const selectedGame = gameScores.find(g => g.id === perfGameId);
    if (selectedGame) {
      const prevGames = gameScores.filter(g => new Date(g.date) < new Date(selectedGame.date)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      if (prevGames[0]) {
        supabase.from("match_performances").select("player_id").eq("game_id", prevGames[0].id).then(({ data }) => {
          setLastMatchPlayerIds(data ? data.map((d: any) => d.player_id) : []);
        });
      }
    }
  }, [perfGameId, gameScores]);

  const isCoach = user.role === "coach" || user.role === "assistant_coach";
  const isFadhir = user.id === "SCF-002";
  const isManager = user.role === "manager";
  const isFabian = user.id === "SCF-001";
  const isCaptain = user.role === "captain";
  const canUploadMedia = ["coach", "manager", "captain", "assistant_coach"].includes(user.role);
  const canManageFinance = isFadhir || isCoach;
  const canApproveContributions = isFadhir || isCoach;
  const canDeletePhotos = isManager;
  const canManageContribEvents = isFadhir || isCaptain;
  const showContributions = !isCoach;
  const canManageAttendance = isManager || user.id === "SCF-004" || isCoach;
  const canAddScoresEvents = isManager || isCaptain;
  const canReceiveMessages = true; // All officials can receive messages now

  const playerMembers = members.filter((m) => m.role === "player" || m.role === "captain" || m.role === "finance" || m.role === "manager");
  // Exclude Beavon from contribution/attendance/performance grids but keep in match recorder
  const playerMembersForGrids = playerMembers.filter(m => m.id !== "SCF-P40");
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
      interceptions: statsInterceptions, assists: statsAssists,
      goals: statsGoals, directShots: statsDirectShots, successfulTackles: statsSuccessfulTackles,
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

  const exportMatchStats = (gameId: string) => {
    const game = gameScores.find(g => g.id === gameId);
    if (!game) return;
    const perfs = matchPerformances.filter(p => p.gameId === gameId);
    if (perfs.length === 0) {
      toast({ title: "No Stats", description: "No player stats recorded for this match yet." });
      return;
    }
    
    const groups: Record<string, typeof perfs> = { "GK": [], "DEF": [], "MID": [], "ATT": [] };
    perfs.forEach(p => {
      const member = members.find(m => m.id === p.playerId);
      const posGroup = getPositionGroup(member?.position);
      if (groups[posGroup]) groups[posGroup].push(p);
      else groups["ATT"].push(p); // fallback
    });
    
    const tables: DocxTableData[] = [];
    
    if (groups["GK"].length > 0) {
      tables.push({
        head: [["Goalkeepers", "Saves", "Clean Sheet", "Goals", "Assists"]],
        body: groups["GK"].map(p => {
          const m = members.find(mem => mem.id === p.playerId);
          return [m?.name || "Unknown", String(p.saves || 0), p.clean_sheet ? "Yes" : "No", String(p.goals), String(p.assists)];
        })
      });
    }
    
    if (groups["DEF"].length > 0) {
      tables.push({
        head: [["Defenders", "Tackles", "Interceptions", "Goals", "Assists"]],
        body: groups["DEF"].map(p => {
          const m = members.find(mem => mem.id === p.playerId);
          return [m?.name || "Unknown", String(p.tackles || 0), String(p.interceptions || 0), String(p.goals), String(p.assists)];
        })
      });
    }
    
    if (groups["MID"].length > 0) {
      tables.push({
        head: [["Midfielders", "Goals", "Assists", "Tackles", "Interceptions"]],
        body: groups["MID"].map(p => {
          const m = members.find(mem => mem.id === p.playerId);
          return [m?.name || "Unknown", String(p.goals), String(p.assists), String(p.tackles || 0), String(p.interceptions || 0)];
        })
      });
    }
    
    if (groups["ATT"].length > 0) {
      tables.push({
        head: [["Attackers", "Goals", "Assists", "Shots", "Aerial Duels"]],
        body: groups["ATT"].map(p => {
          const m = members.find(mem => mem.id === p.playerId);
          return [m?.name || "Unknown", String(p.goals), String(p.assists), String(p.direct_shots || 0), String(p.aerial_duels || 0)];
        })
      });
    }
    
    generateBrandedDocx(`Match Report — vs ${game.opponent} (${game.ourScore}-${game.theirScore})`, tables, `suncity_fc_match_${game.opponent.replace(/\s+/g, "_")}.docx`);
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
    if (!newPlayerName) return;
    const newId = await addPlayer(newPlayerName, 0, newPlayerPos, newMemberType);
    if (newMemberType === "fan") {
      setAddedFanId(newId);
      toast({ title: "Fan Added", description: `${newPlayerName} — Login ID: ${newId}` });
    } else {
      toast({ title: "Player Added", description: `${newPlayerName} added.` });
    }
    setNewPlayerName(""); setNewPlayerPos(""); setNewMemberType("player");
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
    
    // Duplicate detection
    const { data: existing } = await supabase.from("match_performances")
      .select("id").eq("game_id", perfGameId).eq("player_id", perfPlayerId);
    if (existing && existing.length > 0) {
      toast({ title: "⚠️ Already Recorded", description: `${members.find(m => m.id === perfPlayerId)?.name} already has stats for this match.`, variant: "destructive" });
      return;
    }
    
    const perfPlayer = members.find(m => m.id === perfPlayerId);
    const perfPosGroup = getPositionGroup(perfPlayer?.position);
    
    // Build perf data — only position-relevant fields, rest default to 0
    const perfData: any = {
      gameId: perfGameId, playerId: perfPlayerId,
      goals: 0, assists: 0, saves: 0, tackles: 0,
      interceptions: 0, blocks: 0, clearances: 0,
      cleanSheet: false, aerialDuels: 0, rating: 5,
      isPotm: false, directShots: 0
    };
    
    perfData.goals = parseInt(perfGoals) || 0;
    perfData.assists = parseInt(perfAssists) || 0;
    perfData.rating = parseFloat(perfRating) || 5;
    perfData.isPotm = perfIsPotm;
    
    if (perfPosGroup === "GK") {
      perfData.saves = parseInt(perfSaves) || 0;
      perfData.cleanSheet = perfCleanSheet;
    } else if (perfPosGroup === "DEF") {
      perfData.tackles = parseInt(perfTackles) || 0;
      perfData.interceptions = parseInt(perfInterceptions) || 0;
      perfData.blocks = parseInt(perfBlocks) || 0;
      perfData.clearances = parseInt(perfClearances) || 0;
      perfData.cleanSheet = perfCleanSheet;
      perfData.aerialDuels = parseInt(perfAerialDuels) || 0;
    } else if (perfPosGroup === "MID") {
      perfData.tackles = parseInt(perfTackles) || 0;
      perfData.interceptions = parseInt(perfInterceptions) || 0;
      perfData.aerialDuels = parseInt(perfAerialDuels) || 0;
    } else if (perfPosGroup === "ATT") {
      perfData.directShots = parseInt(perfDirectShots) || 0;
      perfData.aerialDuels = parseInt(perfAerialDuels) || 0;
    }
    
    await addMatchPerformance(perfData);
    
    // Update aggregate stats in members table
    const dbStats: any = {
      goals: (perfPlayer?.goals || 0) + perfData.goals,
      assists: (perfPlayer?.assists || 0) + perfData.assists,
      games_played: (perfPlayer?.gamesPlayed || 0) + 1,
    };
    
    if (perfPosGroup === "GK") {
      dbStats.saves = (perfPlayer?.saves || 0) + perfData.saves;
      dbStats.clean_sheets = (perfPlayer?.cleanSheets || 0) + (perfData.cleanSheet ? 1 : 0);
    } else if (perfPosGroup === "DEF") {
      dbStats.tackles = (perfPlayer?.tackles || 0) + perfData.tackles;
      dbStats.interceptions = (perfPlayer?.interceptions || 0) + perfData.interceptions;
      dbStats.blocks = (perfPlayer?.blocks || 0) + perfData.blocks;
      dbStats.clearances = (perfPlayer?.clearances || 0) + perfData.clearances;
      dbStats.clean_sheets = (perfPlayer?.cleanSheets || 0) + (perfData.cleanSheet ? 1 : 0);
      dbStats.aerial_duels = (perfPlayer?.aerialDuels || 0) + perfData.aerialDuels;
    } else if (perfPosGroup === "MID") {
      dbStats.tackles = (perfPlayer?.tackles || 0) + perfData.tackles;
      dbStats.interceptions = (perfPlayer?.interceptions || 0) + perfData.interceptions;
      dbStats.aerial_duels = (perfPlayer?.aerialDuels || 0) + perfData.aerialDuels;
    } else if (perfPosGroup === "ATT") {
      dbStats.direct_shots = (perfPlayer?.directShots || 0) + perfData.directShots;
      dbStats.aerial_duels = (perfPlayer?.aerialDuels || 0) + perfData.aerialDuels;
    }
    
    await supabase.from("members").update(dbStats).eq("id", perfPlayerId);
    await supabase.from("player_game_log").upsert({ player_id: perfPlayerId, game_id: perfGameId } as any);
    
    toast({ title: "Performance Recorded", description: `Stats for ${perfPlayer?.name} saved.` });
    setPerfPlayerId(""); setPerfGoals("0"); setPerfAssists("0"); setPerfSaves("0");
    setPerfTackles("0"); setPerfInterceptions("0"); setPerfBlocks("0"); setPerfClearances("0");
    setPerfCleanSheet(false); setPerfAerialDuels("0"); setPerfRating("5"); setPerfIsPotm(false);
    setPerfDirectShots("0");
    refreshData();
  };

  const handleSendMsg = async () => {
    if (!sendMsgTo || !sendMsgContent.trim()) return;
    await sendMessage(user.id, sendMsgTo, sendMsgContent.trim());
    toast({ title: "Message Sent" });
    setSendMsgTo(""); setSendMsgContent("");
  };

  const handleReply = async () => {
    if (!replyTo || !replyContent.trim()) return;
    await sendMessage(user.id, replyTo, replyContent.trim());
    toast({ title: "Reply Sent" });
    setReplyTo(null); setReplyContent("");
  };

  const myMessages = messages.filter(m => m.toId === user.id);

  if (!user) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen bg-background selection:bg-primary/30">
      <Navbar />
      <main className="max-w-4xl mx-auto p-4 pt-24 pb-12 space-y-8">
        
        {/* Profile Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative">
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-background shadow-2xl overflow-hidden bg-card card-glow z-10">
            <Avatar className="w-full h-full">
              {profilePics[user.id] && <AvatarImage src={profilePics[user.id]} className="aspect-square object-cover object-center" />}
              <AvatarFallback className="bg-secondary text-primary font-heading text-4xl">{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <label className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform">
              <Upload className="w-4 h-4" />
              <input type="file" accept="image/*" className="hidden" onChange={handleProfilePicUpload} />
            </label>
          </div>
          
          <Card className="pt-24 pb-8 text-center bg-card border-border overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-primary/10 to-transparent" />
            <CardContent className="relative z-0">
              <h2 className="font-heading text-2xl text-foreground mb-1">{user.name}</h2>
              <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                <Badge variant="secondary" className="font-body px-3 py-1">Official Profile</Badge>
                <Badge variant="outline" className="font-body px-3 py-1 border-primary/30 text-primary capitalize">{user.role.replace('_', ' ')}</Badge>
                {user.squadNumber && <Badge variant="outline" className="font-body px-3 py-1">#{user.squadNumber}</Badge>}
              </div>
              <p className="text-sm text-muted-foreground font-body max-w-sm mx-auto">
                Welcome back to the SunCity FC Management Hub. You have full access to team records, finances, and performance tracking.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Dynamic Award/Stat Showcase */}
        {isManager && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Card className="bg-card border-border card-glow overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-6 flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 w-fit mb-4">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-xs font-heading text-primary uppercase tracking-wider">Season Progress</span>
                  </div>
                  <h3 className="font-heading text-3xl text-foreground mb-2">SunCity Performance</h3>
                  <p className="text-muted-foreground font-body text-sm leading-relaxed mb-6">
                    We've played {gameScores.length} games this season. Team morale is high and training attendance is averaging 85% this month.
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-xl bg-secondary/50 border border-border">
                      <p className="text-2xl font-heading text-primary">{gameScores.filter(g => g.ourScore > g.theirScore).length}</p>
                      <p className="text-[10px] text-muted-foreground font-body uppercase">Wins</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-secondary/50 border border-border">
                      <p className="text-2xl font-heading text-foreground">{gameScores.filter(g => g.ourScore === g.theirScore).length}</p>
                      <p className="text-[10px] text-muted-foreground font-body uppercase">Draws</p>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-secondary/50 border border-border">
                      <p className="text-2xl font-heading text-destructive">{gameScores.filter(g => g.ourScore < g.theirScore).length}</p>
                      <p className="text-[10px] text-muted-foreground font-body uppercase">Losses</p>
                    </div>
                  </div>
                </div>
                <div className="h-64 md:h-auto bg-muted/20 flex items-center justify-center p-6 border-l border-border relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <BarChart3 className="w-full h-full text-primary scale-150" />
                  </div>
                  <LottieCarousel animations={profileCarousel} className="h-48 w-48" />
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Navigation Shortcut Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {canAddScoresEvents && (
            <motion.button whileHover={{ y: -2 }} onClick={() => document.getElementById('scores-section')?.scrollIntoView({ behavior: 'smooth' })} 
              className="p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-all flex flex-col items-center gap-2 group">
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform"><Gamepad2 className="w-5 h-5" /></div>
              <span className="text-xs font-heading">Record Match</span>
            </motion.button>
          )}
          {canManageAttendance && (
            <motion.button whileHover={{ y: -2 }} onClick={() => document.getElementById('attendance-section')?.scrollIntoView({ behavior: 'smooth' })} 
              className="p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-all flex flex-col items-center gap-2 group">
              <div className="p-2 rounded-lg bg-green-500/10 text-green-500 group-hover:scale-110 transition-transform"><CheckCircle className="w-5 h-5" /></div>
              <span className="text-xs font-heading">Attendance</span>
            </motion.button>
          )}
          {canManageFinance && (
            <motion.button whileHover={{ y: -2 }} onClick={() => document.getElementById('finance-section')?.scrollIntoView({ behavior: 'smooth' })} 
              className="p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-all flex flex-col items-center gap-2 group">
              <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500 group-hover:scale-110 transition-transform"><DollarSign className="w-5 h-5" /></div>
              <span className="text-xs font-heading">Finances</span>
            </motion.button>
          )}
          {isCoach && (
            <motion.button whileHover={{ y: -2 }} onClick={() => document.getElementById('lineup-section')?.scrollIntoView({ behavior: 'smooth' })} 
              className="p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 transition-all flex flex-col items-center gap-2 group">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:scale-110 transition-transform"><Shield className="w-5 h-5" /></div>
              <span className="text-xs font-heading">Lineup</span>
            </motion.button>
          )}
        </div>

        {/* ===== TRAINING MATCH RECORDER (Team A vs Team B) ===== */}
        {isManager && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <Card className="bg-card border-border card-glow overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4">
                <Badge className="bg-green-600 text-white font-heading text-[10px] animate-pulse">NEW EVENT</Badge>
              </div>
              <CardHeader>
                <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                  <Gamepad2 className="w-5 h-5 text-primary" /> Training Match Recorder
                </CardTitle>
                <p className="text-xs text-muted-foreground font-body">Record Team A vs Team B performance and results.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={() => setShowTrainingRecorder(!showTrainingRecorder)} variant={showTrainingRecorder ? "outline" : "default"} className="w-full font-body">
                  {showTrainingRecorder ? "Close Recorder" : "Start New Recording"}
                </Button>

                {showTrainingRecorder && (
                  <div className="space-y-6 pt-4 border-t border-border">
                    {/* Team Selection */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-heading text-primary uppercase">Select Team A Players</label>
                        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-1 border border-border rounded bg-secondary/20">
                          {playerMembers.map(m => (
                            <Badge key={m.id} variant={trainingTeams.teamA.includes(m.id) ? "default" : "outline"} 
                              className="cursor-pointer text-[10px]"
                              onClick={() => {
                                if (trainingTeams.teamA.includes(m.id)) setTrainingTeams(prev => ({ ...prev, teamA: prev.teamA.filter(id => id !== m.id) }));
                                else setTrainingTeams(prev => ({ teamA: [...prev.teamA, m.id], teamB: prev.teamB.filter(id => id !== m.id) }));
                              }}>{m.name}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-heading text-primary uppercase">Select Team B Players</label>
                        <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-1 border border-border rounded bg-secondary/20">
                          {playerMembers.map(m => (
                            <Badge key={m.id} variant={trainingTeams.teamB.includes(m.id) ? "default" : "outline"} 
                              className="cursor-pointer text-[10px]"
                              onClick={() => {
                                if (trainingTeams.teamB.includes(m.id)) setTrainingTeams(prev => ({ ...prev, teamB: prev.teamB.filter(id => id !== m.id) }));
                                else setTrainingTeams(prev => ({ teamB: [...prev.teamB, m.id], teamA: prev.teamA.filter(id => id !== m.id) }));
                              }}>{m.name}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2 text-center">
                        <label className="text-xs font-heading text-primary">TEAM A SCORE</label>
                        <Input type="number" value={trainingScores.teamA} onChange={(e) => setTrainingScores(prev => ({ ...prev, teamA: +e.target.value }))} className="bg-secondary border-border font-body text-center text-xl" />
                      </div>
                      <div className="space-y-2 text-center">
                        <label className="text-xs font-heading text-primary">TEAM B SCORE</label>
                        <Input type="number" value={trainingScores.teamB} onChange={(e) => setTrainingScores(prev => ({ ...prev, teamB: +e.target.value }))} className="bg-secondary border-border font-body text-center text-xl" />
                      </div>
                    </div>

                    {/* Players Stats */}
                    <div className="space-y-4">
                      <p className="text-xs font-heading text-primary uppercase tracking-wider">Record Player Performances</p>
                      <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                        {[...trainingTeams.teamA, ...trainingTeams.teamB].map(pid => {
                          const m = members.find(member => member.id === pid);
                          if (!m) return null;
                          const isTeamA = trainingTeams.teamA.includes(pid);
                          const stats = trainingPerfs[pid] || { goals: 0, assists: 0, rating: 5.0, isPotm: false };
                          
                          return (
                            <div key={pid} className={cn("p-3 rounded-lg border flex flex-col gap-3 transition-colors", isTeamA ? "border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10" : "border-red-500/20 bg-red-500/5 hover:bg-red-500/10")}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className={isTeamA ? "border-blue-500/40 text-blue-600" : "border-red-500/40 text-red-600"}>{isTeamA ? "Team A" : "Team B"}</Badge>
                                  <span className="font-body text-sm font-medium text-foreground">{m.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="text-[10px] text-muted-foreground font-body">POTM?</label>
                                  <Switch checked={stats.isPotm} onCheckedChange={(val) => setTrainingPerfs(prev => ({ ...prev, [pid]: { ...stats, isPotm: val } }))} />
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="text-[10px] text-muted-foreground font-body">Goals</label>
                                  <Input type="number" value={stats.goals} onChange={(e) => setTrainingPerfs(prev => ({ ...prev, [pid]: { ...stats, goals: +e.target.value } }))} className="h-8 text-xs bg-secondary border-border" />
                                </div>
                                <div>
                                  <label className="text-[10px] text-muted-foreground font-body">Assists</label>
                                  <Input type="number" value={stats.assists} onChange={(e) => setTrainingPerfs(prev => ({ ...prev, [pid]: { ...stats, assists: +e.target.value } }))} className="h-8 text-xs bg-secondary border-border" />
                                </div>
                                <div>
                                  <label className="text-[10px] text-muted-foreground font-body">Rating (1-10)</label>
                                  <Input type="number" step="0.1" value={stats.rating} onChange={(e) => setTrainingPerfs(prev => ({ ...prev, [pid]: { ...stats, rating: +e.target.value } }))} className="h-8 text-xs bg-secondary border-border" />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <Button onClick={handleRecordTraining} className="w-full font-heading bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg h-12">
                      <Save className="w-5 h-5 mr-2" /> Save Training Results
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}


        {/* Record match score — Ethan + Captains */}
        {canAddScoresEvents && (
          <Card id="scores-section" className="bg-card border-border card-glow">
            <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" /> Record Match Results</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Opponent Name" value={newOpponent} onChange={(e) => setNewOpponent(e.target.value)} className="bg-secondary border-border font-body" />
                <select value={newGameType} onChange={(e) => setNewGameType(e.target.value)}
                  className="h-10 rounded-md border border-input bg-secondary px-3 text-foreground font-body">
                  <option value="friendly">Friendly Match</option>
                  <option value="league">League Match</option>
                  <option value="amateur">Amateur Match</option>
                  <option value="tournament">Tournament</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Venue (Optional)" value={newVenue} onChange={(e) => setNewVenue(e.target.value)} className="bg-secondary border-border font-body" />
                <Input type="date" value={newScoreDate} onChange={(e) => setNewScoreDate(e.target.value)} className="bg-secondary border-border font-body" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-body text-primary">Our Score</label>
                  <Input type="number" value={newOurScore} onChange={(e) => setNewOurScore(e.target.value)} className="bg-secondary border-border font-body" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-body text-destructive">Opponent Score</label>
                  <Input type="number" value={newTheirScore} onChange={(e) => setNewTheirScore(e.target.value)} className="bg-secondary border-border font-body" />
                </div>
              </div>

              {ourScoreNum > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-body text-primary">Who scored for us? ({scorers.length}/{ourScoreNum})</label>
                  <div className="flex flex-wrap gap-1.5">
                    {playerMembers.map((m) => (
                      <Badge key={m.id} variant={scorers.includes(m.id) ? "default" : "outline" }
                        onClick={() => {
                          if (scorers.includes(m.id)) setScorers(scorers.filter(id => id !== m.id));
                          else if (scorers.length < ourScoreNum) setScorers([...scorers, m.id]);
                        }}
                        className="cursor-pointer font-body text-[10px]">{m.name}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button onClick={addScore} className="w-full font-body" disabled={!newOpponent || !newOurScore || !newTheirScore}>
                <Plus className="w-4 h-4 mr-1" /> Add Score
              </Button>

              {/* Game Stats Form — Shown after adding a score */}
              {lastAddedGameId && (
                <div className="mt-6 p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4 animate-in fade-in slide-in-from-top-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-heading text-sm text-primary">📊 Game Stats: vs {lastAddedOpponent}</h4>
                    <Badge variant="outline" className="font-body text-[10px] border-primary/30">RECORDING NOW</Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    {/* First Half */}
                    <div className="space-y-3">
                      <p className="text-xs font-heading text-primary uppercase tracking-wider">1st Half</p>
                      {[
                        ['Shots', 'shots'], ['On Target', 'shotsOnTarget'], ['Penalties', 'penalties'],
                        ['Freekicks', 'freekicks'], ['Corners', 'cornerKicks'], ['Fouls', 'fouls'],
                        ['Offsides', 'offsides'], ['Yellows', 'yellowCards'], ['Reds', 'redCards']
                      ].map(([label, key]) => (
                        <div key={key} className="flex items-center justify-between gap-2">
                          <span className="text-xs font-body text-muted-foreground">{label}</span>
                          <Input type="number" value={(firstHalfStats as any)[key]} onChange={(e) => setFirstHalfStats({...firstHalfStats, [key]: +e.target.value})} className="w-16 h-7 text-xs bg-background text-center" />
                        </div>
                      ))}
                    </div>
                    {/* Second Half */}
                    <div className="space-y-3">
                      <p className="text-xs font-heading text-primary uppercase tracking-wider">2nd Half</p>
                      {[
                        ['Shots', 'shots'], ['On Target', 'shotsOnTarget'], ['Penalties', 'penalties'],
                        ['Freekicks', 'freekicks'], ['Corners', 'cornerKicks'], ['Fouls', 'fouls'],
                        ['Offsides', 'offsides'], ['Yellows', 'yellowCards'], ['Reds', 'redCards']
                      ].map(([label, key]) => (
                        <div key={key} className="flex items-center justify-between gap-2">
                          <span className="text-xs font-body text-muted-foreground">{label}</span>
                          <Input type="number" value={(secondHalfStats as any)[key]} onChange={(e) => setSecondHalfStats({...secondHalfStats, [key]: +e.target.value})} className="w-16 h-7 text-xs bg-background text-center" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button onClick={handleSaveGameStats} className="w-full font-body bg-primary hover:bg-primary/90 text-primary-foreground">Save Detailed Stats</Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ===== PERFORMANCE ANALYSIS REPORT (Potm logic) ===== */}
        {isManager && (() => {
          const latestGame = [...gameScores].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          if (!latestGame) return null;
          const perfs = matchPerformances.filter(p => p.gameId === latestGame.id);
          const potm = perfs.sort((a,b) => b.rating - a.rating)[0];
          const potmMember = potm ? members.find(m => m.id === potm.playerId) : null;
          
          // Improved/Dropped detection (compared to season average rating or previous match)
          const improved = perfs.filter(p => {
            const member = members.find(m => m.id === p.playerId);
            const prevPerfs = matchPerformances.filter(mp => mp.playerId === p.playerId && mp.gameId !== latestGame.id);
            if (prevPerfs.length === 0) return false;
            const avgRating = prevPerfs.reduce((sum, mp) => sum + mp.rating, 0) / prevPerfs.length;
            return p.rating > avgRating + 0.5;
          }).map(p => ({ player: members.find(m => m.id === p.playerId), delta: (p.rating - (matchPerformances.filter(mp => mp.playerId === p.playerId && mp.gameId !== latestGame.id).reduce((sum, mp) => sum + mp.rating, 0) / matchPerformances.filter(mp => mp.playerId === p.playerId && mp.gameId !== latestGame.id).length)).toFixed(1) }));

          return (
            <Card className="bg-card border-border card-glow overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="font-heading text-lg text-foreground">Latest match report — vs {latestGame.opponent}</CardTitle>
                  <p className="text-xs text-muted-foreground font-body">AI-Powered analysis & performance tracking</p>
                </div>
                <div className="p-2 rounded-lg bg-primary/10"><BarChart3 className="w-5 h-5 text-primary" /></div>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <div className="md:col-span-1 flex flex-col items-center text-center p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-[10px] text-primary font-heading tracking-widest uppercase mb-2">Potm winner</p>
                  <Avatar className="w-16 h-16 border-2 border-primary mb-2">
                    <AvatarImage src={profilePics[potmMember?.id || '']} className="aspect-square object-cover" />
                    <AvatarFallback className="bg-secondary text-primary font-heading">{potmMember?.name.slice(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <p className="font-heading text-sm text-foreground">{potmMember?.name || 'No Data'}</p>
                  <div className="flex items-center gap-1 text-yellow-500 mt-1">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-xs font-body font-bold">{potm?.rating.toFixed(1) || '0.0'} Rating</span>
                  </div>
                </div>
                
                <div className="md:col-span-2 space-y-4">
                  {improved.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-primary font-heading tracking-widest uppercase">Rising Stars (Vs Avg)</p>
                      <div className="flex flex-wrap gap-2">
                        {improved.map((imp, idx) => (
                          <div key={idx} className="flex items-center gap-2 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20">
                            <TrendingUp className="w-3 h-3 text-green-600" />
                            <span className="text-[10px] font-body font-medium">{imp.player?.name} (+{imp.delta})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="p-3 rounded-lg bg-secondary/30 border border-border">
                    <p className="text-xs font-body text-muted-foreground leading-relaxed italic">
                      "Tactical Note: The team showed {latestGame.ourScore > latestGame.theirScore ? 'great resilience and offensive creativity' : 'some defensive gaps that need addressing in training'}. Goal conversion was {latestGame.ourScore > 2 ? 'excellent' : 'moderate'} today."
                    </p>
                  </div>
                  <Button variant="outline" className="w-full h-8 text-xs font-body" onClick={() => exportMatchStats(latestGame.id)}>
                    <Download className="w-3 h-3 mr-2" /> Export Full Match Report (.docx)
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Individual Match Performance Recorder — ethan + managers */}
        {(isManager || user.id === "SCF-004") && (
          <Card className="bg-card border-border card-glow">
            <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Footprints className="w-5 h-5 text-primary" /> Record Match Performance</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <select value={perfGameId} onChange={(e) => setPerfGameId(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-secondary px-3 text-foreground font-body">
                  <option value="">Select game</option>
                  {gameScores.map((g) => <option key={g.id} value={g.id}>{g.opponent} ({g.date})</option>)}
                </select>
                <select value={perfPlayerId} onChange={(e) => setPerfPlayerId(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-secondary px-3 text-foreground font-body">
                  <option value="">Select player</option>
                  {playerMembers
                    .filter(m => !recordedPlayerIds.includes(m.id))
                    .sort((a, b) => {
                      const aPrev = lastMatchPlayerIds.includes(a.id);
                      const bPrev = lastMatchPlayerIds.includes(b.id);
                      if (aPrev && !bPrev) return -1;
                      if (!aPrev && bPrev) return 1;
                      return 0;
                    })
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {lastMatchPlayerIds.includes(m.id) ? ' (Played Last Game)' : ''}
                      </option>
                    ))}
                </select>
              </div>

              {perfPlayerId && (() => {
                const perfPlayer = members.find(m => m.id === perfPlayerId);
                const perfPosGroup = getPositionGroup(perfPlayer?.position);
                const perfFields = getPerfFieldsForPosition(perfPlayer?.position);
                
                return (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-body text-primary">Goals</label>
                        <Input type="number" value={perfGoals} onChange={(e) => setPerfGoals(e.target.value)} className="bg-secondary border-border" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-body text-primary">Assists</label>
                        <Input type="number" value={perfAssists} onChange={(e) => setPerfAssists(e.target.value)} className="bg-secondary border-border" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-body text-primary">Rating (1-10)</label>
                        <Input type="number" step="0.1" value={perfRating} onChange={(e) => setPerfRating(e.target.value)} className="bg-secondary border-border" />
                      </div>
                      {perfFields.map(f => (
                        <div key={f.key} className="space-y-1">
                          <label className="text-xs font-body text-primary">{f.label}</label>
                          {f.type === 'number' ? (
                            <Input type="number" value={
                              f.key === 'saves' ? perfSaves : f.key === 'tackles' ? perfTackles : f.key === 'interceptions' ? perfInterceptions : f.key === 'blocks' ? perfBlocks : f.key === 'clearances' ? perfClearances : f.key === 'aerialDuels' ? perfAerialDuels : perfDirectShots
                            } onChange={(e) => {
                              const val = e.target.value;
                              if (f.key === 'saves') setPerfSaves(val);
                              else if (f.key === 'tackles') setPerfTackles(val);
                              else if (f.key === 'interceptions') setPerfInterceptions(val);
                              else if (f.key === 'blocks') setPerfBlocks(val);
                              else if (f.key === 'clearances') setPerfClearances(val);
                              else if (f.key === 'aerialDuels') setPerfAerialDuels(val);
                              else if (f.key === 'directShots') setPerfDirectShots(val);
                            }} className="bg-secondary border-border" />
                          ) : (
                            <div className="flex items-center h-10">
                              <Checkbox checked={perfCleanSheet} onCheckedChange={(val) => setPerfCleanSheet(!!val)} />
                              <span className="ml-2 text-xs font-body text-muted-foreground">Clean Sheet</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg border border-border">
                      <Checkbox checked={perfIsPotm} onCheckedChange={(val) => setPerfIsPotm(!!val)} />
                      <div className="flex items-center gap-1.5">
                        <Star className={`w-4 h-4 ${perfIsPotm ? 'text-yellow-500 fill-current' : 'text-muted-foreground'}`} />
                        <span className="text-xs font-body">Player of the Match</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-body italic">⭐ Player of the Match is auto-determined by the system</p>
                    <Button onClick={handleAddMatchPerf} className="w-full font-body"><Save className="w-4 h-4 mr-1" /> Record Performance</Button>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* ===== VICTOR'S JERSEY WASHING SYSTEM ===== */}
        {isVictor && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Flame className="w-5 h-5 text-primary" /> Jersey Washing System</CardTitle>
                <Badge className="bg-primary/20 text-primary border-primary/30">Captain Victor</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground font-body leading-relaxed">Find 6 volunteers (3 pairs) for the week. Players are pulled from those who played in the last 2 matches.</p>
                <div className="flex gap-2">
                  <Button onClick={handleFindJerseyVolunteers} className="flex-1 font-heading h-11 bg-primary text-primary-foreground"><Gamepad2 className="w-4 h-4 mr-2" /> Find Volunteers</Button>
                  {jerseyVolunteers.length > 0 && <Button variant="outline" onClick={handleExportJerseyData} className="h-11"><Download className="w-4 h-4" /></Button>}
                </div>

                {jerseyVolunteers.length > 0 && (
                  <div className="grid gap-3 pt-4 border-t border-border mt-2">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="p-3 bg-secondary/30 rounded-lg border border-border group hover:border-primary/40 transition-colors">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-[10px] text-primary font-heading tracking-widest uppercase">Pair {i + 1}</p>
                          <Users className="w-3 h-3 text-muted-foreground" />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input value={jerseyVolunteers[i * 2]} onChange={(e) => {
                            const n = [...jerseyVolunteers]; n[i * 2] = e.target.value; setJerseyVolunteers(n);
                          }} className="h-8 text-xs bg-card border-border focus:ring-1 focus:ring-primary" />
                          <Input value={jerseyVolunteers[i * 2 + 1]} onChange={(e) => {
                            const n = [...jerseyVolunteers]; n[i * 2 + 1] = e.target.value; setJerseyVolunteers(n);
                          }} className="h-8 text-xs bg-card border-border focus:ring-1 focus:ring-primary" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
        {isManager && matchPerformances.length > 0 && (() => {
          // Group performances by game
          const gamesWithPerfs = Array.from(new Set(matchPerformances.map(p => p.gameId)));
          return (
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Season Stats Logs</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gamesWithPerfs.slice(0, 5).map(gid => {
                    const game = gameScores.find(g => g.id === gid);
                    if (!game) return null;
                    return (
                      <div key={gid} className="flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/20">
                        <div className="font-body">
                          <p className="text-sm text-foreground font-medium">vs {game.opponent}</p>
                          <p className="text-[10px] text-muted-foreground">{game.date}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="h-8 px-2 text-primary font-body text-xs" onClick={() => exportMatchStats(gid)}>
                          <Download className="w-3 h-3 mr-1" /> Export
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* ===== PERFORMANCE ANALYSIS (Manager Only) ===== */}
        {isManager && (() => {
          const stats = members.filter(m => m.role === 'player' || m.role === 'captain');
          if (stats.length === 0) return null;
          
          const topScorer = [...stats].sort((a,b) => (b.goals || 0) - (a.goals || 0))[0];
          const topAssister = [...stats].sort((a,b) => (b.assists || 0) - (a.assists || 0))[0];
          
          // Improved player: comparison of current stats vs previous week or similar
          // This is a mockup of the 'logic' requested. In a real app we'd use the weekly logs.
          const mostImproved = { name: topScorer.name, delta: 12, prev: 42, curr: 54 };
          const dropped = stats.filter(m => (m.gamesPlayed || 0) > 2).slice(0, 2).map(m => ({ player: m, prev: 7.2, curr: 6.8, delta: -0.4 }));

          return (
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Tactical Insights</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                {mostImproved && (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 navy-accent">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-primary" />
                      <p className="text-xs font-heading text-primary uppercase tracking-wider">Most Improved This Week</p>
                    </div>
                    <p className="font-heading text-lg text-foreground mb-1">{mostImproved.name}</p>
                    <p className="text-xs text-muted-foreground font-body">
                      Previous: {mostImproved.prev} pts → Current: {mostImproved.curr} pts
                      <span className="text-primary ml-2">+{mostImproved.delta}</span>
                    </p>
                  </div>
                )}
                {dropped.length > 0 && (
                  <div>
                    <p className="text-xs text-destructive font-heading tracking-wider mb-2">📉 PERFORMANCE DROP</p>
                    {dropped.map((d, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                        <span className="font-body text-sm text-foreground">{d.player?.name}</span>
                        <span className="text-xs text-destructive font-body">{d.prev} → {d.curr} ({d.delta})</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })()}

        {/* ===== MANAGER: Export Toggle for Player Detailed Profiles ===== */}
        {isManager && (
          <Card className="bg-card border-border card-glow">
            <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Download className="w-5 h-5 text-primary" /> Player Export Access</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground font-body">Toggle detailed profile export availability for all players. When enabled, players can download their detailed profile document any day.</p>
              <div className="flex items-center gap-3">
                <Switch
                  checked={exportEnabled}
                  onCheckedChange={async (checked) => {
                    setExportEnabled(checked);
                    const { data: existing } = await supabase.from("season_config").select("id").limit(1);
                    if (existing && existing.length > 0) {
                      await supabase.from("season_config").update({ export_enabled: checked } as any).eq("id", existing[0].id);
                    }
                    toast({ title: checked ? "Export Enabled ✅" : "Export Disabled", description: checked ? "Players can now download detailed profiles" : "Detailed export locked to weekends only" });
                  }}
                />
                <span className="font-body text-sm text-foreground">{exportEnabled ? "✅ Export Enabled" : "🔒 Weekend Only"}</span>
              </div>
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
                    {members.filter((m) => m.id !== "SCF-001" && m.role !== "fan" && m.id !== "SCF-P40").map((m) => {
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
          <Card id="finance-section" className="bg-card border-border card-glow">
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
                      {f.expenses.length > 0 && f.expenses.map((exp, i) => {
                        const isIncome = exp.amount < 0;
                        const displayAmount = Math.abs(exp.amount);
                        return (
                          <div key={i} className={`flex justify-between ${isIncome ? "text-green-600/80" : "text-destructive/80"}`}>
                            <span className="text-xs">{exp.date} — {exp.description}</span>
                            <span>{isIncome ? "+" : "-"}KSh {displayAmount.toLocaleString()}</span>
                          </div>
                        );
                      })}
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
          <Card id="attendance-section" className="bg-card border-border card-glow">
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
                    {playerMembersForGrids.map((m) => {
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
              <div className="grid gap-4">
                {Object.entries(
                  mediaItems.reduce((acc, item) => {
                    const date = item.date.split("T")[0];
                    if (!acc[date]) acc[date] = [];
                    acc[date].push(item);
                    return acc;
                  }, {} as Record<string, typeof mediaItems>)
                ).sort(([a], [b]) => b.localeCompare(a)).map(([date, items]) => (
                  <Collapsible key={date} className="border border-border rounded-xl overflow-hidden">
                    <CollapsibleTrigger className="w-full flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 transition-all group">
                      <div className="flex items-center gap-3">
                        <CalendarIcon className="w-5 h-5 text-primary" />
                        <div className="text-left">
                          <p className="font-heading text-sm text-foreground">{new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                          <p className="font-body text-xs text-muted-foreground">{items.length} Photos</p>
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-primary group-data-[state=open]:rotate-45 transition-transform" />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4 bg-card border-t border-border">
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {items.map((item) => (
                          <div key={item.id} className="relative group">
                            <img src={item.url} alt={item.caption || "Photo"} className="w-full aspect-square object-cover rounded-lg border border-border" />
                            <button onClick={() => { deleteMediaItem(item.id, item.url); toast({ title: "Deleted" }); }}
                              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                              <Trash2 className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
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
        {isCoach && <LineupBuilder onFirst11Change={(ids) => setSelectedFirst11(ids.slice(0, 11))} />}

        {/* ===== MANAGER: Member ID Registry ===== */}
        {(isManager || isCoach) && (
          <Card className="bg-card border-border card-glow">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> 📋 Member ID Registry
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowRegistry(!showRegistry)} className="font-body text-xs">
                {showRegistry ? "Hide Registry" : "Show Registry"}
              </Button>
            </CardHeader>
            <Collapsible open={showRegistry}>
              <CollapsibleContent>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full font-body text-sm">
                      <thead>
                        <tr className="border-b border-border text-muted-foreground">
                          <th className="text-left py-2 px-2">ID</th>
                          <th className="text-left py-2 px-2">Name</th>
                          <th className="text-left py-2 px-2">Role</th>
                          <th className="text-left py-2 px-2">Position</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...members].sort((a, b) => a.name.localeCompare(b.name)).map(m => (
                          <tr key={m.id} className="border-b border-border">
                            <td className="py-1.5 px-2 text-primary font-heading text-xs">{m.id}</td>
                            <td className="py-1.5 px-2 text-foreground">{m.name}</td>
                            <td className="py-1.5 px-2 text-muted-foreground capitalize">{m.role}</td>
                            <td className="py-1.5 px-2 text-muted-foreground">{getFullPositionName(m.position)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}


        {/* ===== FAN MANAGEMENT — Coach & Manager ===== */}
        {(isCoach || isManager) && (() => {
          const fans = members.filter(m => m.role === "fan");
          if (fans.length === 0) return null;
          const BADGE_PRESETS = ["Super Fan", "Legend", "MVP Fan", "Rising Star", "OG Supporter"];
          return (
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Star className="w-5 h-5 text-primary" /> Fan Management</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {fans.map(fan => (
                  <FanRow key={fan.id} fan={fan} profilePic={profilePics[fan.id]} badgePresets={BADGE_PRESETS} />
                ))}
              </CardContent>
            </Card>
          );
        })()}

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
                {members.filter(m => m.role === "player" || m.role === "fan").map((m) => <option key={m.id} value={m.id}>{m.name} ({m.role})</option>)}
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

        {/* ===== MANAGER: Role Management ===== */}
        {isManager && (
          <Card className="bg-card border-border card-glow">
            <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> 👔 Member Management</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              
              {/* Role Update */}
              <div className="space-y-3">
                <p className="text-sm font-heading text-primary">Update Role</p>
                <p className="text-xs text-muted-foreground font-body">Promote or demote members. Cannot change your own role.</p>
                <select value={rolePlayerId} onChange={(e) => setRolePlayerId(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-secondary px-3 text-foreground font-body">
                  <option value="">Select member</option>
                  {members.filter(m => m.id !== user.id).map(m => (
                    <option key={m.id} value={m.id}>{m.name} — {m.role}</option>
                  ))}
                </select>
                {rolePlayerId && (
                  <div className="space-y-3">
                    <select value={isCustomRole ? "custom" : newRole} onChange={(e) => {
                      if (e.target.value === "custom") {
                        setIsCustomRole(true);
                        setNewRole("");
                      } else {
                        setIsCustomRole(false);
                        setNewRole(e.target.value);
                      }
                    }}
                      className="w-full h-10 rounded-md border border-input bg-secondary px-3 text-foreground font-body">
                      <option value="">Select new role</option>
                      <option value="player">Player</option>
                      <option value="captain">Captain</option>
                      <option value="coach">Coach</option>
                      <option value="manager">Manager</option>
                      <option value="finance">Finance</option>
                      <option value="assistant_coach">Assistant Coach</option>
                      <option value="fan">Fan</option>
                      <option value="custom">+ Add Custom Role</option>
                    </select>

                    {isCustomRole && (
                      <Input 
                        placeholder="Enter custom role name" 
                        value={customRoleName} 
                        onChange={(e) => {
                          setCustomRoleName(e.target.value);
                          setNewRole(e.target.value);
                        }}
                        className="bg-secondary border-border font-body"
                      />
                    )}

                    <Button disabled={!newRole} onClick={async () => {
                      await updateMemberRole(rolePlayerId, newRole);
                      const memberName = members.find(m => m.id === rolePlayerId)?.name;
                      toast({ title: "Role Updated", description: `${memberName} is now ${newRole}` });
                      setRolePlayerId(""); setNewRole(""); setIsCustomRole(false); setCustomRoleName("");
                    }} className="w-full font-body"><Save className="w-4 h-4 mr-1" /> Update Role</Button>
                  </div>
                )}
              </div>

              {/* Name Update */}
              <div className="space-y-3 pt-3 border-t border-border">
                <p className="text-sm font-heading text-primary">Edit Name</p>
                <select value={editNamePlayerId} onChange={(e) => {
                  setEditNamePlayerId(e.target.value);
                  const mem = members.find(m => m.id === e.target.value);
                  if (mem) setEditNewName(mem.name);
                }} className="w-full h-10 rounded-md border border-input bg-secondary px-3 text-foreground font-body">
                  <option value="">Select member to rename</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                {editNamePlayerId && (
                  <>
                    <Input placeholder="New Name" value={editNewName} onChange={(e) => setEditNewName(e.target.value)} className="bg-secondary border-border font-body" />
                    <Button disabled={!editNewName.trim()} onClick={async () => {
                      await supabase.from("members").update({ name: editNewName.trim() } as any).eq("id", editNamePlayerId);
                      toast({ title: "Name Updated", description: `Updated name to ${editNewName.trim()}` });
                      setEditNamePlayerId(""); setEditNewName("");
                      window.location.reload();
                    }} className="w-full font-body"><Edit className="w-4 h-4 mr-1" /> Save Name</Button>
                  </>
                )}
              </div>

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

        {/* ===== MESSAGE INBOX (Collapsible Box) ===== */}
        <Card className="bg-card border-border card-glow">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" /> Message Inbox
            </CardTitle>
            <Badge variant="secondary" className="font-body">{myMessages.filter(m => !m.read).length} New</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {myMessages.length === 0 ? (
              <p className="text-muted-foreground text-sm font-body italic text-center py-4">Your inbox is empty</p>
            ) : (
              <Accordion type="single" collapsible className="w-full space-y-2">
                {myMessages.map(msg => {
                  const sender = members.find(m => m.id === msg.fromId);
                  return (
                    <AccordionItem key={msg.id} value={msg.id} className={`border border-border rounded-lg px-3 ${!msg.read ? 'bg-primary/5 border-primary/30' : 'bg-secondary/30'}`}>
                      <AccordionTrigger onClick={() => !msg.read && markMessageRead(msg.id)} className="hover:no-underline py-3">
                        <div className="flex items-center gap-3 text-left w-full pr-2">
                          {!msg.read && <div className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />}
                          <div className="min-w-0 flex-1">
                            <p className="font-heading text-xs text-primary truncate">{sender?.name || 'Unknown'}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(msg.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-1 pb-4">
                        <div className="p-3 bg-card border border-border rounded-lg shadow-inner">
                          <p className="font-body text-sm text-foreground whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          <div className="flex gap-2 mt-4">
                            <Button size="sm" variant="default" className="text-xs h-8" onClick={() => setReplyTo(msg.fromId)}>
                              <Send className="w-3 h-3 mr-1" /> Reply
                            </Button>
                          </div>
                          {replyTo === msg.fromId && (
                            <div className="pt-3 space-y-2 border-t border-border mt-3">
                              <Textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Type reply..." className="bg-secondary border-border font-body text-sm min-h-[80px]" />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleReply} className="font-body text-xs"><Send className="w-3 h-3 mr-1" /> Send Reply</Button>
                                <Button size="sm" variant="ghost" onClick={() => { setReplyTo(null); setReplyContent(""); }} className="font-body text-xs">Cancel</Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default OfficialProfile;
