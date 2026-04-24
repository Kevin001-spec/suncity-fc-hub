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
  UserPlus, MessageCircle, Send, Mail, Footprints, Gamepad2, Shield, Hand, Crosshair, Award, Flame,
  FolderOpen, ChevronRight, ChevronDown,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { contributionMonths, getContribMonthsForMember } from "@/data/team-data";
import { generateBrandedDocx, generatePlayerProfileDocx, type DocxTableData } from "@/lib/docx-export";
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

const EditTeamForm = ({ team, onSave, onCancel }: { team: LeagueTeam, onSave: (id: string, data: any) => void, onCancel: () => void }) => {
  const [data, setData] = useState({
    played: team.played,
    won: team.won,
    drawn: team.drawn,
    lost: team.lost,
    gd: team.goal_difference,
    pts: team.points
  });

  return (
    <div className="bg-secondary/30 p-3 rounded-lg border border-border mt-2 space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase">Played</label>
          <Input type="number" value={data.played} onChange={e => setData({ ...data, played: parseInt(e.target.value) || 0 })} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase">Won</label>
          <Input type="number" value={data.won} onChange={e => setData({ ...data, won: parseInt(e.target.value) || 0 })} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase">Drawn</label>
          <Input type="number" value={data.drawn} onChange={e => setData({ ...data, drawn: parseInt(e.target.value) || 0 })} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase">Lost</label>
          <Input type="number" value={data.lost} onChange={e => setData({ ...data, lost: parseInt(e.target.value) || 0 })} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase">GD</label>
          <Input type="number" value={data.gd} onChange={e => setData({ ...data, gd: parseInt(e.target.value) || 0 })} className="h-8 text-xs" />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] text-muted-foreground uppercase">Pts</label>
          <Input type="number" value={data.pts} onChange={e => setData({ ...data, pts: parseInt(e.target.value) || 0 })} className="h-8 text-xs" />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button size="sm" onClick={() => onSave(team.id, data)}><Save className="w-3 h-3 mr-1" /> Save</Button>
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
    updateMemberRole, recordTrainingMatch, refreshData, trainingMatches, trainingPerformances
  } = useTeamData();

  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRoleName, setCustomRoleName] = useState("");
  const [showGalleryGroups, setShowGalleryGroups] = useState(false);
  const [selectedGalleryGroup, setSelectedGalleryGroup] = useState<any[]>([]);
  const [showGalleryDialog, setShowGalleryDialog] = useState(false);
  const [showInboxDialog, setShowInboxDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  const isCoach = user?.role === "coach" || user?.role === "assistant_coach";
  const isFadhir = user?.id === "SCF-002";
  const isManager = user?.role === "manager";
  const isFabian = user?.id === "SCF-001";
  const isCaptain = user?.role === "captain";
  const isVictor = user?.id === "SCF-006";

  const maskId = (id: string) => (isManager || isCoach) ? id : "SCF-***";

  const handleExportProfile = async (targetMember: any, detailed = false) => {
    // If targeted member is Captain, Fadhir, or Victor, use detailed export logic
    const isSpecialRole = targetMember.role === "captain" || targetMember.id === "SCF-002" || targetMember.id === "SCF-006";
    
    const stats = getStatsForPosition(targetMember.position).map(sf => ({
      label: sf.label,
      value: (targetMember as any)?.[sf.key] || 0
    }));
    
    const attDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(day => {
      const record = attendance.filter(a => a.playerId === targetMember.id).find(a => a.day === day);
      return { day, status: record?.status || "absent" };
    });

    const mContribMonths = getContribMonthsForMember(targetMember.id);
    const contribs = mContribMonths.map(m => ({
      month: m.label,
      status: targetMember.contributions[m.key] || "unpaid",
    }));

    if (isSpecialRole || detailed) {
      // Add match performances if available
      const { data: perfs } = await supabase.from("match_performances").select("*").eq("player_id", targetMember.id).order("created_at", { ascending: false });
      const { data: awards } = await supabase.from("match_awards" as any).select("*").eq("player_id", targetMember.id).order("created_at", { ascending: false });
      
      await generatePlayerProfileDocx(
        targetMember.name, targetMember.id, getFullPositionName(targetMember.position),
        stats, attDays, [], contribs, profilePics[targetMember.id], 
        undefined, perfs as any, awards as any
      );
    } else {
      await generatePlayerProfileDocx(
        targetMember.name, targetMember.id, getFullPositionName(targetMember.position),
        stats, attDays, [], contribs, profilePics[targetMember.id]
      );
    }
    toast({ title: `📄 ${targetMember.name} Profile Exported` });
  };

  const [trainingTeams, setTrainingTeams] = useState<{ teamA: string[], teamB: string[] }>({ teamA: [], teamB: [] });
  const [trainingScores, setTrainingScores] = useState({ teamA: 0, teamB: 0 });
  const [trainingPerfs, setTrainingPerfs] = useState<Record<string, any>>({});
  const [showTrainingRecorder, setShowTrainingRecorder] = useState(false);
  
  // --- VICTOR'S JERSEY WASHING SYSTEM ---
  const [jerseyVolunteers, setJerseyVolunteers] = useState<string[]>([]);

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

  const canUploadMedia = ["coach", "manager", "captain", "assistant_coach"].includes(user?.role || "");
  const canManageFinance = isFadhir || isCoach;
  const canApproveContributions = isFadhir || isCoach;
  const canDeletePhotos = isManager;
  const canManageContribEvents = isFadhir || isCaptain;
  const showContributions = !isCoach;
  const canManageAttendance = isManager || user?.id === "SCF-004" || isCoach;
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
      cleanSheet: false, aerialDuels: 0, rating: 0, isPotm: false,
      directShots: 0,
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
      perfData.directShots = parseInt(perfDirectShots) || 0;
    } else {
      perfData.goals = parseInt(perfGoals) || 0;
      perfData.assists = parseInt(perfAssists) || 0;
      perfData.tackles = parseInt(perfTackles) || 0;
      perfData.directShots = parseInt(perfDirectShots) || 0;
    }
    
    await addMatchPerformance(perfData);
    
    // Show success immediately — POTM calc + awards run in background
    toast({ title: "✅ Performance Recorded", description: `${perfPlayer?.name} stats synced. Awards calculating...` });
    setPerfPlayerId(""); setPerfGoals("0"); setPerfAssists("0"); setPerfSaves("0");
    setPerfTackles("0"); setPerfInterceptions("0"); setPerfBlocks("0"); setPerfClearances("0");
    setPerfCleanSheet(false); setPerfAerialDuels("0"); setPerfDirectShots("0");
    
    // Background POTM calculation + post-match awards (non-blocking)
    const gameId = perfGameId;
    (async () => {
      const { data: allPerfs } = await supabase.from("match_performances")
        .select("*").eq("game_id", gameId);
      if (!allPerfs || allPerfs.length === 0) return;

      // --- POTM calculation ---
      let bestId = "";
      let bestScore = -1;
      for (const p of allPerfs) {
        const pl = members.find(m => m.id === p.player_id);
        const score = calculatePotmScore({
          goals: p.goals, assists: p.assists, saves: p.saves,
          tackles: p.tackles, interceptions: p.interceptions,
          cleanSheet: p.clean_sheet, aerialDuels: p.aerial_duels,
          positionGroup: getPositionGroup(pl?.position),
        });
        if (score > bestScore) { bestScore = score; bestId = p.id; }
      }
      await supabase.from("match_performances").update({ is_potm: false } as any).eq("game_id", gameId);
      if (bestId) {
        await supabase.from("match_performances").update({ is_potm: true } as any).eq("id", bestId);
      }

      // --- Post-match awards (max 6) ---
      // Delete old awards for this game first
      await supabase.from("match_awards" as any).delete().eq("game_id", gameId);
      
      const awards: { game_id: string; player_id: string; award_type: string; award_label: string; reason: string }[] = [];
      
      // 1. 🏆 Player of the Match
      const potmPerf = allPerfs.find(p => p.id === bestId);
      if (potmPerf) {
        const potmPlayer = members.find(m => m.id === potmPerf.player_id);
        awards.push({ game_id: gameId, player_id: potmPerf.player_id, award_type: "potm", award_label: "🏆 Player of the Match", reason: `Top performer with ${bestScore} points` });
      }
      
      // 2. 🛡️ Defensive Wall — most tackles (min 5)
      const sortedByTackles = [...allPerfs].sort((a, b) => b.tackles - a.tackles);
      if (sortedByTackles[0]?.tackles >= 5 && sortedByTackles[0].id !== bestId) {
        const p = sortedByTackles[0];
        awards.push({ game_id: gameId, player_id: p.player_id, award_type: "defensive_wall", award_label: "🛡️ Defensive Wall", reason: `${p.tackles} tackles — rock solid defense` });
      }
      
      // 3. 🎯 Sharpshooter — most goals (min 1)
      const sortedByGoals = [...allPerfs].sort((a, b) => b.goals - a.goals);
      if (sortedByGoals[0]?.goals >= 1 && sortedByGoals[0].id !== bestId) {
        const p = sortedByGoals[0];
        awards.push({ game_id: gameId, player_id: p.player_id, award_type: "sharpshooter", award_label: "🎯 Sharpshooter", reason: `${p.goals} goal${p.goals > 1 ? "s" : ""} — clinical finishing` });
      }
      
      // 4. 🅰️ Playmaker — most assists (min 1)
      const sortedByAssists = [...allPerfs].sort((a, b) => b.assists - a.assists);
      if (sortedByAssists[0]?.assists >= 1 && sortedByAssists[0].id !== bestId) {
        const p = sortedByAssists[0];
        awards.push({ game_id: gameId, player_id: p.player_id, award_type: "playmaker", award_label: "🅰️ Playmaker", reason: `${p.assists} assist${p.assists > 1 ? "s" : ""} — vision and creativity` });
      }
      
      // 5. 🧤 Iron Wall — most saves (GK, min 3)
      const sortedBySaves = [...allPerfs].sort((a, b) => b.saves - a.saves);
      if (sortedBySaves[0]?.saves >= 3 && sortedBySaves[0].id !== bestId) {
        const p = sortedBySaves[0];
        awards.push({ game_id: gameId, player_id: p.player_id, award_type: "iron_wall", award_label: "🧤 Iron Wall", reason: `${p.saves} saves — unbeatable in goal` });
      }
      
      // 6. 📈 Rising Star — biggest improvement vs previous match
      const { data: prevGamePerfs } = await supabase.from("match_performances")
        .select("*").neq("game_id", gameId).order("created_at", { ascending: false }).limit(50);
      if (prevGamePerfs && prevGamePerfs.length > 0) {
        // Get the previous game's perfs
        const prevGameId = prevGamePerfs[0]?.game_id;
        const prevPerfs = prevGamePerfs.filter(p => p.game_id === prevGameId);
        let bestImprovement = 0;
        let risingStarId = "";
        let risingStarDelta = "";
        for (const curr of allPerfs) {
          const prev = prevPerfs.find(pp => pp.player_id === curr.player_id);
          if (!prev) continue;
          const currTotal = curr.goals + curr.assists + curr.saves + curr.tackles + curr.interceptions;
          const prevTotal = prev.goals + prev.assists + prev.saves + prev.tackles + prev.interceptions;
          const delta = currTotal - prevTotal;
          if (delta > bestImprovement && curr.id !== bestId) {
            bestImprovement = delta;
            risingStarId = curr.player_id;
            risingStarDelta = `${prevTotal} → ${currTotal} (+${delta})`;
          }
        }
        if (risingStarId && bestImprovement > 0) {
          awards.push({ game_id: gameId, player_id: risingStarId, award_type: "rising_star", award_label: "📈 Rising Star", reason: `Stats improved: ${risingStarDelta}` });
        }
      }
      
      // 7. 🎩 Hat-trick Hero (3+ goals)
      const hatTrick = allPerfs.find(p => p.goals >= 3 && p.id !== bestId && !awards.some(a => a.player_id === p.player_id));
      if (hatTrick) {
        awards.push({ game_id: gameId, player_id: hatTrick.player_id, award_type: "hat_trick", award_label: "🎩 Hat-trick Hero", reason: `${hatTrick.goals} goals — clinical hat-trick performance` });
      }
      
      // 8. 🔒 Lockdown (defender with tackles > 8)
      const lockdown = allPerfs.find(p => p.tackles >= 8 && p.id !== bestId && !awards.some(a => a.player_id === p.player_id));
      if (lockdown) {
        const lPlayer = members.find(m => m.id === lockdown.player_id);
        const lPosGroup = getPositionGroup(lPlayer?.position);
        if (lPosGroup === "DEF") {
          awards.push({ game_id: gameId, player_id: lockdown.player_id, award_type: "lockdown", award_label: "🔒 Lockdown", reason: `${lockdown.tackles} tackles — defensive fortress` });
        }
      }
      
      // 9. 👟 Engine Room (highest tackles + assists for MID)
      const midPerfs = allPerfs.filter(p => {
        const pl = members.find(m => m.id === p.player_id);
        return getPositionGroup(pl?.position) === "MID" && p.id !== bestId && !awards.some(a => a.player_id === p.player_id);
      }).sort((a, b) => (b.tackles + b.assists) - (a.tackles + a.assists));
      if (midPerfs[0] && (midPerfs[0].tackles + midPerfs[0].assists) >= 3) {
        awards.push({ game_id: gameId, player_id: midPerfs[0].player_id, award_type: "engine_room", award_label: "👟 Engine Room", reason: `${midPerfs[0].tackles} tackles + ${midPerfs[0].assists} assists — midfield powerhouse` });
      }
      
      // Insert all awards (max 9)
      if (awards.length > 0) {
        await supabase.from("match_awards" as any).insert(awards.slice(0, 9));
      }
    })();
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
    goals: Target, directShots: Crosshair, successfulTackles: Shield,
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
            <LottieCarousel animations={profileCarousel} className="w-16 h-16 md:w-24 md:h-24" />
          </div>
          <h2 className="font-heading text-2xl text-foreground mt-4">{liveMember.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Badge className="bg-primary text-primary-foreground font-body capitalize">{user.role.replace("_", " ")}</Badge>
          </div>
          {liveMember.position && <p className="text-muted-foreground font-body text-sm mt-1">{getFullPositionName(liveMember.position)}</p>}
        </motion.div>

        {/* ===== CAPTAIN/OFFICIAL PERSONAL STATS ===== */}
        {(isCaptain || isFadhir || isVictor) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="bg-card border-border card-glow relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10 rounded-full" onClick={() => handleExportProfile(liveMember, true)}>
                  <Download className="w-4 h-4 text-primary" />
                </Button>
              </div>
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

                    {/* Score Input */}
                    <div className="flex items-center justify-center gap-6 py-2 bg-secondary/10 rounded-lg">
                      <div className="text-center">
                        <p className="text-[10px] font-heading text-primary uppercase mb-1">TEAM A</p>
                        <Input type="number" value={trainingScores.teamA} 
                          onChange={e => setTrainingScores(prev => ({ ...prev, teamA: parseInt(e.target.value) || 0 }))}
                          className="w-16 h-12 text-center text-2xl font-heading" />
                      </div>
                      <div className="text-2xl font-heading text-muted-foreground mt-4">VS</div>
                      <div className="text-center">
                        <p className="text-[10px] font-heading text-primary uppercase mb-1">TEAM B</p>
                        <Input type="number" value={trainingScores.teamB} 
                          onChange={e => setTrainingScores(prev => ({ ...prev, teamB: parseInt(e.target.value) || 0 }))}
                          className="w-16 h-12 text-center text-2xl font-heading" />
                      </div>
                    </div>

                    {/* Performance Recording for selected players */}
                    <div className="space-y-3">
                      <label className="text-xs font-heading text-primary uppercase">Player Performance (Selected Players Only)</label>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {[...trainingTeams.teamA, ...trainingTeams.teamB].map(id => {
                          const m = members.find(mem => mem.id === id);
                          if (!m) return null;
                          return (
                            <div key={id} className="p-3 rounded-lg border border-border bg-secondary/5 space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant={trainingTeams.teamA.includes(id) ? "default" : "secondary"}>{trainingTeams.teamA.includes(id) ? 'A' : 'B'}</Badge>
                                  <span className="font-heading text-sm">{m.name}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-muted-foreground">Goals</span>
                                    <Input type="number" value={trainingPerfs[id]?.goals || 0}
                                      onChange={e => setTrainingPerfs(prev => ({ ...prev, [id]: { ...(prev[id] || {}), goals: parseInt(e.target.value) || 0 } }))}
                                      className="w-10 h-7 p-1 text-center text-xs" />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] text-muted-foreground">Assists</span>
                                    <Input type="number" value={trainingPerfs[id]?.assists || 0}
                                      onChange={e => setTrainingPerfs(prev => ({ ...prev, [id]: { ...(prev[id] || {}), assists: parseInt(e.target.value) || 0 } }))}
                                      className="w-10 h-7 p-1 text-center text-xs" />
                                  </div>
                                  <div className="flex items-center gap-2 border-l border-border pl-2">
                                    <span className="text-[10px] text-muted-foreground">POTM?</span>
                                    <Checkbox checked={trainingPerfs[id]?.isPotm || false}
                                      onCheckedChange={(val) => {
                                        // Reset other POTMs
                                        const newPerfs = { ...trainingPerfs };
                                        Object.keys(newPerfs).forEach(k => newPerfs[k].isPotm = false);
                                        newPerfs[id] = { ...(newPerfs[id] || {}), isPotm: !!val };
                                        setTrainingPerfs(newPerfs);
                                      }} />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-border">
                      <Button variant="ghost" onClick={() => setShowTrainingRecorder(false)}>Cancel</Button>
                      <Button onClick={handleRecordTraining} className="bg-green-600 hover:bg-green-700">Save Training Results</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Member Registry (Admin Only) */}
          {(isManager || isCoach) && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Card className="bg-card border-border card-glow h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Member Registry</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setShowRegistry(!showRegistry)} className="text-xs font-body">{showRegistry ? "Hide" : "Show All"}</Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input placeholder="Name" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} className="bg-secondary/50 font-body" />
                    <Button onClick={handleAddPlayer} className="font-body shrink-0"><Plus className="w-4 h-4 mr-1" /> Add</Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={newMemberType === "player" ? "default" : "outline"} className="cursor-pointer" onClick={() => setNewMemberType("player")}>Player</Badge>
                    <Badge variant={newMemberType === "fan" ? "default" : "outline"} className="cursor-pointer" onClick={() => setNewMemberType("fan")}>Fan</Badge>
                    <select value={newPlayerPos} onChange={(e) => setNewPlayerPos(e.target.value)} className="bg-secondary/50 rounded-md px-2 py-1 text-xs border border-border focus:outline-none">
                      <option value="">Position</option>
                      <option value="GK">GK</option>
                      <option value="LB">LB</option>
                      <option value="CB">CB</option>
                      <option value="RB">RB</option>
                      <option value="CDM">CDM</option>
                      <option value="CM">CM</option>
                      <option value="CAM">CAM</option>
                      <option value="LW">LW</option>
                      <option value="RW">RW</option>
                      <option value="ST">ST</option>
                    </select>
                  </div>
                  
                  {showRegistry && (
                    <div className="space-y-2 mt-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                      {members.sort((a,b) => a.name.localeCompare(b.name)).map((m) => (
                        <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 border border-border group">
                          <div className="flex flex-col">
                            <span className="font-heading text-sm text-foreground">{m.name}</span>
                            <span className="text-[10px] text-muted-foreground font-body">{m.id} • {m.role}</span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => handleExportProfile(m)}>
                              <Download className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => { setRemovePlayerId(m.id); setShowRemoveConfirm(true); }}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Inbox (Messages) */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
            <Card className="bg-card border-border card-glow h-full relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                {myMessages.some(m => !m.read) && <Badge className="bg-primary animate-pulse text-[10px]">NEW</Badge>}
              </div>
              <CardHeader>
                <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Mail className="w-5 h-5 text-primary" /> Official Inbox</CardTitle>
                <p className="text-xs text-muted-foreground font-body">Messages from members and other officials.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {myMessages.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8 font-body italic">No messages yet.</p>
                  ) : (
                    myMessages.map((m) => (
                      <div key={m.id} className={`p-3 rounded-lg border transition-all ${m.read ? "bg-secondary/10 border-border" : "bg-primary/5 border-primary/30 card-glow"}`} onClick={() => markMessageRead(m.id)}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-heading text-xs text-primary">{members.find(mem => mem.id === m.fromId)?.name || m.fromId}</span>
                          <span className="text-[10px] text-muted-foreground">{format(new Date(m.createdAt), "MMM d, HH:mm")}</span>
                        </div>
                        <p className="text-sm text-foreground font-body leading-relaxed">{m.content}</p>
                        <div className="mt-2 flex justify-end">
                          <Button size="sm" variant="ghost" className="h-7 text-[10px] font-body" onClick={(e) => { e.stopPropagation(); setReplyTo(m.fromId); setReplyContent(""); }}>Reply</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="pt-2 border-t border-border flex gap-2">
                  <Input placeholder="Compose message..." className="bg-secondary/50 text-sm h-9" value={sendMsgContent} onChange={(e) => setSendMsgContent(e.target.value)} />
                  <Popover>
                    <PopoverTrigger asChild><Button size="sm" variant="outline" className="h-9 px-3"><UserPlus className="w-4 h-4" /></Button></PopoverTrigger>
                    <PopoverContent className="w-64 p-2 bg-card border-border">
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {members.filter(m => m.id !== user.id).sort((a,b) => a.name.localeCompare(b.name)).map(m => (
                          <div key={m.id} className={`p-2 text-xs font-body rounded cursor-pointer transition-colors ${sendMsgTo === m.id ? "bg-primary text-primary-foreground" : "hover:bg-secondary"}`} onClick={() => setSendMsgTo(m.id)}>{m.name}</div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button size="sm" onClick={handleSendMsg} disabled={!sendMsgTo || !sendMsgContent.trim()} className="h-9"><Send className="w-4 h-4" /></Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Financial Management (Fadhir/Coach Only) */}
        {canManageFinance && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /> Financial Management</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportFinancialPdf} className="text-xs font-body h-8"><Download className="w-3 h-3 mr-1" /> Export Details</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-xs font-heading text-primary uppercase">Record Transaction</h4>
                    <div className="space-y-3 p-4 rounded-xl bg-secondary/10 border border-border">
                      <div className="flex gap-2 mb-2">
                        <Button variant={finType === "in" ? "default" : "outline"} size="sm" className="flex-1 h-8 text-[10px]" onClick={() => setFinType("in")}>Income</Button>
                        <Button variant={finType === "out" ? "default" : "outline"} size="sm" className="flex-1 h-8 text-[10px]" onClick={() => setFinType("out")}>Expense</Button>
                      </div>
                      <div className="space-y-2">
                        <Input placeholder="Amount (KSh)" value={finAmount} onChange={(e) => setFinAmount(e.target.value)} className="bg-secondary/50 font-body text-sm h-9" />
                        <Input placeholder="Description" value={finDesc} onChange={(e) => setFinDesc(e.target.value)} className="bg-secondary/50 font-body text-sm h-9" />
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-full h-9 justify-start text-left font-body text-sm bg-secondary/50 border-border", !finDate && "text-muted-foreground")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {finDate ? format(finDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={finDate} onSelect={setFinDate} initialFocus className="bg-card border-border" />
                          </PopoverContent>
                        </Popover>
                        <Button onClick={handleRecordTransaction} className="w-full font-body h-9" disabled={!finAmount || !finDesc || !finDate}><Plus className="w-4 h-4 mr-1" /> Add Record</Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-heading text-primary uppercase">Member Contribution Quick-Update</h4>
                    <div className="p-4 rounded-xl bg-secondary/10 border border-border space-y-4">
                      <div className="flex gap-2">
                        <select className="bg-secondary/50 border border-border rounded-md px-3 py-1.5 text-sm flex-1 font-body focus:outline-none" value={finMonth} onChange={(e) => setFinMonth(e.target.value)}>
                          {contributionMonths.map(m => <option key={m.key} value={m.label}>{m.label}</option>)}
                        </select>
                        <Button variant="outline" size="sm" className="font-body text-xs" onClick={() => requestContribution(finMonth)}>Request All</Button>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {playerMembers.sort((a,b) => a.name.localeCompare(b.name)).map(m => (
                          <div key={m.id} className="flex items-center justify-between text-xs p-2 rounded bg-secondary/20">
                            <span className="font-body truncate mr-2">{m.name}</span>
                            <div className="flex items-center gap-1">
                              <Badge className={`text-[10px] cursor-pointer ${m.contributions[contributionMonths.find(mon => mon.label === finMonth)?.key || ""] === "paid" ? "bg-green-600" : "bg-red-600/30"}`}
                                onClick={() => {
                                  const monthKey = contributionMonths.find(mon => mon.label === finMonth)?.key;
                                  if (monthKey) updateContributionDirect(m.id, monthKey, m.contributions[monthKey] === "paid" ? "unpaid" : "paid");
                                }}>
                                {m.contributions[contributionMonths.find(mon => mon.label === finMonth)?.key || ""] === "paid" ? "Paid" : "Unpaid"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Registry & Permissions (Manager Only) */}
        {isManager && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="bg-card border-border card-glow">
              <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Lock className="w-5 h-5 text-primary" /> Management Tools</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Gallery & Homepage Control */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-heading text-primary uppercase tracking-wider">Visual Assets</h4>
                    <div className="grid grid-cols-1 gap-2">
                      <Button variant="outline" className="justify-start font-body text-sm h-10 border-border hover:bg-secondary/50" onClick={() => mediaInputRef.current?.click()}><Image className="w-4 h-4 mr-2 text-primary" /> Upload Photos</Button>
                      <input ref={mediaInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleMediaUpload} />
                      <Button variant="outline" className="justify-start font-body text-sm h-10 border-border hover:bg-secondary/50" onClick={() => homepageInputRef.current?.click()}><Star className="w-4 h-4 mr-2 text-primary" /> Set Homepage Highlights (Max 4)</Button>
                      <input ref={homepageInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleHomepageUpload} />
                    </div>
                  </div>

                  {/* Role & Name Management */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-heading text-primary uppercase tracking-wider">Access Control</h4>
                    <div className="space-y-3 p-4 rounded-xl bg-secondary/10 border border-border">
                      <select className="w-full bg-secondary/50 border border-border rounded-md px-3 py-1.5 text-sm font-body focus:outline-none mb-2" value={rolePlayerId} onChange={(e) => setRolePlayerId(e.target.value)}>
                        <option value="">Select Member</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                      <div className="flex gap-2">
                        <select className="flex-1 bg-secondary/50 border border-border rounded-md px-3 py-1.5 text-xs font-body focus:outline-none" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                          <option value="">Select Role</option>
                          <option value="player">Player</option>
                          <option value="captain">Captain</option>
                          <option value="coach">Coach</option>
                          <option value="assistant_coach">Asst Coach</option>
                          <option value="manager">Manager</option>
                          <option value="finance">Finance</option>
                          <option value="fan">Fan</option>
                        </select>
                        <Button size="sm" className="font-body text-xs" disabled={!rolePlayerId || !newRole} onClick={async () => { await updateMemberRole(rolePlayerId, newRole); toast({ title: "Role Updated" }); setNewRole(""); setRolePlayerId(""); }}>Apply</Button>
                      </div>
                    </div>
                  </div>

                  {/* Player Stats Tuning */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-heading text-primary uppercase tracking-wider">Career Stats Tuning</h4>
                    <div className="p-4 rounded-xl bg-secondary/10 border border-border">
                      <select className="w-full bg-secondary/50 border border-border rounded-md px-3 py-1.5 text-sm font-body focus:outline-none mb-3" value={statsPlayerId} onChange={(e) => setStatsPlayerId(e.target.value)}>
                        <option value="">Select Player</option>
                        {playerMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                      {statsPlayerId && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {getStatsForPosition(selectedStatsPlayer?.position).map(f => (
                            <div key={f.key} className="space-y-1">
                              <label className="text-[10px] text-muted-foreground uppercase">{f.label}</label>
                              <Input type="number" className="h-8 text-xs bg-card" value={
                                f.key === "goals" ? statsGoals : f.key === "assists" ? statsAssists : 
                                f.key === "saves" ? statsSaves : f.key === "cleanSheets" ? statsCleanSheets :
                                f.key === "aerialDuels" ? statsAerialDuels : f.key === "tackles" ? statsTackles :
                                f.key === "interceptions" ? statsInterceptions : f.key === "directShots" ? statsDirectShots :
                                statsSuccessfulTackles
                              } onChange={(e) => {
                                const v = e.target.value;
                                if (f.key === "goals") setStatsGoals(v); else if (f.key === "assists") setStatsAssists(v);
                                else if (f.key === "saves") setStatsSaves(v); else if (f.key === "cleanSheets") setStatsCleanSheets(v);
                                else if (f.key === "aerialDuels") setStatsAerialDuels(v); else if (f.key === "tackles") setStatsTackles(v);
                                else if (f.key === "interceptions") setStatsInterceptions(v); else if (f.key === "directShots") setStatsDirectShots(v);
                                else setStatsSuccessfulTackles(v);
                              }} />
                            </div>
                          ))}
                        </div>
                      )}
                      <Button className="w-full h-8 text-xs font-body" disabled={!statsPlayerId} onClick={handleUpdateStats}><Save className="w-3 h-3 mr-1" /> Update Statistics</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Jersey Washing (Victor Only) */}
        {isVictor && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-card border-border card-glow relative overflow-hidden">
               <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/5 rounded-full blur-xl" />
               <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Flame className="w-5 h-5 text-primary" /> Jersey Washing System</CardTitle></CardHeader>
               <CardContent className="space-y-4">
                 <div className="flex gap-2">
                   <Button onClick={handleFindJerseyVolunteers} className="flex-1 font-body">Auto-Pick Volunteers</Button>
                   {jerseyVolunteers.length > 0 && <Button variant="outline" onClick={handleExportJerseyData} className="h-10 px-3"><Download className="w-4 h-4" /></Button>}
                 </div>
                 {jerseyVolunteers.length > 0 && (
                   <div className="grid grid-cols-3 gap-3">
                     {[0, 1, 2].map(i => (
                       <div key={i} className="p-3 rounded-lg bg-secondary/10 border border-border text-center">
                         <p className="text-[10px] font-heading text-primary uppercase mb-2">Pair {i+1}</p>
                         <div className="space-y-1">
                           <p className="text-sm font-heading text-foreground">{jerseyVolunteers[i*2]}</p>
                           <p className="text-xs text-muted-foreground">&</p>
                           <p className="text-sm font-heading text-foreground">{jerseyVolunteers[i*2+1]}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Global Match History & Performance Recording */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="bg-card border-border card-glow overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-secondary/5">
              <div>
                <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" /> Match Results & Stats</CardTitle>
                <p className="text-xs text-muted-foreground font-body mt-1">Record game scores and individual player performances.</p>
              </div>
              {canAddScoresEvents && (
                <Dialog>
                  <DialogTrigger asChild><Button size="sm" className="font-body"><Plus className="w-4 h-4 mr-1" /> New Game Result</Button></DialogTrigger>
                  <DialogContent className="bg-card border-border max-w-lg">
                    <DialogHeader><DialogTitle className="font-heading text-primary">Record New Game Score</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-heading text-muted-foreground uppercase">Opponent Name</label>
                          <Input placeholder="e.g. AFC Leopards" value={newOpponent} onChange={(e) => setNewOpponent(e.target.value)} className="bg-secondary/50" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-heading text-muted-foreground uppercase">Game Type</label>
                          <select className="w-full bg-secondary/50 border border-border rounded-md px-3 py-2 text-sm focus:outline-none" value={newGameType} onChange={(e) => setNewGameType(e.target.value)}>
                            <option value="league">League Match</option>
                            <option value="friendly">Friendly</option>
                            <option value="tournament">Tournament</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-heading text-muted-foreground uppercase">Our Score</label>
                          <Input type="number" placeholder="0" value={newOurScore} onChange={(e) => setNewOurScore(e.target.value)} className="bg-secondary/50 text-center text-lg font-heading" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-heading text-muted-foreground uppercase">Their Score</label>
                          <Input type="number" placeholder="0" value={newTheirScore} onChange={(e) => setNewTheirScore(e.target.value)} className="bg-secondary/50 text-center text-lg font-heading" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-heading text-muted-foreground uppercase">Venue</label>
                          <Input placeholder="e.g. Hope Centre" value={newVenue} onChange={(e) => setNewVenue(e.target.value)} className="bg-secondary/50" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-heading text-muted-foreground uppercase">Match Date</label>
                          <Input type="date" value={newScoreDate} onChange={(e) => setNewScoreDate(e.target.value)} className="bg-secondary/50" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-heading text-muted-foreground uppercase">SunCity Scorers ({ourScoreNum})</label>
                        <div className="grid grid-cols-2 gap-2">
                          {Array.from({ length: ourScoreNum }).map((_, i) => (
                            <select key={i} className="bg-secondary/50 border border-border rounded-md px-2 py-1.5 text-xs focus:outline-none" value={scorers[i] || ""} onChange={(e) => { const newScorers = [...scorers]; newScorers[i] = e.target.value; setScorers(newScorers); }}>
                              <option value="">Scorer {i+1}</option>
                              {playerMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                            </select>
                          ))}
                        </div>
                      </div>
                      <DialogFooter className="pt-4"><Button onClick={addScore} className="w-full font-heading" disabled={!newOpponent || !newOurScore || !newTheirScore}>Save Game Result</Button></DialogFooter>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {gameScores.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((game) => (
                  <Collapsible key={game.id} className="w-full">
                    <div className="p-4 flex items-center justify-between hover:bg-secondary/5 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center justify-center bg-secondary/30 rounded-lg w-12 h-12 border border-border">
                          <span className="text-[10px] font-heading text-primary uppercase leading-none">{format(new Date(game.date), "MMM")}</span>
                          <span className="text-lg font-heading text-foreground leading-tight">{format(new Date(game.date), "dd")}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-heading text-sm text-foreground">vs {game.opponent}</h4>
                            <Badge variant="outline" className="text-[9px] h-4 py-0 font-body uppercase">{game.gameType}</Badge>
                          </div>
                          <p className="text-[10px] text-muted-foreground font-body mt-0.5"><MapPin className="w-3 h-3 inline mr-1" /> {game.venue || "Venue N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-secondary/20 border border-border font-heading">
                          <span className={game.ourScore > game.theirScore ? "text-green-500" : game.ourScore < game.theirScore ? "text-red-500" : "text-yellow-500"}>{game.ourScore}</span>
                          <span className="text-muted-foreground/50 text-xs">-</span>
                          <span className={game.theirScore > game.ourScore ? "text-green-500" : game.theirScore < game.ourScore ? "text-red-500" : "text-yellow-500"}>{game.theirScore}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" className="h-8 px-2 font-body text-xs" onClick={() => exportMatchStats(game.id)}><Download className="w-3 h-3 mr-1" /> Report</Button>
                          <CollapsibleTrigger asChild><Button size="sm" variant="ghost" className="h-8 w-8 p-0"><ChevronDown className="w-4 h-4" /></Button></CollapsibleTrigger>
                        </div>
                      </div>
                    </div>
                    <CollapsibleContent className="px-4 pb-4 border-t border-border/30 bg-secondary/5">
                      <div className="pt-4 space-y-6">
                        {/* Scorers */}
                        {game.scorers && game.scorers.length > 0 && (
                          <div className="space-y-2">
                            <h5 className="text-[10px] font-heading text-primary uppercase flex items-center gap-1"><Target className="w-3 h-3" /> SunCity Scorers</h5>
                            <div className="flex flex-wrap gap-2">
                              {game.scorers.map((s, i) => <Badge key={i} variant="secondary" className="font-body text-[10px]">{s}</Badge>)}
                            </div>
                          </div>
                        )}

                        {/* Record Performance Stats */}
                        {isCaptain || isManager || isCoach ? (
                          <div className="space-y-3 p-4 rounded-xl bg-card border border-border shadow-sm">
                            <h5 className="text-[10px] font-heading text-primary uppercase flex items-center gap-1"><Plus className="w-3 h-3" /> Record Player Performance</h5>
                            <div className="flex flex-wrap gap-2 items-end">
                              <div className="space-y-1">
                                <label className="text-[9px] text-muted-foreground uppercase">Player</label>
                                <select className="bg-secondary/50 border border-border rounded-md px-2 py-1 text-xs focus:outline-none w-32" value={perfPlayerId} onChange={(e) => setPerfPlayerId(e.target.value)}>
                                  <option value="">Select</option>
                                  {playerMembers.sort((a,b) => a.name.localeCompare(b.name)).map(m => {
                                    const isRecorded = recordedPlayerIds.includes(m.id);
                                    const wasInLastMatch = lastMatchPlayerIds.includes(m.id);
                                    return (
                                      <option key={m.id} value={m.id} className={isRecorded ? "text-muted-foreground opacity-50" : ""}>
                                        {m.name} {isRecorded ? " (Done)" : wasInLastMatch ? " ⭐" : ""}
                                      </option>
                                    );
                                  })}
                                </select>
                              </div>

                              {perfPlayerId && (
                                <>
                                  {getPositionGroup(members.find(m => m.id === perfPlayerId)?.position) === "GK" ? (
                                    <>
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-muted-foreground uppercase">Saves</label>
                                        <Input type="number" className="w-12 h-7 text-xs p-1" value={perfSaves} onChange={(e) => setPerfSaves(e.target.value)} />
                                      </div>
                                      <div className="flex items-center gap-1 h-7 mb-1 bg-secondary/30 px-2 rounded">
                                        <Checkbox checked={perfCleanSheet} onCheckedChange={(val) => setPerfCleanSheet(!!val)} />
                                        <label className="text-[9px] text-muted-foreground uppercase">Clean Sheet</label>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-muted-foreground uppercase">Goals</label>
                                        <Input type="number" className="w-12 h-7 text-xs p-1" value={perfGoals} onChange={(e) => setPerfGoals(e.target.value)} />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-muted-foreground uppercase">Assists</label>
                                        <Input type="number" className="w-12 h-7 text-xs p-1" value={perfAssists} onChange={(e) => setPerfAssists(e.target.value)} />
                                      </div>
                                      <div className="space-y-1">
                                        <label className="text-[9px] text-muted-foreground uppercase">Tackles</label>
                                        <Input type="number" className="w-12 h-7 text-xs p-1" value={perfTackles} onChange={(e) => setPerfTackles(e.target.value)} />
                                      </div>
                                    </>
                                  )}
                                  <div className="space-y-1">
                                    <label className="text-[9px] text-muted-foreground uppercase">Rating</label>
                                    <select className="bg-secondary/50 border border-border rounded-md px-2 py-1 text-xs focus:outline-none h-7" value={perfRating} onChange={(e) => setPerfRating(e.target.value)}>
                                      {[10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6, 5.5, 5, 4.5, 4, 3, 2, 1].map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                  </div>
                                  <Button size="sm" className="h-7 text-[10px]" onClick={() => { setPerfGameId(game.id); handleAddMatchPerf(); }}>Record Stats</Button>
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg bg-secondary/5 border border-dashed border-border text-center">
                            <p className="text-[10px] text-muted-foreground font-body italic">Performance stat recording is limited to Officials & Captains.</p>
                          </div>
                        )}

                        {/* Player Stats Grid */}
                        <div className="space-y-3 pt-2">
                           <h5 className="text-[10px] font-heading text-primary uppercase flex items-center gap-1"><BarChart3 className="w-3 h-3" /> Player Performances</h5>
                           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                              {matchPerformances.filter(p => p.gameId === game.id).map(perf => {
                                const m = members.find(mem => mem.id === perf.playerId);
                                return (
                                  <div key={perf.id} className={`p-2 rounded-lg border flex flex-col relative ${perf.is_potm ? "bg-primary/5 border-primary/40 shadow-[0_0_10px_rgba(25,55,105,0.1)]" : "bg-card border-border/60"}`}>
                                    {perf.is_potm && <Badge className="absolute -top-2 -right-2 bg-primary text-[8px] h-4">POTM</Badge>}
                                    <span className="font-heading text-[11px] text-foreground truncate mb-1">{m?.name || "Player"}</span>
                                    <div className="flex items-center justify-between">
                                      <div className="flex gap-1.5 items-center">
                                        {(perf.goals > 0) && <span className="text-[9px] text-muted-foreground flex items-center gap-0.5"><Target className="w-2.5 h-2.5 text-primary" /> {perf.goals}</span>}
                                        {(perf.assists > 0) && <span className="text-[9px] text-muted-foreground flex items-center gap-0.5"><Footprints className="w-2.5 h-2.5 text-primary" /> {perf.assists}</span>}
                                        {(perf.saves > 0) && <span className="text-[9px] text-muted-foreground flex items-center gap-0.5"><Hand className="w-2.5 h-2.5 text-primary" /> {perf.saves}</span>}
                                      </div>
                                      <span className="text-[10px] font-heading text-primary">{perf.rating.toFixed(1)}</span>
                                    </div>
                                  </div>
                                );
                              })}
                           </div>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Attendance Grid (Officials/Captains) */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="bg-card border-border card-glow overflow-hidden">
            <CardHeader className="bg-secondary/5 border-b border-border/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><CheckCircle className="w-5 h-5 text-primary" /> Attendance Registry</CardTitle>
                <p className="text-xs text-muted-foreground font-body mt-1 italic">Week starting: {currentWeekStart}</p>
              </div>
              {canManageAttendance && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => markDayNoActivity("Monday")}>No Session Mon</Button>
                  <Button variant="outline" size="sm" className="h-8 text-[10px]" onClick={() => markDayNoActivity("Wednesday")}>No Session Wed</Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-xs">
                  <thead className="bg-secondary/20 border-b border-border">
                    <tr>
                      <th className="p-3 text-left font-heading text-primary uppercase tracking-wider sticky left-0 bg-card z-10 w-40">Member Name</th>
                      {DAYS.map(day => (
                        <th key={day} className="p-3 text-center font-heading text-muted-foreground uppercase tracking-tight w-24 border-l border-border/50">
                          {day.slice(0, 3)}
                        </th>
                      ))}
                      <th className="p-3 text-center font-heading text-primary w-16 border-l border-border/50 bg-secondary/10">%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {playerMembersForGrids.sort((a,b) => a.name.localeCompare(b.name)).map((m) => {
                      const mAtt = attendance.filter(a => a.playerId === m.id);
                      const pct = calcAttendancePct(mAtt);
                      return (
                        <tr key={m.id} className="hover:bg-secondary/5 transition-colors group">
                          <td className="p-3 font-heading text-foreground sticky left-0 bg-card/95 z-10 backdrop-blur-sm shadow-[5px_0_10px_-5px_rgba(0,0,0,0.1)]">
                            <div className="flex flex-col">
                              <span className="truncate">{m.name}</span>
                              <span className="text-[9px] text-muted-foreground font-body">{maskId(m.id)}</span>
                            </div>
                          </td>
                          {DAYS.map(day => {
                            const record = mAtt.find(a => a.day === day);
                            const status = record?.status || "absent";
                            return (
                              <td key={day} className="p-2 text-center border-l border-border/30">
                                {canManageAttendance ? (
                                  <div className="flex justify-center">
                                    <button
                                      onClick={() => updateAttendance(m.id, day, status === "present" ? "absent" : status === "absent" ? "excused" : "present")}
                                      disabled={status === "no_activity"}
                                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                        status === "present" ? "bg-green-600 text-white shadow-lg shadow-green-900/20" :
                                        status === "excused" ? "bg-yellow-600 text-white shadow-lg shadow-yellow-900/20" :
                                        status === "no_activity" ? "bg-muted text-muted-foreground/50" :
                                        "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                                      }`}>
                                      {status === "present" ? <CheckCircle className="w-4 h-4" /> :
                                       status === "excused" ? <Flame className="w-4 h-4" /> :
                                       status === "no_activity" ? <XCircle className="w-4 h-4" /> :
                                       <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />}
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex justify-center">
                                    {status === "present" ? <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" /> :
                                     status === "excused" ? <div className="w-2 h-2 rounded-full bg-yellow-500" /> :
                                     status === "no_activity" ? <XCircle className="w-3 h-3 text-muted-foreground/30" /> :
                                     <div className="w-2 h-2 rounded-full bg-secondary/50" />}
                                  </div>
                                )}
                              </td>
                            );
                          })}
                          <td className="p-3 text-center border-l border-border/30 bg-secondary/10">
                            <span className={`font-heading ${pct >= 80 ? "text-green-500" : pct >= 50 ? "text-yellow-500" : "text-red-500"}`}>{pct}%</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-4 bg-secondary/5 border-t border-border flex items-center justify-center gap-6 text-[10px] text-muted-foreground font-body">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-600" /> Present</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-600" /> Excused</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-secondary/50" /> Absent</div>
                <div className="flex items-center gap-1.5"><XCircle className="w-3 h-3 text-muted-foreground/30" /> No Session</div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contribution Grid (Fadhir/Admin) */}
        {showContributions && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <Card className="bg-card border-border card-glow overflow-hidden">
               <CardHeader className="bg-secondary/5 border-b border-border/50">
                 <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /> Monthly Contributions Tracking</CardTitle>
                 <p className="text-xs text-muted-foreground font-body mt-1 italic">Click status badges to toggle payment records.</p>
               </CardHeader>
               <CardContent className="p-0">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-xs">
                       <thead className="bg-secondary/20 border-b border-border">
                         <tr>
                            <th className="p-3 text-left font-heading text-primary uppercase tracking-wider sticky left-0 bg-card z-10 w-40">Member Name</th>
                            {contributionMonths.map(m => (
                              <th key={m.key} className="p-3 text-center font-heading text-muted-foreground uppercase tracking-tight w-24 border-l border-border/50">{m.label}</th>
                            ))}
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-border">
                         {playerMembers.sort((a,b) => a.name.localeCompare(b.name)).map((m) => (
                           <tr key={m.id} className="hover:bg-secondary/5 transition-colors group">
                             <td className="p-3 font-heading text-foreground sticky left-0 bg-card/95 z-10 backdrop-blur-sm shadow-[5px_0_10px_-5px_rgba(0,0,0,0.1)]">
                               <div className="flex flex-col">
                                 <span className="truncate">{m.name}</span>
                                 <span className="text-[9px] text-muted-foreground font-body">{maskId(m.id)}</span>
                               </div>
                             </td>
                             {contributionMonths.map(month => {
                               const status = m.contributions[month.key] || "unpaid";
                               return (
                                 <td key={month.key} className="p-2 text-center border-l border-border/30">
                                   <Badge
                                     onClick={() => canApproveContributions && updateContributionDirect(m.id, month.key, status === "paid" ? "unpaid" : "paid")}
                                     className={`text-[9px] h-5 min-w-14 cursor-pointer transition-all ${
                                       status === "paid" ? "bg-green-600 hover:bg-green-700 text-white shadow-[0_2px_10px_rgba(22,163,74,0.2)]" :
                                       status === "pending" ? "bg-yellow-600/30 text-yellow-600 animate-pulse" :
                                       "bg-red-600/10 text-red-600/50 hover:text-red-600"
                                     }`}>
                                     {status.toUpperCase()}
                                   </Badge>
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
          </motion.div>
        )}

        {/* Additional Management Tabs (Manager/Fadhir) */}
        {(isManager || isFadhir || isCaptain) && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Tabs defaultValue="events" className="w-full">
              <TabsList className="bg-secondary/30 border border-border w-full justify-start overflow-x-auto p-1 h-auto flex flex-wrap">
                <TabsTrigger value="events" className="font-heading text-xs uppercase data-[state=active]:bg-card data-[state=active]:card-glow h-10 px-6">Special Events</TabsTrigger>
                <TabsTrigger value="lineup" className="font-heading text-xs uppercase data-[state=active]:bg-card data-[state=active]:card-glow h-10 px-6">Lineup Builder</TabsTrigger>
                <TabsTrigger value="league" className="font-heading text-xs uppercase data-[state=active]:bg-card data-[state=active]:card-glow h-10 px-6">League Standings</TabsTrigger>
                <TabsTrigger value="amateur" className="font-heading text-xs uppercase data-[state=active]:bg-card data-[state=active]:card-glow h-10 px-6">Amateur League</TabsTrigger>
              </TabsList>

              <TabsContent value="events" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contribution Events (Funding) */}
                  <Card className="bg-card border-border card-glow h-fit">
                    <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><DollarSign className="w-5 h-5 text-primary" /> Special Funding Tracks</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {canManageContribEvents && (
                        <div className="space-y-3 p-4 rounded-xl bg-secondary/10 border border-border">
                          <Input placeholder="Event Title (e.g. New Jersey Fund)" value={ceTitle} onChange={(e) => setCeTitle(e.target.value)} className="bg-secondary/50 font-body text-sm h-9" />
                          <Input placeholder="Description" value={ceDesc} onChange={(e) => setCeDesc(e.target.value)} className="bg-secondary/50 font-body text-sm h-9" />
                          <div className="grid grid-cols-2 gap-2">
                            <Input placeholder="Amount/Person" value={ceAmountPer} onChange={(e) => setCeAmountPer(e.target.value)} className="bg-secondary/50 font-body text-sm h-9" />
                            <Input placeholder="Goal Target" value={ceTarget} onChange={(e) => setCeTarget(e.target.value)} className="bg-secondary/50 font-body text-sm h-9" />
                          </div>
                          <Button onClick={handleAddContribEvent} className="w-full font-body h-9" disabled={!ceTitle || !ceAmountPer || !ceTarget}><Plus className="w-4 h-4 mr-1" /> Create Event</Button>
                        </div>
                      )}

                      <div className="space-y-6">
                        {contribEvents.map(e => {
                          const payments = contribPayments.filter(p => p.event_id === e.id && p.paid);
                          const totalRaised = payments.length * (e.amount_per_person || 0);
                          const progress = Math.min((totalRaised / (e.target_amount || 1)) * 100, 100);
                          return (
                            <div key={e.id} className="space-y-3 p-4 rounded-xl bg-secondary/5 border border-border relative group">
                              {canManageContribEvents && <Button variant="ghost" size="sm" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-destructive" onClick={() => deleteContribEvent(e.id)}><Trash2 className="w-3 h-3" /></Button>}
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-heading text-sm text-foreground">{e.title}</h4>
                                  <p className="text-[10px] text-muted-foreground font-body">{e.goal_description}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs font-heading text-primary">KSh {totalRaised.toLocaleString()} / {e.target_amount.toLocaleString()}</p>
                                  <p className="text-[10px] text-muted-foreground font-body">{payments.length} paid so far</p>
                                </div>
                              </div>
                              <Progress value={progress} className="h-2 bg-secondary" />
                              <Accordion type="single" collapsible>
                                <AccordionItem value="members" className="border-none">
                                  <AccordionTrigger className="text-[10px] font-heading text-primary uppercase h-6 py-0 hover:no-underline">Manage Member Payments</AccordionTrigger>
                                  <AccordionContent>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                                      {playerMembers.sort((a,b) => a.name.localeCompare(b.name)).map(m => {
                                        const isPaid = contribPayments.some(p => p.event_id === e.id && p.member_id === m.id && p.paid);
                                        return (
                                          <div key={m.id} className={`p-2 rounded-lg border text-center cursor-pointer transition-all ${isPaid ? "bg-green-600/20 border-green-600/40" : "bg-secondary/20 border-border"}`} onClick={() => canManageContribEvents && toggleContribPayment(e.id, m.id)}>
                                            <p className="text-[10px] font-heading truncate text-foreground">{m.name}</p>
                                            <p className={`text-[8px] font-body ${isPaid ? "text-green-500" : "text-muted-foreground"}`}>{isPaid ? "PAID" : "UNPAID"}</p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Calendar Events */}
                  <Card className="bg-card border-border card-glow h-fit">
                    <CardHeader><CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-primary" /> Management Calendar</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {isManager && (
                        <div className="space-y-3 p-4 rounded-xl bg-secondary/10 border border-border">
                          <div className="grid grid-cols-2 gap-2">
                            <Input placeholder="Event Title" value={newEventTitle} onChange={(e) => setNewEventTitle(e.target.value)} className="bg-secondary/50 font-body text-sm h-9" />
                            <Input type="date" value={newEventDate} onChange={(e) => setNewEventDate(e.target.value)} className="bg-secondary/50 font-body text-sm h-9" />
                          </div>
                          <Input placeholder="Description (optional)" value={newEventDesc} onChange={(e) => setNewEventDesc(e.target.value)} className="bg-secondary/50 font-body text-sm h-9" />
                          <Button onClick={addEvent} className="w-full font-body h-9" disabled={!newEventTitle || !newEventDate}><Plus className="w-4 h-4 mr-1" /> Schedule Event</Button>
                        </div>
                      )}
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {calendarEvents.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(e => (
                          <div key={e.id} className="p-3 rounded-lg bg-secondary/5 border border-border flex justify-between items-center group">
                            <div>
                              <p className="text-xs font-heading text-foreground">{e.title}</p>
                              <p className="text-[10px] text-muted-foreground font-body">{format(new Date(e.date), "EEE, MMM d")}</p>
                            </div>
                            <CalendarIcon className="w-4 h-4 text-primary opacity-20" />
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="lineup" className="mt-6">
                <Card className="bg-card border-border card-glow overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Gamepad2 className="w-5 h-5 text-primary" /> Tactical Lineup Builder</CardTitle>
                      <p className="text-xs text-muted-foreground font-body">Drag and drop players to set the formation for next match.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={exportFirst11Pdf} className="h-8 text-xs font-body"><Download className="w-3 h-3 mr-1" /> Export Lineup</Button>
                  </CardHeader>
                  <CardContent className="p-0 border-t border-border/50 bg-secondary/5">
                    <div className="p-4 md:p-8">
                       <LineupBuilder players={playerMembers} selectedStarters={selectedFirst11} onStartersChange={setSelectedFirst11} selectedSubs={selectedSubs} onSubsChange={setSelectedSubs} />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="league" className="mt-6">
                <Card className="bg-card border-border card-glow">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Trophy className="w-5 h-5 text-primary" /> League Standings</CardTitle>
                      <p className="text-xs text-muted-foreground font-body mt-1 italic">Real-time table synchronization.</p>
                    </div>
                    {isManager && (
                      <Dialog>
                        <DialogTrigger asChild><Button size="sm" className="font-body"><Plus className="w-3 h-3 mr-1" /> Add Team</Button></DialogTrigger>
                        <DialogContent className="bg-card border-border">
                          <DialogHeader><DialogTitle className="font-heading text-primary">Add New League Rival</DialogTitle></DialogHeader>
                          <div className="space-y-4 py-4">
                            <Input placeholder="Team Name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} className="bg-secondary/50 font-body" />
                            <Button onClick={() => handleAddLeagueTeam("league")} className="w-full font-heading" disabled={!newTeamName}>Add to Standings</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-xs font-body">
                        <thead className="bg-secondary/20 border-b border-border">
                          <tr className="text-muted-foreground font-heading uppercase tracking-tighter">
                            <th className="p-3 text-left w-8">#</th>
                            <th className="p-3 text-left">Team Name</th>
                            <th className="p-3 text-center">P</th>
                            <th className="p-3 text-center">W</th>
                            <th className="p-3 text-center">D</th>
                            <th className="p-3 text-center">L</th>
                            <th className="p-3 text-center">GD</th>
                            <th className="p-3 text-center font-heading text-primary">PTS</th>
                            {isManager && <th className="p-3 text-right">Actions</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {leagueTeamsMain.map((t, i) => (
                            <React.Fragment key={t.id}>
                              <tr className={`transition-colors ${t.is_own_team ? "bg-primary/5 font-bold" : "hover:bg-secondary/10"}`}>
                                <td className="p-3 text-muted-foreground">{i + 1}</td>
                                <td className="p-3 flex items-center gap-2">
                                  {t.team_name}
                                  {t.is_own_team && <Badge variant="secondary" className="bg-primary/20 text-[8px] h-4 py-0 uppercase">Our Club</Badge>}
                                </td>
                                <td className="p-3 text-center">{t.played}</td>
                                <td className="p-3 text-center">{t.won}</td>
                                <td className="p-3 text-center">{t.drawn}</td>
                                <td className="p-3 text-center">{t.lost}</td>
                                <td className="p-3 text-center font-heading">{t.goal_difference > 0 ? `+${t.goal_difference}` : t.goal_difference}</td>
                                <td className="p-3 text-center font-heading text-primary text-sm">{t.points}</td>
                                {isManager && (
                                  <td className="p-3 text-right space-x-1">
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditingTeamId(editingTeamId === t.id ? null : t.id); setEditTeamData({ played: t.played, won: t.won, drawn: t.drawn, lost: t.lost, gd: t.goal_difference, pts: t.points }); }}><Edit className="w-3 h-3" /></Button>
                                    {!t.is_own_team && <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDeleteLeagueTeam(t.id)}><Trash2 className="w-3 h-3" /></Button>}
                                  </td>
                                )}
                              </tr>
                              {editingTeamId === t.id && (
                                <tr><td colSpan={isManager ? 9 : 8} className="p-0 px-3 pb-3 border-none"><EditTeamForm team={t} onSave={handleSaveLeagueTeam} onCancel={() => setEditingTeamId(null)} /></td></tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="amateur" className="mt-6">
                <Card className="bg-card border-border card-glow">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="font-heading text-lg text-foreground flex items-center gap-2"><Trophy className="w-5 h-5 text-yellow-500" /> Amateur Standings</CardTitle>
                      <p className="text-xs text-muted-foreground font-body mt-1 italic">Managing amateur league rivalries.</p>
                    </div>
                    {isManager && (
                      <Dialog>
                        <DialogTrigger asChild><Button size="sm" className="font-body border-yellow-500/50 text-yellow-500" variant="outline"><Plus className="w-3 h-3 mr-1" /> Add Amateur Team</Button></DialogTrigger>
                        <DialogContent className="bg-card border-border">
                          <DialogHeader><DialogTitle className="font-heading text-yellow-500">Add Amateur Team</DialogTitle></DialogHeader>
                          <div className="space-y-4 py-4">
                            <Input placeholder="Team Name" value={newAmateurTeamName} onChange={(e) => setNewAmateurTeamName(e.target.value)} className="bg-secondary/50 font-body" />
                            <Button onClick={() => handleAddLeagueTeam("amateur")} className="w-full font-heading bg-yellow-600 hover:bg-yellow-700" disabled={!newAmateurTeamName}>Add Team</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto custom-scrollbar">
                      <table className="w-full text-xs font-body">
                        <thead className="bg-secondary/20 border-b border-border">
                          <tr className="text-muted-foreground font-heading uppercase tracking-tighter">
                            <th className="p-3 text-left w-8">#</th>
                            <th className="p-3 text-left">Team Name</th>
                            <th className="p-3 text-center">P</th>
                            <th className="p-3 text-center">W</th>
                            <th className="p-3 text-center">D</th>
                            <th className="p-3 text-center">L</th>
                            <th className="p-3 text-center">GD</th>
                            <th className="p-3 text-center font-heading text-yellow-500">PTS</th>
                            {isManager && <th className="p-3 text-right">Actions</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {leagueTeamsAmateur.map((t, i) => (
                            <React.Fragment key={t.id}>
                              <tr className={`transition-colors ${t.is_own_team ? "bg-yellow-500/5 font-bold border-l-2 border-yellow-500" : "hover:bg-secondary/10"}`}>
                                <td className="p-3 text-muted-foreground">{i + 1}</td>
                                <td className="p-3 flex items-center gap-2">{t.team_name} {t.is_own_team && <Badge variant="outline" className="text-[8px] h-4 border-yellow-500/50 text-yellow-500 uppercase">Amateur Team</Badge>}</td>
                                <td className="p-3 text-center">{t.played}</td>
                                <td className="p-3 text-center">{t.won}</td>
                                <td className="p-3 text-center">{t.drawn}</td>
                                <td className="p-3 text-center">{t.lost}</td>
                                <td className="p-3 text-center font-heading">{t.goal_difference > 0 ? `+${t.goal_difference}` : t.goal_difference}</td>
                                <td className="p-3 text-center font-heading text-yellow-500 text-sm">{t.points}</td>
                                {isManager && (
                                  <td className="p-3 text-right space-x-1">
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => { setEditingAmateurTeamId(editingAmateurTeamId === t.id ? null : t.id); setEditAmateurTeamData({ played: t.played, won: t.won, drawn: t.drawn, lost: t.lost, gd: t.goal_difference, pts: t.points }); }}><Edit className="w-3 h-3" /></Button>
                                    {!t.is_own_team && <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleDeleteLeagueTeam(t.id)}><Trash2 className="w-3 h-3" /></Button>}
                                  </td>
                                )}
                              </tr>
                              {editingAmateurTeamId === t.id && (
                                <tr><td colSpan={isManager ? 9 : 8} className="p-0 px-3 pb-3 border-none"><EditTeamForm team={t} onSave={handleSaveAmateurTeam} onCancel={() => setEditingAmateurTeamId(null)} /></td></tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </main>

      {/* Global Dialogs */}
      <Dialog open={showRemoveConfirm} onOpenChange={setShowRemoveConfirm}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-heading text-destructive uppercase">Confirm Member Removal</DialogTitle></DialogHeader>
          <div className="py-4 font-body text-sm text-foreground">Are you sure you want to remove this member from the club database? This action is permanent.</div>
          <DialogFooter><Button variant="ghost" onClick={() => setShowRemoveConfirm(false)}>Cancel</Button><Button variant="destructive" onClick={handleRemovePlayer}>Confirm Removal</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={!!replyTo} onOpenChange={() => setReplyTo(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader><DialogTitle className="font-heading text-primary">Reply to Message</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea placeholder="Type your reply..." value={replyContent} onChange={(e) => setReplyContent(e.target.value)} className="bg-secondary/50 font-body min-h-[120px]" />
            <Button onClick={handleReply} className="w-full font-heading" disabled={!replyContent.trim()}><Send className="w-4 h-4 mr-2" /> Send Reply</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OfficialProfile;
