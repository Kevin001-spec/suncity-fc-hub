import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { compressAndConvertToWebP } from "@/lib/image-compression";
import {
  allMembers as fallbackMembers,
  contributionMonths,
  CONTRIBUTION_AMOUNT,
  type TeamMember,
  type GameScore,
  type CalendarEvent,
  type FinancialRecord,
  type MediaItem,
  type PendingApproval,
  type MatchPerformance,
  type Message,
  type WeeklyStatsLog,
  type GameStats,
  type PlayerGameLog,
} from "@/data/team-data";

interface LineupPosition {
  positionId: string;
  playerId: string | null;
  label: string;
}

interface AttendanceEntry {
  playerId: string;
  day: string;
  status: string;
}

interface HomepageImage {
  id: string;
  url: string;
  sortOrder: number;
}

interface TeamDataContextType {
  members: TeamMember[];
  gameScores: GameScore[];
  calendarEvents: CalendarEvent[];
  financialRecords: FinancialRecord[];
  mediaItems: MediaItem[];
  pendingApprovals: PendingApproval[];
  lineup: LineupPosition[];
  profilePics: Record<string, string>;
  attendance: AttendanceEntry[];
  currentWeekStart: string;
  homepageImages: HomepageImage[];
  matchPerformances: MatchPerformance[];
  messages: Message[];
  weeklyStatsLogs: WeeklyStatsLog[];
  gameStats: GameStats[];
  playerGameLogs: PlayerGameLog[];

  addGameScore: (score: Omit<GameScore, "id">) => Promise<any>;
  deleteGameScore: (id: string) => void;
  updateGameScore: (id: string, data: Partial<GameScore>) => void;
  addCalendarEvent: (event: Omit<CalendarEvent, "id">) => void;
  addMediaItems: (items: Omit<MediaItem, "id">[]) => void;
  requestContribution: (playerId: string, playerName: string, monthKey: string, monthLabel: string) => void;
  approveContribution: (approvalId: string) => void;
  rejectContribution: (approvalId: string) => void;
  addFinancialTransaction: (month: string, description: string, amount: number, date: string, type: "in" | "out") => void;
  updatePlayerStats: (playerId: string, stats: Record<string, number>) => void;
  setProfilePic: (memberId: string, dataUrl: string) => void;
  setExcused: (playerId: string, excused: boolean, excusedType?: string, excusedDays?: string[]) => void;
  updateLineup: (lineup: LineupPosition[]) => void;
  updateContributionDirect: (memberId: string, monthKey: string, status: "paid" | "unpaid") => void;
  updateAttendance: (playerId: string, day: string, status: string) => void;
  markDayNoActivity: (day: string) => void;
  uploadMediaToStorage: (files: File[], uploadedBy: string) => Promise<void>;
  uploadProfilePicToStorage: (memberId: string, file: File) => Promise<string | null>;
  deleteMediaItem: (itemId: string, url: string) => Promise<void>;
  removePlayer: (playerId: string) => Promise<void>;
  addPlayer: (name: string, squadNumber: number, position: string, role?: string) => Promise<string>;
  uploadHomepageImages: (files: File[]) => Promise<void>;
  deleteHomepageImage: (imageId: string, url: string) => Promise<void>;
  addMatchPerformance: (perf: Omit<MatchPerformance, "id">) => Promise<void>;
  sendMessage: (fromId: string, toId: string, content: string) => Promise<void>;
  markMessageRead: (messageId: string) => Promise<void>;
  updateFanBadge: (fanId: string, badge: string) => Promise<void>;
  updateFanPoints: (fanId: string, points: number) => Promise<void>;
  updateFavouriteMoment: (fanId: string, moment: string) => Promise<void>;
  updateMemberRole: (memberId: string, newRole: string) => Promise<void>;
  recordTrainingMatch: (match: { teamAScore: number; teamBScore: number; performances: any[] }) => Promise<void>;
  loadWeeklyStatsLogs: (playerId: string) => Promise<WeeklyStatsLog[]>;
  saveGameStats: (gameId: string, half: string, stats: Omit<GameStats, "id" | "gameId" | "half">) => Promise<void>;
  loadPlayerGameLogs: (playerId: string) => Promise<PlayerGameLog[]>;
  refreshData: () => void;
}

const TeamDataContext = createContext<TeamDataContextType | null>(null);

function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.getFullYear(), now.getMonth(), diff);
  return monday.toISOString().split("T")[0];
}

