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

  addGameScore: (score: Omit<GameScore, "id">) => void;
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
  addPlayer: (name: string, squadNumber: number, position: string) => Promise<void>;
  uploadHomepageImages: (files: File[]) => Promise<void>;
  deleteHomepageImage: (imageId: string, url: string) => Promise<void>;
  addMatchPerformance: (perf: Omit<MatchPerformance, "id">) => Promise<void>;
  sendMessage: (fromId: string, toId: string, content: string) => Promise<void>;
  markMessageRead: (messageId: string) => Promise<void>;
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
  const currentWeekStart = getWeekStart();

  // ===== LOAD ALL DATA FROM SUPABASE =====
  const loadMembers = useCallback(async () => {
    const { data } = await supabase.from("members").select("*");
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
        contributions: (contribMap[m.id] || {}) as Record<string, "paid" | "pending" | "unpaid">,
      }));
      setMembers(mapped);
      const pics: Record<string, string> = {};
      mapped.forEach((m) => { if (m.profilePic) pics[m.id] = m.profilePic; });
      setProfilePics(pics);
    }
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
      // Sort by month order
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
    })));
  }, []);

  const loadMessages = useCallback(async () => {
    const { data } = await supabase.from("messages").select("*").order("created_at", { ascending: false });
    if (data) setMessages(data.map((m: any) => ({
      id: m.id, fromId: m.from_id, toId: m.to_id,
      content: m.content, read: m.read, createdAt: m.created_at,
    })));
  }, []);

  const refreshData = useCallback(() => {
    loadMembers(); loadGameScores(); loadCalendarEvents(); loadFinancialRecords();
    loadMediaItems(); loadPendingApprovals(); loadLineup(); loadAttendance();
    loadHomepageImages(); loadMatchPerformances(); loadMessages();
  }, [loadMembers, loadGameScores, loadCalendarEvents, loadFinancialRecords, loadMediaItems, loadPendingApprovals, loadLineup, loadAttendance, loadHomepageImages, loadMatchPerformances, loadMessages]);

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
    }).select().single();
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
        }
      }
    }
    if (!error) { loadGameScores(); loadMembers(); }
  }, [loadGameScores, loadMembers]);

  const deleteGameScore = useCallback(async (id: string) => {
    await supabase.from("game_scorers").delete().eq("game_id", id);
    await supabase.from("match_performances").delete().eq("game_id", id);
    await supabase.from("game_scores").delete().eq("id", id);
    loadGameScores(); loadMatchPerformances();
  }, [loadGameScores, loadMatchPerformances]);

  const updateGameScore = useCallback(async (id: string, data: Partial<GameScore>) => {
    const updates: any = {};
    if (data.opponent !== undefined) updates.opponent = data.opponent;
    if (data.ourScore !== undefined) updates.our_score = data.ourScore;
    if (data.theirScore !== undefined) updates.their_score = data.theirScore;
    if (data.date !== undefined) updates.date = data.date;
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
      if (type === "out") {
        await supabase.from("financial_expenses").insert({ record_id: record.id, description, amount, date });
      }
      const monthObj = contributionMonths.find((m) => m.label === month);
      if (monthObj) {
        const { count } = await supabase.from("contributions")
          .select("*", { count: "exact", head: true })
          .eq("month_key", monthObj.key).eq("status", "paid");
        const paidCount = count || 0;
        const contributionTotal = type === "in" ? paidCount * CONTRIBUTION_AMOUNT + amount : paidCount * CONTRIBUTION_AMOUNT;
        const { data: allExp } = await supabase.from("financial_expenses").select("amount").eq("record_id", record.id);
        const expTotal = allExp?.reduce((sum: number, e: any) => sum + Number(e.amount), 0) || 0;
        const newClosing = Number(record.opening_balance) + contributionTotal - expTotal;
        await supabase.from("financial_records").update({
          contributions: contributionTotal, closing_balance: newClosing,
          ...(type === "in" ? { contributors: paidCount } : {}),
        }).eq("id", record.id);
      }
    } else {
      const { data: allRecords } = await supabase.from("financial_records")
        .select("closing_balance").order("created_at", { ascending: false }).limit(1);
      const openingBalance = allRecords?.[0] ? Number((allRecords[0] as any).closing_balance) : 0;
      const contrib = type === "in" ? amount : 0;
      const exp = type === "out" ? amount : 0;
      const { data: newRecord } = await supabase.from("financial_records").insert({
        month, opening_balance: openingBalance, contributions: contrib,
        closing_balance: openingBalance + contrib - exp, contributors: type === "in" ? 1 : 0,
      }).select().single();
      if (newRecord && type === "out") {
        await supabase.from("financial_expenses").insert({ record_id: newRecord.id, description, amount, date });
      }
    }
    loadFinancialRecords();
  }, [loadFinancialRecords]);

  const updatePlayerStats = useCallback(async (playerId: string, stats: Record<string, number>) => {
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
    loadMembers();
  }, [loadMembers]);

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
    const playerMembers = members.filter((m) => m.role === "player" || m.role === "captain");
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
    await supabase.from("members").delete().eq("id", playerId);
    loadMembers();
  }, [loadMembers]);

  const addPlayer = useCallback(async (name: string, squadNumber: number, position: string) => {
    const newId = `SCF-P${String(squadNumber).padStart(2, "0")}`;
    await supabase.from("members").insert({
      id: newId, name, squad_number: squadNumber, position: position || null, role: "player",
    } as any);
    loadMembers();
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

  return (
    <TeamDataContext.Provider
      value={{
        members, gameScores, calendarEvents, financialRecords, mediaItems,
        pendingApprovals, lineup, profilePics, attendance, currentWeekStart,
        homepageImages, matchPerformances, messages,
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
