import React, { createContext, useContext, useState, useCallback } from "react";
import {
  allMembers as initialMembers,
  initialGameScores,
  initialCalendarEvents,
  initialFinancialRecords,
  contributionMonths,
  type TeamMember,
  type GameScore,
  type CalendarEvent,
  type FinancialRecord,
  type MediaItem,
  type PendingApproval,
} from "@/data/team-data";

interface LineupPosition {
  positionId: string;
  playerId: string | null;
  label: string;
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

  addGameScore: (score: Omit<GameScore, "id">) => void;
  addCalendarEvent: (event: Omit<CalendarEvent, "id">) => void;
  addMediaItems: (items: Omit<MediaItem, "id">[]) => void;
  requestContribution: (playerId: string, playerName: string, monthKey: string, monthLabel: string) => void;
  approveContribution: (approvalId: string) => void;
  rejectContribution: (approvalId: string) => void;
  addFinancialTransaction: (month: string, description: string, amount: number, date: string, type: "in" | "out") => void;
  updatePlayerStats: (playerId: string, goals: number, assists: number, gamesPlayed: number) => void;
  setProfilePic: (memberId: string, dataUrl: string) => void;
  setExcused: (playerId: string, excused: boolean) => void;
  updateLineup: (lineup: LineupPosition[]) => void;
}

const TeamDataContext = createContext<TeamDataContextType | null>(null);

const defaultLineup: LineupPosition[] = [
  { positionId: "gk", playerId: null, label: "GK" },
  { positionId: "lb", playerId: null, label: "LB" },
  { positionId: "cb1", playerId: null, label: "CB" },
  { positionId: "cb2", playerId: null, label: "CB" },
  { positionId: "rb", playerId: null, label: "RB" },
  { positionId: "lm", playerId: null, label: "LM" },
  { positionId: "cm1", playerId: null, label: "CM" },
  { positionId: "cm2", playerId: null, label: "CM" },
  { positionId: "rm", playerId: null, label: "RM" },
  { positionId: "st1", playerId: null, label: "ST" },
  { positionId: "st2", playerId: null, label: "ST" },
];

export function TeamDataProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [gameScores, setGameScores] = useState<GameScore[]>(initialGameScores);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>(initialCalendarEvents);
  const [financialRecords, setFinancialRecords] = useState<FinancialRecord[]>(initialFinancialRecords);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [lineup, setLineup] = useState<LineupPosition[]>(defaultLineup);
  const [profilePics, setProfilePics] = useState<Record<string, string>>({});

  const addGameScore = useCallback((score: Omit<GameScore, "id">) => {
    setGameScores((prev) => [{ ...score, id: `g${Date.now()}` }, ...prev]);
  }, []);

  const addCalendarEvent = useCallback((event: Omit<CalendarEvent, "id">) => {
    setCalendarEvents((prev) => [...prev, { ...event, id: `e${Date.now()}` }]);
  }, []);

  const addMediaItems = useCallback((items: Omit<MediaItem, "id">[]) => {
    const newItems = items.map((item, i) => ({ ...item, id: `m${Date.now()}-${i}` }));
    setMediaItems((prev) => [...newItems, ...prev]);
  }, []);

  const requestContribution = useCallback((playerId: string, playerName: string, monthKey: string, monthLabel: string) => {
    setPendingApprovals((prev) => {
      if (prev.some(a => a.playerId === playerId && a.monthKey === monthKey)) return prev;
      return [...prev, {
        id: `ap${Date.now()}`,
        playerId, playerName, monthKey, monthLabel,
        requestedAt: new Date().toISOString(),
      }];
    });
    setMembers((prev) =>
      prev.map((m) =>
        m.id === playerId ? { ...m, contributions: { ...m.contributions, [monthKey]: "pending" } } : m
      )
    );
  }, []);

  const approveContribution = useCallback((approvalId: string) => {
    setPendingApprovals((prev) => {
      const approval = prev.find((a) => a.id === approvalId);
      if (approval) {
        setMembers((m) =>
          m.map((member) =>
            member.id === approval.playerId
              ? { ...member, contributions: { ...member.contributions, [approval.monthKey]: "paid" } }
              : member
          )
        );
      }
      return prev.filter((a) => a.id !== approvalId);
    });
  }, []);

  const rejectContribution = useCallback((approvalId: string) => {
    setPendingApprovals((prev) => {
      const approval = prev.find((a) => a.id === approvalId);
      if (approval) {
        setMembers((m) =>
          m.map((member) =>
            member.id === approval.playerId
              ? { ...member, contributions: { ...member.contributions, [approval.monthKey]: "unpaid" } }
              : member
          )
        );
      }
      return prev.filter((a) => a.id !== approvalId);
    });
  }, []);

  const addFinancialTransaction = useCallback((month: string, description: string, amount: number, date: string, type: "in" | "out") => {
    setFinancialRecords((prev) => {
      const idx = prev.findIndex((r) => r.month === month);
      if (idx === -1) {
        // Create new month record
        const lastRecord = prev[prev.length - 1];
        const openingBalance = lastRecord ? lastRecord.closingBalance : 0;
        const newRecord: FinancialRecord = {
          month,
          contributors: 0,
          openingBalance,
          contributions: type === "in" ? amount : 0,
          expenses: type === "out" ? [{ description, amount, date }] : [],
          closingBalance: openingBalance + (type === "in" ? amount : -amount),
        };
        return [...prev, newRecord];
      }
      const updated = [...prev];
      const record = { ...updated[idx] };
      if (type === "in") {
        record.contributions += amount;
      } else {
        record.expenses = [...record.expenses, { description, amount, date }];
      }
      const totalExpenses = record.expenses.reduce((sum, e) => sum + e.amount, 0);
      record.closingBalance = record.openingBalance + record.contributions - totalExpenses;
      updated[idx] = record;
      return updated;
    });
  }, []);

  const updatePlayerStats = useCallback((playerId: string, goals: number, assists: number, gamesPlayed: number) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === playerId ? { ...m, goals, assists, gamesPlayed } : m
      )
    );
  }, []);

  const setProfilePic = useCallback((memberId: string, dataUrl: string) => {
    setProfilePics((prev) => ({ ...prev, [memberId]: dataUrl }));
  }, []);

  const setExcused = useCallback((playerId: string, excused: boolean) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === playerId ? { ...m, excused } : m))
    );
  }, []);

  const updateLineup = useCallback((newLineup: LineupPosition[]) => {
    setLineup(newLineup);
  }, []);

  return (
    <TeamDataContext.Provider
      value={{
        members, gameScores, calendarEvents, financialRecords, mediaItems,
        pendingApprovals, lineup, profilePics,
        addGameScore, addCalendarEvent, addMediaItems,
        requestContribution, approveContribution, rejectContribution,
        addFinancialTransaction, updatePlayerStats, setProfilePic,
        setExcused, updateLineup,
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