export function TeamDataProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<TeamMember[]>(fallbackMembers);
  const [gameScores, setGameScores] = useState<GameScore[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [lineup, setLineup] = useState<LineupPosition[]>([]);
  const [profilePics, setProfilePics] = useState<Record<string, string>>({});
  const [attendance, setAttendance] = useState<AttendanceEntry[]>([]);
  const [homepageImages, setHomepageImages] = useState<HomepageImage[]>([]);
  const [matchPerformances, setMatchPerformances] = useState<MatchPerformance[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [weeklyStatsLogs, setWeeklyStatsLogs] = useState<WeeklyStatsLog[]>([]);
  const [gameStats, setGameStats] = useState<GameStats[]>([]);
  const [playerGameLogs, setPlayerGameLogs] = useState<PlayerGameLog[]>([]);
  const currentWeekStart = getWeekStart();

  // ===== THURSDAY STAT RESET WITH ARCHIVAL =====
  const checkAndResetWeeklyStats = useCallback(async (loadedMembers: TeamMember[]) => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 5=Fri, 6=Sat
    // Reset happens on Friday (5), Saturday (6), or Sunday (0)
    if (dayOfWeek !== 5 && dayOfWeek !== 6 && dayOfWeek !== 0) return;

    const playerMembers = loadedMembers.filter(m => m.role === "player" || m.role === "captain" || m.role === "finance");
    if (playerMembers.length === 0) return;

    // Check if we already archived this week
    const { data: existingLogs } = await supabase.from("weekly_stats_log")
      .select("player_id").eq("week_start", currentWeekStart);
    
    const archivedPlayerIds = new Set((existingLogs || []).map((l: any) => l.player_id));

    for (const member of playerMembers) {
      // Skip if already archived this week
      if (archivedPlayerIds.has(member.id)) continue;
      
      // Check if there are any non-zero stats to archive
      const hasStats = (member.goals || 0) > 0 || (member.assists || 0) > 0 || 
        (member.gamesPlayed || 0) > 0 || (member.saves || 0) > 0 ||
        (member.cleanSheets || 0) > 0 || (member.aerialDuels || 0) > 0 ||
        (member.tackles || 0) > 0 || (member.interceptions || 0) > 0 ||
        (member.blocks || 0) > 0 || (member.clearances || 0) > 0 ||
        (member.successfulTackles || 0) > 0 || (member.directTargets || 0) > 0 ||
        (member.directShots || 0) > 0;
      
      if (!hasStats) continue;

      // Archive current stats to weekly_stats_log
      await supabase.from("weekly_stats_log").insert({
        player_id: member.id,
        week_start: currentWeekStart,
        goals: member.goals || 0,
        assists: member.assists || 0,
        games_played: member.gamesPlayed || 0,
        saves: member.saves || 0,
        clean_sheets: member.cleanSheets || 0,
        aerial_duels: member.aerialDuels || 0,
        tackles: member.tackles || 0,
        interceptions: member.interceptions || 0,
        blocks: member.blocks || 0,
        clearances: member.clearances || 0,
        successful_tackles: member.successfulTackles || 0,
        direct_targets: member.directTargets || 0,
        direct_shots: member.directShots || 0,
      } as any);

      // Reset stats to 0 in members table
      await supabase.from("members").update({
        goals: 0, assists: 0, games_played: 0, saves: 0,
        clean_sheets: 0, aerial_duels: 0, tackles: 0, interceptions: 0,
        blocks: 0, clearances: 0, successful_tackles: 0, direct_targets: 0, direct_shots: 0,
      } as any).eq("id", member.id);
    }
  }, [currentWeekStart]);

  // ===== LOAD ALL DATA FROM SUPABASE =====
  const loadMembers = useCallback(async () => {
    const { data } = await supabase.from("members_safe" as any).select("*");
    if (data && data.length > 0) {
      const { data: contribs } = await supabase.from("contributions").select("*");
      const contribMap: Record<string, Record<string, string>> = {};
      contribs?.forEach((c: any) => {
        if (!contribMap[c.member_id]) contribMap[c.member_id] = {};
        contribMap[c.member_id][c.month_key] = c.status;
      });

      const mapped: TeamMember[] = data.map((m: any) => ({
        id: m.id, name: m.name, role: m.role as any,
        username: m.username, pin: m.pin, phone: m.phone,
        squadNumber: m.squad_number, position: m.position,
        goals: m.goals, assists: m.assists, gamesPlayed: m.games_played,
        saves: m.saves || 0, cleanSheets: m.clean_sheets || 0, aerialDuels: m.aerial_duels || 0,
        tackles: m.tackles || 0, interceptions: m.interceptions || 0, blocks: m.blocks || 0, clearances: m.clearances || 0,
        successfulTackles: (m as any).successful_tackles || 0, directTargets: (m as any).direct_targets || 0, directShots: (m as any).direct_shots || 0,
        excused: m.excused, excusedType: m.excused_type, excusedDays: m.excused_days,
        profilePic: m.profile_pic_url,
        fanBadge: (m as any).fan_badge || null,
        fanPoints: (m as any).fan_points || 0,
        favouriteMoment: (m as any).favourite_moment || null,
        contributions: (contribMap[m.id] || {}) as Record<string, "paid" | "pending" | "unpaid">,
      }));
      setMembers(mapped);
      const pics: Record<string, string> = {};
      mapped.forEach((m) => { if (m.profilePic) pics[m.id] = m.profilePic; });
      setProfilePics(pics);
      return mapped;
    }
    return null;
  }, []);

  const loadGameScores = useCallback(async () => {
    const { data } = await supabase.from("game_scores").select("*").order("created_at", { ascending: false });
    if (data) {
      const { data: scorers } = await supabase.from("game_scorers").select("*");
      const scorerMap: Record<string, string[]> = {};
      scorers?.forEach((s: any) => {
        if (!scorerMap[s.game_id]) scorerMap[s.game_id] = [];
        scorerMap[s.game_id].push(s.player_id);
      });
      setGameScores(data.map((g: any) => ({
        id: g.id, date: g.date, opponent: g.opponent,
        ourScore: g.our_score, theirScore: g.their_score,
        scorers: scorerMap[g.id] || [],
        gameType: (g as any).game_type || "friendly",
        venue: (g as any).venue || null,
      })));
    }
  }, []);

  const loadCalendarEvents = useCallback(async () => {
    const { data } = await supabase.from("calendar_events").select("*").order("date", { ascending: true });
    if (data) setCalendarEvents(data.map((e: any) => ({ id: e.id, date: e.date, title: e.title, description: e.description || "" })));
  }, []);

  const loadFinancialRecords = useCallback(async () => {
    const { data: records } = await supabase.from("financial_records").select("*").order("created_at", { ascending: true });
    const { data: expenses } = await supabase.from("financial_expenses").select("*");
    if (records) {
      const expenseMap: Record<string, { description: string; amount: number; date: string }[]> = {};
      expenses?.forEach((e: any) => {
        if (!expenseMap[e.record_id]) expenseMap[e.record_id] = [];
        expenseMap[e.record_id].push({ description: e.description, amount: Number(e.amount), date: e.date });
      });
      const monthOrder = ["Dec 2025", "Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026"];
      const mapped = records.map((r: any) => ({
        id: r.id,
        month: r.month, contributors: r.contributors, contributorNote: r.contributor_note,
        openingBalance: Number(r.opening_balance), contributions: Number(r.contributions),
        expenses: expenseMap[r.id] || [], closingBalance: Number(r.closing_balance),
      }));
      mapped.sort((a: any, b: any) => {
        const ai = monthOrder.indexOf(a.month);
        const bi = monthOrder.indexOf(b.month);
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      });
      setFinancialRecords(mapped);
    }
  }, []);

  const loadMediaItems = useCallback(async () => {
    const { data } = await supabase.from("media_items").select("*").order("created_at", { ascending: false });
    if (data) setMediaItems(data.map((m: any) => ({ id: m.id, url: m.url, caption: m.caption, date: m.date, uploadedBy: m.uploaded_by })));
  }, []);

  const loadPendingApprovals = useCallback(async () => {
    const { data } = await supabase.from("pending_approvals").select("*").order("requested_at", { ascending: false });
    if (data) setPendingApprovals(data.map((a: any) => ({
      id: a.id, playerId: a.player_id, playerName: a.player_name,
      monthKey: a.month_key, monthLabel: a.month_label, requestedAt: a.requested_at,
    })));
  }, []);

  const loadLineup = useCallback(async () => {
    const { data } = await supabase.from("lineup_positions").select("*");
    if (data) setLineup(data.map((p: any) => ({ positionId: p.position_id, playerId: p.player_id, label: p.label })));
  }, []);

  const loadAttendance = useCallback(async () => {
    const { data } = await supabase.from("attendance").select("*").eq("week_start", currentWeekStart);
    if (data) setAttendance(data.map((a: any) => ({ playerId: a.player_id, day: a.day, status: a.status })));
  }, [currentWeekStart]);

  const loadHomepageImages = useCallback(async () => {
    const { data } = await supabase.from("homepage_images").select("*").order("sort_order", { ascending: true });
    if (data) setHomepageImages(data.map((i: any) => ({ id: i.id, url: i.url, sortOrder: i.sort_order })));
  }, []);

  const loadMatchPerformances = useCallback(async () => {
    const { data } = await supabase.from("match_performances").select("*").order("created_at", { ascending: false });
    if (data) setMatchPerformances(data.map((p: any) => ({
      id: p.id, gameId: p.game_id, playerId: p.player_id,
      goals: p.goals, assists: p.assists, saves: p.saves,
      tackles: p.tackles, interceptions: p.interceptions, blocks: p.blocks,
      clearances: p.clearances, cleanSheet: p.clean_sheet, aerialDuels: p.aerial_duels,
      rating: Number(p.rating), isPotm: p.is_potm,
      directShots: p.direct_shots || 0,
    })));
  }, []);

  const loadMessages = useCallback(async () => {
    const { data } = await supabase.from("messages").select("*").order("created_at", { ascending: false });
    if (data) setMessages(data.map((m: any) => ({
      id: m.id, fromId: m.from_id, toId: m.to_id,
      content: m.content, read: m.read, createdAt: m.created_at,
    })));
  }, []);

  const loadGameStats = useCallback(async () => {
    const { data } = await supabase.from("game_stats").select("*");
    if (data) setGameStats(data.map((s: any) => ({
      id: s.id, gameId: s.game_id, half: s.half,
      shots: s.shots, shotsOnTarget: s.shots_on_target, penalties: s.penalties,
      freekicks: s.freekicks, cornerKicks: s.corner_kicks, fouls: s.fouls,
      offsides: s.offsides, yellowCards: s.yellow_cards, redCards: s.red_cards,
    })));
  }, []);

  const refreshData = useCallback(() => {
    loadMembers().then((loaded) => {
      if (loaded) checkAndResetWeeklyStats(loaded);
    });
    loadGameScores(); loadCalendarEvents(); loadFinancialRecords();
    loadMediaItems(); loadPendingApprovals(); loadLineup(); loadAttendance();
    loadHomepageImages(); loadMatchPerformances(); loadMessages(); loadGameStats();
  }, [loadMembers, loadGameScores, loadCalendarEvents, loadFinancialRecords, loadMediaItems, loadPendingApprovals, loadLineup, loadAttendance, loadHomepageImages, loadMatchPerformances, loadMessages, loadGameStats, checkAndResetWeeklyStats]);

  useEffect(() => { refreshData(); }, [refreshData]);
  useEffect(() => {
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // ===== FINANCIAL RECALCULATION (CORE) =====
  const recalculateFinancialRecord = useCallback(async (monthLabel: string) => {
    const monthObj = contributionMonths.find((m) => m.label === monthLabel);
    if (!monthObj) return;
    const { count } = await supabase.from("contributions")
      .select("*", { count: "exact", head: true })
      .eq("month_key", monthObj.key).eq("status", "paid");
    const paidCount = count || 0;
    const contributionTotal = paidCount * CONTRIBUTION_AMOUNT;
    const { data: record } = await supabase.from("financial_records")
      .select("*").eq("month", monthLabel).single();
    if (record) {
      const { data: allExp } = await supabase.from("financial_expenses")
        .select("amount").eq("record_id", record.id);
      const expTotal = allExp?.reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0;
      const closingBalance = Number(record.opening_balance) + contributionTotal - expTotal;
      await supabase.from("financial_records").update({
        contributors: paidCount, contributions: contributionTotal, closing_balance: closingBalance,
      }).eq("id", record.id);
    }
  }, []);

  // ===== WRITE OPERATIONS =====
  const addGameScore = useCallback(async (score: Omit<GameScore, "id">) => {
    const { data, error } = await supabase.from("game_scores").insert({
      date: score.date, opponent: score.opponent, our_score: score.ourScore, their_score: score.theirScore,
      game_type: score.gameType || "friendly", venue: score.venue || null,
    } as any).select().single();
    if (data && score.scorers && score.scorers.length > 0) {
      const scorerInserts = score.scorers.map((pid) => ({ game_id: data.id, player_id: pid }));
      await supabase.from("game_scorers").insert(scorerInserts);
      for (const pid of score.scorers) {
        const goalsForPlayer = score.scorers.filter((s) => s === pid).length;
        const { data: memberData } = await supabase.from("members").select("goals, games_played").eq("id", pid).single();
        if (memberData) {
          await supabase.from("members").update({
            goals: ((memberData as any).goals || 0) + goalsForPlayer,
            games_played: ((memberData as any).games_played || 0) + 1,
          }).eq("id", pid);
          // Auto-link player to this game
          await supabase.from("player_game_log").upsert(
            { player_id: pid, game_id: data.id } as any,
            { onConflict: "player_id,game_id" }
          );
        }
      }
    }

    // Auto-update league/amateur standings if game_type is league or amateur
    if (data && score.gameType && (score.gameType === "league" || score.gameType === "amateur")) {
      const division = score.gameType === "league" ? "league" : "amateur";
      const { data: ownTeam } = await supabase.from("league_teams").select("*")
        .eq("is_own_team", true).eq("division", division).single();
      if (ownTeam) {
        const won = score.ourScore > score.theirScore ? 1 : 0;
        const drawn = score.ourScore === score.theirScore ? 1 : 0;
        const lost = score.ourScore < score.theirScore ? 1 : 0;
        const gdDelta = score.ourScore - score.theirScore;
        const ptsDelta = won * 3 + drawn;
        await supabase.from("league_teams").update({
          played: (ownTeam as any).played + 1,
          won: (ownTeam as any).won + won,
          drawn: (ownTeam as any).drawn + drawn,
          lost: (ownTeam as any).lost + lost,
          goal_difference: (ownTeam as any).goal_difference + gdDelta,
          points: (ownTeam as any).points + ptsDelta,
        } as any).eq("id", ownTeam.id);
      }
    }

    if (!error) { loadGameScores(); loadMembers(); }
    return data; // Return the created game for game stats form
  }, [loadGameScores, loadMembers]);

  const deleteGameScore = useCallback(async (id: string) => {
    await supabase.from("game_scorers").delete().eq("game_id", id);
    await supabase.from("match_performances").delete().eq("game_id", id);
    await supabase.from("game_stats").delete().eq("game_id", id);
    await supabase.from("player_game_log").delete().eq("game_id", id);
    await supabase.from("game_scores").delete().eq("id", id);
    loadGameScores(); loadMatchPerformances(); loadGameStats();
  }, [loadGameScores, loadMatchPerformances, loadGameStats]);

  const updateGameScore = useCallback(async (id: string, data: Partial<GameScore>) => {
    const updates: any = {};
    if (data.opponent !== undefined) updates.opponent = data.opponent;
    if (data.ourScore !== undefined) updates.our_score = data.ourScore;
    if (data.theirScore !== undefined) updates.their_score = data.theirScore;
    if (data.date !== undefined) updates.date = data.date;
    if (data.gameType !== undefined) updates.game_type = data.gameType;
    if (data.venue !== undefined) updates.venue = data.venue;
    await supabase.from("game_scores").update(updates).eq("id", id);
    loadGameScores();
  }, [loadGameScores]);

  const addCalendarEvent = useCallback(async (event: Omit<CalendarEvent, "id">) => {
    await supabase.from("calendar_events").insert({ date: event.date, title: event.title, description: event.description });
    loadCalendarEvents();
  }, [loadCalendarEvents]);

  const addMediaItems = useCallback(async (items: Omit<MediaItem, "id">[]) => {
    const inserts = items.map((item) => ({ url: item.url, caption: item.caption, date: item.date, uploaded_by: item.uploadedBy }));
    await supabase.from("media_items").insert(inserts);
    loadMediaItems();
  }, [loadMediaItems]);

  const requestContribution = useCallback(async (playerId: string, playerName: string, monthKey: string, monthLabel: string) => {
    const { data: existing } = await supabase.from("pending_approvals")
      .select("id").eq("player_id", playerId).eq("month_key", monthKey);
    if (existing && existing.length > 0) return;
    await supabase.from("pending_approvals").insert({ player_id: playerId, player_name: playerName, month_key: monthKey, month_label: monthLabel });
    await supabase.from("contributions").upsert({ member_id: playerId, month_key: monthKey, status: "pending" }, { onConflict: "member_id,month_key" });
    loadPendingApprovals(); loadMembers();
  }, [loadPendingApprovals, loadMembers]);

  const approveContribution = useCallback(async (approvalId: string) => {
    const approval = pendingApprovals.find((a) => a.id === approvalId);
    if (!approval) return;
    await supabase.from("contributions").upsert({ member_id: approval.playerId, month_key: approval.monthKey, status: "paid" }, { onConflict: "member_id,month_key" });
    await supabase.from("pending_approvals").delete().eq("id", approvalId);
    await recalculateFinancialRecord(approval.monthLabel);
    loadPendingApprovals(); loadMembers(); loadFinancialRecords();
  }, [pendingApprovals, loadPendingApprovals, loadMembers, loadFinancialRecords, recalculateFinancialRecord]);

  const rejectContribution = useCallback(async (approvalId: string) => {
    const approval = pendingApprovals.find((a) => a.id === approvalId);
    if (!approval) return;
    await supabase.from("contributions").upsert({ member_id: approval.playerId, month_key: approval.monthKey, status: "unpaid" }, { onConflict: "member_id,month_key" });
    await supabase.from("pending_approvals").delete().eq("id", approvalId);
    loadPendingApprovals(); loadMembers();
  }, [pendingApprovals, loadPendingApprovals, loadMembers]);

  const addFinancialTransaction = useCallback(async (month: string, description: string, amount: number, date: string, type: "in" | "out") => {
    const { data: record } = await supabase.from("financial_records").select("*").eq("month", month).single();
    if (record) {
      const signedAmount = type === "out" ? amount : -amount;
      const descPrefix = type === "in" && !description.includes("(Income)") ? "(Income) " : "";
      
      // Always insert into expenses (negative amount acts as income)
      await supabase.from("financial_expenses").insert({ record_id: record.id, description: descPrefix + description, amount: signedAmount, date });
      
      // Force a recalculation to update the closing balance correctly
      await recalculateFinancialRecord(month);
    } else {
      const { data: allRecords } = await supabase.from("financial_records")
        .select("closing_balance").order("created_at", { ascending: false }).limit(1);
      const openingBalance = allRecords?.[0] ? Number((allRecords[0] as any).closing_balance) : 0;
      
      const { data: newRecord } = await supabase.from("financial_records").insert({
        month, opening_balance: openingBalance, contributions: 0,
        closing_balance: openingBalance, contributors: 0,
      }).select().single();
      
      if (newRecord) {
        const signedAmount = type === "out" ? amount : -amount;
        const descPrefix = type === "in" && !description.includes("(Income)") ? "(Income) " : "";
        await supabase.from("financial_expenses").insert({ record_id: newRecord.id, description: descPrefix + description, amount: signedAmount, date });
        await recalculateFinancialRecord(month);
      }
    }
    loadFinancialRecords();
  }, [loadFinancialRecords]);

  const updatePlayerStats = useCallback(async (playerId: string, stats: Record<string, number>) => {
    // Get old stats for delta calculation
    const { data: oldData } = await supabase.from("members").select("goals,assists,games_played,saves,clean_sheets,aerial_duels,tackles,interceptions,blocks,clearances,successful_tackles,direct_targets,direct_shots").eq("id", playerId).single();

    const dbStats: any = {};
    if (stats.goals !== undefined) dbStats.goals = stats.goals;
    if (stats.assists !== undefined) dbStats.assists = stats.assists;
    if (stats.gamesPlayed !== undefined) dbStats.games_played = stats.gamesPlayed;
    if (stats.saves !== undefined) dbStats.saves = stats.saves;
    if (stats.cleanSheets !== undefined) dbStats.clean_sheets = stats.cleanSheets;
    if (stats.aerialDuels !== undefined) dbStats.aerial_duels = stats.aerialDuels;
    if (stats.tackles !== undefined) dbStats.tackles = stats.tackles;
    if (stats.interceptions !== undefined) dbStats.interceptions = stats.interceptions;
    if (stats.blocks !== undefined) dbStats.blocks = stats.blocks;
    if (stats.clearances !== undefined) dbStats.clearances = stats.clearances;
    if (stats.successfulTackles !== undefined) dbStats.successful_tackles = stats.successfulTackles;
    if (stats.directTargets !== undefined) dbStats.direct_targets = stats.directTargets;
    if (stats.directShots !== undefined) dbStats.direct_shots = stats.directShots;
    await supabase.from("members").update(dbStats).eq("id", playerId);

    // If games_played increased, auto-link player to the most recent game
    if (oldData && stats.gamesPlayed !== undefined) {
      const oldGames = (oldData as any).games_played || 0;
      if (stats.gamesPlayed > oldGames) {
        // Find the most recent game score
        const { data: recentGame } = await supabase.from("game_scores")
          .select("id").order("created_at", { ascending: false }).limit(1).single();
        if (recentGame) {
          await supabase.from("player_game_log").upsert(
            { player_id: playerId, game_id: recentGame.id } as any,
            { onConflict: "player_id,game_id" }
          );
        }
      }
    }

    // Calculate deltas and log to weekly_stats_log
    if (oldData) {
      const old = oldData as any;
      const delta: any = {
        player_id: playerId,
        week_start: currentWeekStart,
        goals: Math.max(0, (stats.goals || 0) - (old.goals || 0)),
        assists: Math.max(0, (stats.assists || 0) - (old.assists || 0)),
        games_played: Math.max(0, (stats.gamesPlayed || 0) - (old.games_played || 0)),
        saves: Math.max(0, (stats.saves || 0) - (old.saves || 0)),
        clean_sheets: Math.max(0, (stats.cleanSheets || 0) - (old.clean_sheets || 0)),
        aerial_duels: Math.max(0, (stats.aerialDuels || 0) - (old.aerial_duels || 0)),
        tackles: Math.max(0, (stats.tackles || 0) - (old.tackles || 0)),
        interceptions: Math.max(0, (stats.interceptions || 0) - (old.interceptions || 0)),
        blocks: Math.max(0, (stats.blocks || 0) - (old.blocks || 0)),
        clearances: Math.max(0, (stats.clearances || 0) - (old.clearances || 0)),
        successful_tackles: Math.max(0, (stats.successfulTackles || 0) - (old.successful_tackles || 0)),
        direct_targets: Math.max(0, (stats.directTargets || 0) - (old.direct_targets || 0)),
        direct_shots: Math.max(0, (stats.directShots || 0) - (old.direct_shots || 0)),
      };
      const hasAnyDelta = Object.entries(delta).some(([k, v]) => k !== "player_id" && k !== "week_start" && (v as number) > 0);
      if (hasAnyDelta) {
        const { data: existing } = await supabase.from("weekly_stats_log")
          .select("*").eq("player_id", playerId).eq("week_start", currentWeekStart).single();
        if (existing) {
          const ex = existing as any;
          await supabase.from("weekly_stats_log").update({
            goals: (ex.goals || 0) + delta.goals,
            assists: (ex.assists || 0) + delta.assists,
            games_played: (ex.games_played || 0) + delta.games_played,
            saves: (ex.saves || 0) + delta.saves,
            clean_sheets: (ex.clean_sheets || 0) + delta.clean_sheets,
            aerial_duels: (ex.aerial_duels || 0) + delta.aerial_duels,
            tackles: (ex.tackles || 0) + delta.tackles,
            interceptions: (ex.interceptions || 0) + delta.interceptions,
            blocks: (ex.blocks || 0) + delta.blocks,
            clearances: (ex.clearances || 0) + delta.clearances,
            successful_tackles: (ex.successful_tackles || 0) + delta.successful_tackles,
            direct_targets: (ex.direct_targets || 0) + delta.direct_targets,
            direct_shots: (ex.direct_shots || 0) + delta.direct_shots,
          } as any).eq("id", ex.id);
        } else {
          await supabase.from("weekly_stats_log").insert(delta as any);
        }
      }
    }

    loadMembers();
  }, [loadMembers, currentWeekStart]);

  const setProfilePic = useCallback(async (memberId: string, dataUrl: string) => {
    await supabase.from("members").update({ profile_pic_url: dataUrl }).eq("id", memberId);
    setProfilePics((prev) => ({ ...prev, [memberId]: dataUrl }));
  }, []);

  const setExcused = useCallback(async (playerId: string, excused: boolean, excusedType?: string, excusedDays?: string[]) => {
    await supabase.from("members").update({ excused, excused_type: excusedType || null, excused_days: excusedDays || null }).eq("id", playerId);
    if (excused && excusedType === "training" && excusedDays && excusedDays.length > 0) {
      for (const day of excusedDays) {
        await supabase.from("attendance").upsert({ week_start: currentWeekStart, day, player_id: playerId, status: "excused" }, { onConflict: "week_start,day,player_id" });
      }
      loadAttendance();
    }
    loadMembers();
  }, [currentWeekStart, loadMembers, loadAttendance]);

  const updateLineup = useCallback(async (newLineup: LineupPosition[]) => {
    for (const pos of newLineup) {
      await supabase.from("lineup_positions").update({ player_id: pos.playerId }).eq("position_id", pos.positionId);
    }
    setLineup(newLineup);
  }, []);

  const updateContributionDirect = useCallback(async (memberId: string, monthKey: string, status: "paid" | "unpaid") => {
    setMembers((prev) => prev.map((m) =>
      m.id === memberId ? { ...m, contributions: { ...m.contributions, [monthKey]: status } } : m
    ));
    try {
      await supabase.from("contributions").upsert({ member_id: memberId, month_key: monthKey, status }, { onConflict: "member_id,month_key" });
      const monthObj = contributionMonths.find((m) => m.key === monthKey);
      if (monthObj) { await recalculateFinancialRecord(monthObj.label); loadFinancialRecords(); }
    } catch { loadMembers(); }
  }, [loadMembers, loadFinancialRecords, recalculateFinancialRecord]);

  const updateAttendance = useCallback(async (playerId: string, day: string, status: string) => {
    setAttendance((prev) => {
      const existing = prev.findIndex((a) => a.playerId === playerId && a.day === day);
      if (existing >= 0) { const updated = [...prev]; updated[existing] = { playerId, day, status }; return updated; }
      return [...prev, { playerId, day, status }];
    });
    try {
      await supabase.from("attendance").upsert({ week_start: currentWeekStart, day, player_id: playerId, status, updated_by: "manager" }, { onConflict: "week_start,day,player_id" });
    } catch { loadAttendance(); }
  }, [currentWeekStart, loadAttendance]);

  const markDayNoActivity = useCallback(async (day: string) => {
    const playerMembers = members.filter((m) => m.role === "player" || m.role === "captain" || m.role === "finance" || m.role === "manager");
    setAttendance((prev) => {
      const updated = prev.filter((a) => a.day !== day);
      return [...updated, ...playerMembers.map((m) => ({ playerId: m.id, day, status: "no_activity" }))];
    });
    const inserts = playerMembers.map((m) => ({ week_start: currentWeekStart, day, player_id: m.id, status: "no_activity", updated_by: "manager" }));
    for (const ins of inserts) { await supabase.from("attendance").upsert(ins, { onConflict: "week_start,day,player_id" }); }
  }, [currentWeekStart, members]);

  const uploadMediaToStorage = useCallback(async (files: File[], uploadedBy: string) => {
    const items: { url: string; caption: string; date: string; uploaded_by: string }[] = [];
    for (const file of files) {
      const compressed = await compressAndConvertToWebP(file, "suncity-media");
      const fileName = `team-media/${Date.now()}_${compressed.name}`;
      const { error } = await supabase.storage.from("team-assets").upload(fileName, compressed);
      if (!error) {
        const { data: urlData } = supabase.storage.from("team-assets").getPublicUrl(fileName);
        items.push({ url: urlData.publicUrl, caption: file.name, date: new Date().toISOString(), uploaded_by: uploadedBy });
      }
    }
    if (items.length > 0) { await supabase.from("media_items").insert(items); loadMediaItems(); }
  }, [loadMediaItems]);

  const uploadProfilePicToStorage = useCallback(async (memberId: string, file: File): Promise<string | null> => {
    const compressed = await compressAndConvertToWebP(file, `player-${memberId}`);
    const fileName = `player-profiles/${memberId}.webp`;
    await supabase.storage.from("team-assets").remove([fileName]);
    const { error } = await supabase.storage.from("team-assets").upload(fileName, compressed, { upsert: true });
    if (!error) {
      const { data: urlData } = supabase.storage.from("team-assets").getPublicUrl(fileName);
      const url = urlData.publicUrl + "?t=" + Date.now();
      await supabase.from("members").update({ profile_pic_url: url }).eq("id", memberId);
      setProfilePics((prev) => ({ ...prev, [memberId]: url }));
      return url;
    }
    return null;
  }, []);

  const deleteMediaItem = useCallback(async (itemId: string, url: string) => {
    const match = url.match(/team-assets\/(.+?)(\?|$)/);
    if (match) { await supabase.storage.from("team-assets").remove([match[1]]); }
    await supabase.from("media_items").delete().eq("id", itemId);
    loadMediaItems();
  }, [loadMediaItems]);

  const removePlayer = useCallback(async (playerId: string) => {
    await supabase.from("attendance").delete().eq("player_id", playerId);
    await supabase.from("contributions").delete().eq("member_id", playerId);
    await supabase.from("pending_approvals").delete().eq("player_id", playerId);
    await supabase.from("player_game_log").delete().eq("player_id", playerId);
    await supabase.from("members").delete().eq("id", playerId);
    loadMembers();
  }, [loadMembers]);

  const addPlayer = useCallback(async (name: string, squadNumber: number, position: string, role: string = "player"): Promise<string> => {
    let newId: string;
    if (role === "fan") {
      const { data: maxRow } = await supabase.from("members").select("id").like("id", "SCF-F%").order("id", { ascending: false }).limit(1);
      let nextNum = 1;
      if (maxRow && maxRow.length > 0) {
        const maxId = (maxRow[0] as any).id as string;
        const num = parseInt(maxId.replace("SCF-F", ""));
        if (!isNaN(num)) nextNum = num + 1;
      }
      newId = `SCF-F${String(nextNum).padStart(2, "0")}`;
      await supabase.from("members").insert({
        id: newId, name, role: "fan", squad_number: null, position: null,
      } as any);
    } else {
      const { data: maxRow } = await supabase.from("members").select("id").like("id", "SCF-P%").order("id", { ascending: false }).limit(1);
      let nextNum = 1;
      if (maxRow && maxRow.length > 0) {
        const maxId = (maxRow[0] as any).id as string;
        const num = parseInt(maxId.replace("SCF-P", ""));
        if (!isNaN(num)) nextNum = num + 1;
      }
      newId = `SCF-P${String(nextNum).padStart(2, "0")}`;
      await supabase.from("members").insert({
        id: newId, name, squad_number: null, position: position || null, role: role || "player",
      } as any);
    }
    loadMembers();
    return newId;
  }, [loadMembers]);

  const uploadHomepageImages = useCallback(async (files: File[]) => {
    for (let i = 0; i < files.length; i++) {
      const compressed = await compressAndConvertToWebP(files[i], "homepage");
      const fileName = `homepage-images/${Date.now()}_${compressed.name}`;
      const { error } = await supabase.storage.from("team-assets").upload(fileName, compressed);
      if (!error) {
        const { data: urlData } = supabase.storage.from("team-assets").getPublicUrl(fileName);
        await supabase.from("homepage_images").insert({ url: urlData.publicUrl, sort_order: i });
      }
    }
    loadHomepageImages();
  }, [loadHomepageImages]);

  const deleteHomepageImage = useCallback(async (imageId: string, url: string) => {
    const match = url.match(/team-assets\/(.+?)(\?|$)/);
    if (match) { await supabase.storage.from("team-assets").remove([match[1]]); }
    await supabase.from("homepage_images").delete().eq("id", imageId);
    loadHomepageImages();
  }, [loadHomepageImages]);

  const addMatchPerformance = useCallback(async (perf: Omit<MatchPerformance, "id">) => {
    await supabase.from("match_performances").insert({
      game_id: perf.gameId, player_id: perf.playerId,
      goals: perf.goals, assists: perf.assists, saves: perf.saves,
      tackles: perf.tackles, interceptions: perf.interceptions, blocks: perf.blocks,
      clearances: perf.clearances, clean_sheet: perf.cleanSheet, aerial_duels: perf.aerialDuels,
      rating: perf.rating, is_potm: perf.isPotm,
      direct_shots: perf.directShots || 0,
    } as any);
    loadMatchPerformances();
  }, [loadMatchPerformances]);

  const sendMessage = useCallback(async (fromId: string, toId: string, content: string) => {
    await supabase.from("messages").insert({ from_id: fromId, to_id: toId, content } as any);
    loadMessages();
  }, [loadMessages]);

  const markMessageRead = useCallback(async (messageId: string) => {
    await supabase.from("messages").update({ read: true } as any).eq("id", messageId);
    loadMessages();
  }, [loadMessages]);

  const updateFanBadge = useCallback(async (fanId: string, badge: string) => {
    await supabase.from("members").update({ fan_badge: badge } as any).eq("id", fanId);
    loadMembers();
  }, [loadMembers]);

  const updateFanPoints = useCallback(async (fanId: string, points: number) => {
    await supabase.from("members").update({ fan_points: points } as any).eq("id", fanId);
    loadMembers();
  }, [loadMembers]);

  const updateFavouriteMoment = useCallback(async (fanId: string, moment: string) => {
    await supabase.from("members").update({ favourite_moment: moment } as any).eq("id", fanId);
    loadMembers();
  }, [loadMembers]);

  const loadWeeklyStatsLogs = useCallback(async (playerId: string): Promise<WeeklyStatsLog[]> => {
    const { data } = await supabase.from("weekly_stats_log").select("*")
      .eq("player_id", playerId).order("week_start", { ascending: false });
    if (data) {
      const mapped = data.map((d: any) => ({
        id: d.id, playerId: d.player_id, weekStart: d.week_start,
        goals: d.goals, assists: d.assists, gamesPlayed: d.games_played,
        saves: d.saves, cleanSheets: d.clean_sheets, aerialDuels: d.aerial_duels,
        tackles: d.tackles, interceptions: d.interceptions, blocks: d.blocks,
        clearances: d.clearances, successfulTackles: d.successful_tackles,
        directTargets: d.direct_targets, directShots: d.direct_shots,
        createdAt: d.created_at,
      }));
      setWeeklyStatsLogs(mapped);
      return mapped;
    }
    return [];
  }, []);

  const saveGameStats = useCallback(async (gameId: string, half: string, stats: Omit<GameStats, "id" | "gameId" | "half">) => {
    // Upsert: check if exists
    const { data: existing } = await supabase.from("game_stats")
      .select("id").eq("game_id", gameId).eq("half", half).single();
    if (existing) {
      await supabase.from("game_stats").update({
        shots: stats.shots, shots_on_target: stats.shotsOnTarget,
        penalties: stats.penalties, freekicks: stats.freekicks,
        corner_kicks: stats.cornerKicks, fouls: stats.fouls,
        offsides: stats.offsides, yellow_cards: stats.yellowCards,
        red_cards: stats.redCards,
      } as any).eq("id", existing.id);
    } else {
      await supabase.from("game_stats").insert({
        game_id: gameId, half,
        shots: stats.shots, shots_on_target: stats.shotsOnTarget,
        penalties: stats.penalties, freekicks: stats.freekicks,
        corner_kicks: stats.cornerKicks, fouls: stats.fouls,
        offsides: stats.offsides, yellow_cards: stats.yellowCards,
        red_cards: stats.redCards,
      } as any);
    }
    loadGameStats();
  }, [loadGameStats]);

  const loadPlayerGameLogs = useCallback(async (playerId: string): Promise<PlayerGameLog[]> => {
    const { data } = await supabase.from("player_game_log").select("*")
      .eq("player_id", playerId).order("created_at", { ascending: false });
    if (data) {
      return data.map((d: any) => ({
        id: d.id, playerId: d.player_id, gameId: d.game_id, createdAt: d.created_at,
      }));
    }
    return [];
  }, []);

  const updateMemberRole = useCallback(async (memberId: string, newRole: string) => {
    await supabase.from("members").update({ role: newRole }).eq("id", memberId);
    loadMembers();
  }, [loadMembers]);

  const recordTrainingMatch = useCallback(async (matchData: { teamAScore: number; teamBScore: number; performances: any[] }) => {
    const { data: match, error: mError } = await supabase.from("training_matches")
      .insert({ team_a_score: matchData.teamAScore, team_b_score: matchData.teamBScore })
      .select().single();
    
    if (mError) throw mError;

    const perfs = matchData.performances.map(p => ({
      match_id: match.id,
      player_id: p.playerId,
      team: p.team,
      goals: p.goals,
      assists: p.assists,
      rating: p.rating,
      is_potm: p.isPotm
    }));

    const { error: pError } = await supabase.from("training_match_performances").insert(perfs);
    if (pError) throw pError;

    refreshData();
  }, [refreshData]);

  return (
    <TeamDataContext.Provider
      value={{
        members, gameScores, calendarEvents, financialRecords, mediaItems,
        pendingApprovals, lineup, profilePics, attendance, currentWeekStart,
        homepageImages, matchPerformances, messages, weeklyStatsLogs,
        gameStats, playerGameLogs,
        addGameScore, deleteGameScore, updateGameScore,
        addCalendarEvent, addMediaItems,
        requestContribution, approveContribution, rejectContribution,
        addFinancialTransaction, updatePlayerStats, setProfilePic,
        setExcused, updateLineup, updateContributionDirect,
        updateAttendance, markDayNoActivity,
        uploadMediaToStorage, uploadProfilePicToStorage,
        deleteMediaItem, removePlayer, addPlayer,
        uploadHomepageImages, deleteHomepageImage,
        addMatchPerformance, sendMessage, markMessageRead,
        updateFanBadge, updateFanPoints, updateFavouriteMoment,
        updateMemberRole, recordTrainingMatch,
        loadWeeklyStatsLogs, saveGameStats, loadPlayerGameLogs,
        refreshData,
      }}
    >
      {children}
    </TeamDataContext.Provider>
  );
}

export function useTeamData() {
  const ctx = useContext(TeamDataContext);
  if (!ctx) throw new Error("useTeamData must be used within TeamDataProvider");
  return ctx;
}
