import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  phone?: string;
  contributions?: Record<string, "paid" | "unpaid" | "pending">;
  favourite_moment?: string;
  fan_badge?: string;
  fan_points?: number;
}

export interface GameScore {
  id: string;
  opponent: string;
  date: string;
  location: string;
  result?: string;
  ourScore?: number;
  opponentScore?: number;
  status: "scheduled" | "completed";
  competition: string;
  time?: string;
}

export interface MatchPerformance {
  id: string;
  matchId: string;
  playerId: string;
  goals: number;
  assists: number;
  saves: number;
  tackles: number;
  interceptions: number;
  blocks: number;
  clearances: number;
  cleanSheet: boolean;
  aerialDuels: number;
  rating: number;
  isPotm: boolean;
  directShots: number;
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface WeeklyStatsLog {
  id: string;
  playerId: string;
  weekStart: string;
  goals: number;
  assists: number;
  gamesPlayed: number;
  saves: number;
  cleanSheets: number;
  aerialDuels: number;
  tackles: number;
  interceptions: number;
  blocks: number;
  clearances: number;
  successfulTackles: number;
  directTargets: number;
  directShots: number;
  createdAt: string;
}

export interface GameStats {
  id: string;
  gameId: string;
  half: "first" | "second";
  shots: number;
  shotsOnTarget: number;
  penalties: number;
  freekicks: number;
  cornerKicks: number;
  fouls: number;
  offsides: number;
  yellowCards: number;
  redCards: number;
}

export interface LeagueTeam {
  id: string;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  logo_url?: string;
}

interface TeamDataContextType {
  members: TeamMember[];
  gameScores: GameScore[];
  calendarEvents: any[];
  financialRecords: any[];
  mediaItems: any[];
  pendingApprovals: any[];
  lineup: any[];
  profilePics: Record<string, string>;
  attendance: any[];
  currentWeekStart: string;
  homepageImages: any[];
  matchPerformances: MatchPerformance[];
  messages: Message[];
  weeklyStatsLogs: WeeklyStatsLog[];
  gameStats: GameStats[];
  playerGameLogs: any[];
  trainingMatches: any[];
  trainingPerformances: any[];
  leagueTeams: LeagueTeam[];
  setLeagueLoaded: (loaded: boolean) => void;
  addGameScore: (score: Omit<GameScore, "id">) => Promise<void>;
  deleteGameScore: (id: string) => Promise<void>;
  updateGameScore: (id: string, updates: Partial<GameScore>) => Promise<void>;
  addCalendarEvent: (event: any) => Promise<void>;
  addMediaItems: (items: any[]) => Promise<void>;
  requestContribution: (memberId: string, month: string) => Promise<void>;
  approveContribution: (memberId: string, month: string) => Promise<void>;
  rejectContribution: (memberId: string, month: string) => Promise<void>;
  addFinancialTransaction: (month: string, description: string, amount: number, date: string, type: "in" | "out") => Promise<void>;
  updatePlayerStats: (playerId: string, updates: any) => Promise<void>;
  setProfilePic: (memberId: string, url: string) => Promise<void>;
  setExcused: (memberId: string, date: string, reason: string) => Promise<void>;
  updateLineup: (newLineup: any[]) => Promise<void>;
  updateContributionDirect: (memberId: string, month: string, status: "paid" | "unpaid") => Promise<void>;
  updateAttendance: (memberId: string, date: string, status: "present" | "absent" | "late") => Promise<void>;
  markDayNoActivity: (date: string) => Promise<void>;
  uploadMediaToStorage: (files: File[], uploadedBy: string) => Promise<void>;
  uploadProfilePicToStorage: (file: File, memberId: string) => Promise<string>;
  deleteMediaItem: (id: string) => Promise<void>;
  removePlayer: (id: string) => Promise<void>;
  addPlayer: (name: string, phone: string, role: string) => Promise<void>;
  uploadHomepageImages: (files: File[]) => Promise<void>;
  deleteHomepageImage: (id: string) => Promise<void>;
  addMatchPerformance: (perf: Omit<MatchPerformance, "id">) => Promise<void>;
  sendMessage: (fromId: string, toId: string, content: string) => Promise<void>;
  markMessageRead: (messageId: string) => Promise<void>;
  updateFanBadge: (fanId: string, badge: string) => Promise<void>;
  updateFanPoints: (fanId: string, points: number) => Promise<void>;
  updateFavouriteMoment: (fanId: string, moment: string) => Promise<void>;
  updateMemberRole: (memberId: string, newRole: string) => Promise<void>;
  recordTrainingMatch: (matchData: { teamAScore: number; teamBScore: number; performances: any[] }) => Promise<void>;
  loadWeeklyStatsLogs: (playerId: string) => Promise<WeeklyStatsLog[]>;
  saveGameStats: (gameId: string, half: string, stats: Omit<GameStats, "id" | "gameId" | "half">) => Promise<void>;
  loadPlayerGameLogs: (playerId: string) => Promise<any[]>;
  refreshData: () => Promise<void>;
}

const TeamDataContext = createContext<TeamDataContextType | undefined>(undefined);

export function TeamDataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [gameScores, setGameScores] = useState<GameScore[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [financialRecords, setFinancialRecords] = useState<any[]>([]);
  const [mediaItems, setMediaItems] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [lineup, setLineup] = useState<any[]>([]);
  const [profilePics, setProfilePics] = useState<Record<string, string>>({});
  const [attendance, setAttendance] = useState<any[]>([]);
  const [homepageImages, setHomepageImages] = useState<any[]>([]);
  const [matchPerformances, setMatchPerformances] = useState<MatchPerformance[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [weeklyStatsLogs, setWeeklyStatsLogs] = useState<WeeklyStatsLog[]>([]);
  const [gameStats, setGameStats] = useState<GameStats[]>([]);
  const [playerGameLogs, setPlayerGameLogs] = useState<any[]>([]);
  const [trainingMatches, setTrainingMatches] = useState<any[]>([]);
  const [trainingPerformances, setTrainingPerformances] = useState<any[]>([]);
  const [leagueTeams, setLeagueTeams] = useState<LeagueTeam[]>([]);
  const [leagueLoaded, setLeagueLoaded] = useState(false);
  const [currentWeekStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1));
    return d.toISOString().split("T")[0];
  });

  const loadMembers = useCallback(async () => {
    const { data } = await supabase.from("members").select("*").order("name");
    if (data) {
      setMembers(data.map((m: any) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        phone: m.phone,
        contributions: m.contributions || {},
        favourite_moment: m.favourite_moment,
        fan_badge: m.fan_badge,
        fan_points: m.fan_points
      })));
    }
  }, []);

  const loadGameScores = useCallback(async () => {
    const { data } = await supabase.from("game_scores").select("*").order("date", { ascending: false });
    if (data) {
      setGameScores(data.map((g: any) => ({
        id: g.id,
        opponent: g.opponent,
        date: g.date,
        location: g.location,
        result: g.result,
        ourScore: g.our_score,
        opponentScore: g.opponent_score,
        status: g.status,
        competition: g.competition,
        time: g.time
      })));
    }
  }, []);

  const loadMatchPerformances = useCallback(async () => {
    const { data } = await supabase.from("match_performances").select("*");
    if (data) {
      setMatchPerformances(data.map((p: any) => ({
        id: p.id,
        matchId: p.match_id,
        playerId: p.player_id,
        goals: p.goals,
        assists: p.assists,
        saves: p.saves,
        tackles: p.tackles,
        interceptions: p.interceptions,
        blocks: p.blocks,
        clearances: p.clearances,
        cleanSheet: p.clean_sheet,
        aerialDuels: p.aerial_duels,
        rating: p.rating,
        isPotm: p.is_potm,
        directShots: p.direct_shots
      })));
    }
  }, []);

  const loadMessages = useCallback(async () => {
    const { data } = await supabase.from("messages").select("*").order("created_at", { ascending: false });
    if (data) {
      setMessages(data.map((m: any) => ({
        id: m.id, fromId: m.from_id, toId: m.to_id, content: m.content, createdAt: m.created_at, read: m.read
      })));
    }
  }, []);

  const loadGameStats = useCallback(async () => {
    const { data } = await supabase.from("game_stats").select("*");
    if (data) {
      setGameStats(data.map((s: any) => ({
        id: s.id, gameId: s.game_id, half: s.half,
        shots: s.shots, shotsOnTarget: s.shots_on_target,
        penalties: s.penalties, freekicks: s.freekicks,
        cornerKicks: s.corner_kicks, fouls: s.fouls,
        offsides: s.offsides, yellowCards: s.yellow_cards,
        redCards: s.red_cards
      })));
    }
  }, []);

  const loadLeagueTeams = useCallback(async () => {
    const { data } = await supabase.from("league_teams").select("*").order("points", { ascending: false });
    if (data) {
      setLeagueTeams(data.map((t: any) => ({
        id: t.id, name: t.name, played: t.played, won: t.won, drawn: t.drawn, lost: t.lost,
        gf: t.gf, ga: t.ga, gd: t.gd, points: t.points, logo_url: t.logo_url
      })));
      setLeagueLoaded(true);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await Promise.all([
      loadMembers(),
      loadGameScores(),
      loadMatchPerformances(),
      loadMessages(),
      loadGameStats(),
      loadLeagueTeams()
    ]);
  }, [loadMembers, loadGameScores, loadMatchPerformances, loadMessages, loadGameStats, loadLeagueTeams]);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, [refreshData]);

  const addGameScore = useCallback(async (score: Omit<GameScore, "id">) => {
    await supabase.from("game_scores").insert({
      opponent: score.opponent,
      date: score.date,
      location: score.location,
      status: score.status,
      competition: score.competition,
      time: score.time,
      our_score: score.ourScore,
      opponent_score: score.opponentScore,
      result: score.result
    } as any);
    loadGameScores();
  }, [loadGameScores]);

  const deleteGameScore = useCallback(async (id: string) => {
    await supabase.from("game_scores").delete().eq("id", id);
    loadGameScores();
  }, [loadGameScores]);

  const updateGameScore = useCallback(async (id: string, updates: Partial<GameScore>) => {
    await supabase.from("game_scores").update({
      opponent: updates.opponent,
      date: updates.date,
      location: updates.location,
      status: updates.status,
      competition: updates.competition,
      time: updates.time,
      our_score: updates.ourScore,
      opponent_score: updates.opponentScore,
      result: updates.result
    } as any).eq("id", id);
    loadGameScores();
  }, [loadGameScores]);

  const addCalendarEvent = useCallback(async (event: any) => {
    await supabase.from("calendar_events").insert(event);
    // loadCalendarEvents();
  }, []);

  const addMediaItems = useCallback(async (items: any[]) => {
    await supabase.from("media_gallery").insert(items);
    // loadMediaItems();
  }, []);

  const requestContribution = useCallback(async (memberId: string, month: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      const newContribs = { ...member.contributions, [month]: "pending" };
      await supabase.from("members").update({ contributions: newContribs } as any).eq("id", memberId);
      loadMembers();
    }
  }, [members, loadMembers]);

  const approveContribution = useCallback(async (memberId: string, month: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      const newContribs = { ...member.contributions, [month]: "paid" };
      await supabase.from("members").update({ contributions: newContribs } as any).eq("id", memberId);
      loadMembers();
    }
  }, [members, loadMembers]);

  const rejectContribution = useCallback(async (memberId: string, month: string) => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      const newContribs = { ...member.contributions, [month]: "unpaid" };
      await supabase.from("members").update({ contributions: newContribs } as any).eq("id", memberId);
      loadMembers();
    }
  }, [members, loadMembers]);

  const addFinancialTransaction = useCallback(async (month: string, description: string, amount: number, date: string, type: "in" | "out") => {
    await supabase.from("financial_records").insert({
      month, description, amount, date, type
    } as any);
    // loadFinancialRecords();
  }, []);

  const updatePlayerStats = useCallback(async (playerId: string, updates: any) => {
    await supabase.from("player_stats").upsert({ player_id: playerId, ...updates } as any);
    // loadPlayerStats();
  }, []);

  const setProfilePic = useCallback(async (memberId: string, url: string) => {
    await supabase.from("members").update({ profile_pic: url } as any).eq("id", memberId);
    setProfilePics(prev => ({ ...prev, [memberId]: url }));
  }, []);

  const setExcused = useCallback(async (memberId: string, date: string, reason: string) => {
    await supabase.from("attendance").insert({ member_id: memberId, date, status: "excused", reason } as any);
    // loadAttendance();
  }, []);

  const updateLineup = useCallback(async (newLineup: any[]) => {
    await supabase.from("lineup").delete().neq("id", "0"); // Clear all
    await supabase.from("lineup").insert(newLineup);
    setLineup(newLineup);
  }, []);

  const updateContributionDirect = useCallback(async (memberId: string, month: string, status: "paid" | "unpaid") => {
    const member = members.find(m => m.id === memberId);
    if (member) {
      const newContribs = { ...member.contributions, [month]: status };
      await supabase.from("members").update({ contributions: newContribs } as any).eq("id", memberId);
      loadMembers();
    }
  }, [members, loadMembers]);

  const updateAttendance = useCallback(async (memberId: string, date: string, status: "present" | "absent" | "late") => {
    await supabase.from("attendance").upsert({ member_id: memberId, date, status } as any);
    // loadAttendance();
  }, []);

  const markDayNoActivity = useCallback(async (date: string) => {
    await supabase.from("attendance").insert({ member_id: "system", date, status: "no_activity" } as any);
    // loadAttendance();
  }, []);

  const uploadMediaToStorage = useCallback(async (files: File[], uploadedBy: string) => {
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `gallery/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);
      await supabase.from('media_gallery').insert({ url: publicUrl, uploaded_by: uploadedBy, type: 'image' } as any);
    }
    // loadMediaItems();
  }, []);

  const uploadProfilePicToStorage = useCallback(async (file: File, memberId: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${memberId}-${Math.random()}.${fileExt}`;
    const filePath = `profiles/${fileName}`;
    
    const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file);
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);
    await setProfilePic(memberId, publicUrl);
    return publicUrl;
  }, [setProfilePic]);

  const deleteMediaItem = useCallback(async (id: string) => {
    await supabase.from("media_gallery").delete().eq("id", id);
    // loadMediaItems();
  }, []);

  const removePlayer = useCallback(async (id: string) => {
    await supabase.from("members").delete().eq("id", id);
    loadMembers();
  }, [loadMembers]);

  const addPlayer = useCallback(async (name: string, phone: string, role: string) => {
    await supabase.from("members").insert({ name, phone, role } as any);
    loadMembers();
  }, [loadMembers]);

  const uploadHomepageImages = useCallback(async (files: File[]) => {
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `home-${Math.random()}.${fileExt}`;
      const filePath = `homepage/${fileName}`;
      
      const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('media').getPublicUrl(filePath);
      await supabase.from('homepage_images').insert({ url: publicUrl } as any);
    }
    // loadHomepageImages();
  }, []);

  const deleteHomepageImage = useCallback(async (id: string) => {
    await supabase.from("homepage_images").delete().eq("id", id);
    // loadHomepageImages();
  }, []);

  const addMatchPerformance = useCallback(async (perf: Omit<MatchPerformance, "id">) => {
    await supabase.from("match_performances").insert({
      match_id: perf.matchId, player_id: perf.playerId,
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

  const loadPlayerGameLogs = useCallback(async (playerId: string): Promise<any[]> => {
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
        gameStats, playerGameLogs, trainingMatches, trainingPerformances,
        leagueTeams, setLeagueLoaded,
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
