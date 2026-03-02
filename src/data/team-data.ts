export type Role = "coach" | "finance" | "manager" | "captain" | "player";

export interface TeamMember {
  id: string;
  name: string;
  role: Role;
  username?: string;
  pin?: string;
  phone?: string;
  squadNumber?: number;
  position?: string;
  profilePic?: string;
  goals?: number;
  assists?: number;
  gamesPlayed?: number;
  saves?: number;
  cleanSheets?: number;
  aerialDuels?: number;
  tackles?: number;
  interceptions?: number;
  blocks?: number;
  clearances?: number;
  successfulTackles?: number;
  directTargets?: number;
  directShots?: number;
  excused?: boolean;
  excusedType?: string;
  excusedDays?: string[];
  contributions: Record<string, "paid" | "pending" | "unpaid">;
}

export interface GameScore {
  id: string;
  date: string;
  opponent: string;
  ourScore: number;
  theirScore: number;
  scorers?: string[];
}

export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  description: string;
}

export interface FinancialRecord {
  month: string;
  contributors: number;
  contributorNote?: string;
  openingBalance: number;
  contributions: number;
  expenses: { description: string; amount: number; date: string }[];
  closingBalance: number;
}

export interface MediaItem {
  id: string;
  url: string;
  caption?: string;
  date: string;
  uploadedBy: string;
}

export interface PendingApproval {
  id: string;
  playerId: string;
  playerName: string;
  monthKey: string;
  monthLabel: string;
  requestedAt: string;
}

export interface AttendanceRecord {
  playerId: string;
  day: string;
  status: "present" | "absent" | "excused" | "no_activity";
}

export interface MatchPerformance {
  id: string;
  gameId: string;
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
}

export interface Message {
  id: string;
  fromId: string;
  toId: string;
  content: string;
  read: boolean;
  createdAt: string;
}

// New player IDs (SCF-P31 to SCF-P35) — their contributions start from feb-2026
export const NEW_PLAYER_IDS = new Set(["SCF-P31", "SCF-P32", "SCF-P33", "SCF-P34", "SCF-P35"]);

// Get contribution months for a member (new players skip dec-2025, jan-2026)
export function getContribMonthsForMember(memberId: string) {
  if (NEW_PLAYER_IDS.has(memberId)) {
    return contributionMonths.filter(m => m.key !== "dec-2025" && m.key !== "jan-2026");
  }
  return contributionMonths;
}

// Full position name labels
export function getFullPositionName(pos?: string): string {
  if (!pos) return "Player";
  const map: Record<string, string> = {
    "GK": "Goalkeeper",
    "DEF": "Defender",
    "DEF (LB)": "Left Back",
    "DEF (CB)": "Center Back",
    "DEF (RB)": "Right Back",
    "MID": "Midfielder",
    "ATT": "Attacker",
  };
  return map[pos] || pos;
}

export function getPositionGroup(pos?: string): string {
  if (!pos) return "ATT";
  if (pos.startsWith("GK")) return "GK";
  if (pos.startsWith("DEF")) return "DEF";
  if (pos.startsWith("MID")) return "MID";
  if (pos.startsWith("ATT")) return "ATT";
  return "MID";
}

// Officials
export const officials: TeamMember[] = [
  { id: "SCF-001", name: "Fabian", role: "coach", username: "COACH-FAB", pin: "8246", phone: "0717455265", goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" } },
  { id: "SCF-002", name: "Fadhir", role: "finance", username: "FIN-FAD", pin: "5931", phone: "0748431548", goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" } },
  { id: "SCF-003", name: "Kevin", role: "manager", username: "MGR-KEV", pin: "7719", phone: "0112563036", goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" } },
  { id: "SCF-004", name: "Ethan", role: "captain", username: "CPT-ETH", pin: "4628", phone: "0718258821", position: "MID", goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" } },
  { id: "SCF-005", name: "Denoh", role: "captain", username: "CPT-DEN", pin: "9183", phone: "0769188787", position: "MID", goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" } },
  { id: "SCF-006", name: "Victor", role: "captain", username: "CPT-VIC", pin: "3507", phone: "0786520209", position: "DEF (LB)", goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" } },
  { id: "SCF-007", name: "Lucario", role: "captain", username: "CPT-LUC", pin: "6842", phone: "0722725900", position: "MID", goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" } },
  { id: "SCF-008", name: "Austin", role: "captain", username: "CPT-AUS", pin: "2059", position: "MID", goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" } },
  { id: "SCF-009", name: "Brian (K)", role: "captain", username: "CPT-BK", pin: "1374", position: "MID", goals: 0, assists: 0, gamesPlayed: 0, contributions: {} },
];

// Players — Brian Kim is regular player (SCF-P35), not official
export const players: TeamMember[] = [
  { id: "SCF-P01", name: "Blaise", role: "player", squadNumber: 1, position: "MID", goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid" } },
  { id: "SCF-P02", name: "Bronze", role: "player", squadNumber: 2, position: "MID", goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" } },
  { id: "SCF-P03", name: "Lawrence", role: "player", squadNumber: 3, position: "DEF (CB)", goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid" } },
  { id: "SCF-P04", name: "Darren", role: "player", squadNumber: 4, position: "MID", goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" } },
  { id: "SCF-P05", name: "Yassin", role: "player", squadNumber: 5, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid" } },
  { id: "SCF-P06", name: "Wakili", role: "player", squadNumber: 6, position: "DEF (RB)", goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" } },
  { id: "SCF-P07", name: "Collo", role: "player", squadNumber: 7, position: "DEF (LB)", goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid" } },
  { id: "SCF-P08", name: "Fad", role: "player", squadNumber: 8, position: "ATT", goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid" } },
  { id: "SCF-P09", name: "Sam", role: "player", squadNumber: 9, position: "DEF (LB)", goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid" } },
  { id: "SCF-P10", name: "Olise", role: "player", squadNumber: 10, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" } },
  { id: "SCF-P11", name: "Kibe", role: "player", squadNumber: 11, position: "GK", goals: 0, assists: 0, gamesPlayed: 0, saves: 0, cleanSheets: 0, aerialDuels: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid" } },
  { id: "SCF-P12", name: "Mugi J.r", role: "player", squadNumber: 12, position: "ATT", goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" } },
  { id: "SCF-P13", name: "Francis", role: "player", squadNumber: 13, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid" } },
  { id: "SCF-P14", name: "Kanja", role: "player", squadNumber: 14, position: "MID", goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid" } },
  { id: "SCF-P15", name: "Felix M", role: "player", squadNumber: 15, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid" } },
  { id: "SCF-P16", name: "Brayo", role: "player", squadNumber: 16, position: "GK", goals: 0, assists: 0, gamesPlayed: 0, saves: 0, cleanSheets: 0, aerialDuels: 0, contributions: { "dec-2025": "paid" } },
  { id: "SCF-P17", name: "Bivon", role: "player", squadNumber: 17, position: "ATT", goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid" } },
  { id: "SCF-P18", name: "Mungai", role: "player", squadNumber: 18, position: "DEF (RB)", goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid" } },
  { id: "SCF-P19", name: "Foden", role: "player", squadNumber: 19, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid" } },
  { id: "SCF-P20", name: "Njuguna", role: "player", squadNumber: 20, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid" } },
  { id: "SCF-P21", name: "Amos", role: "player", squadNumber: 21, position: "ATT", goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid" } },
  { id: "SCF-P22", name: "Bill", role: "player", squadNumber: 22, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid" } },
  { id: "SCF-P23", name: "Einstein", role: "player", squadNumber: 23, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid" } },
  { id: "SCF-P24", name: "Mannasseh", role: "player", squadNumber: 24, position: "DEF (CB)", goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid" } },
  { id: "SCF-P25", name: "Morgan", role: "player", squadNumber: 25, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid" } },
  { id: "SCF-P26", name: "Kayb", role: "player", squadNumber: 26, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid" } },
  { id: "SCF-P27", name: "Davie", role: "player", squadNumber: 27, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid" } },
  { id: "SCF-P28", name: "Brian", role: "player", squadNumber: 28, position: "MID", goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid" } },
  { id: "SCF-P29", name: "William", role: "player", squadNumber: 29, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid" } },
  { id: "SCF-P30", name: "Joshua", role: "player", squadNumber: 30, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid" } },
  { id: "SCF-P31", name: "Krish", role: "player", squadNumber: 31, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "feb-2026": "paid" } },
  { id: "SCF-P32", name: "Kelly", role: "player", squadNumber: 32, goals: 0, assists: 0, gamesPlayed: 0, contributions: {} },
  { id: "SCF-P33", name: "Edu", role: "player", squadNumber: 33, goals: 0, assists: 0, gamesPlayed: 0, contributions: {} },
  { id: "SCF-P34", name: "Rodgers", role: "player", squadNumber: 34, goals: 0, assists: 0, gamesPlayed: 0, contributions: {} },
  { id: "SCF-P35", name: "Brian Kim", role: "player", squadNumber: 35, goals: 0, assists: 0, gamesPlayed: 0, contributions: {} },
  { id: "SCF-P36", name: "Oscar", role: "player", squadNumber: 36, goals: 0, assists: 0, gamesPlayed: 0, contributions: {} },
  { id: "SCF-P37", name: "Joe", role: "player", squadNumber: 37, position: "MID", goals: 0, assists: 0, gamesPlayed: 0, contributions: {} },
  { id: "SCF-P38", name: "Masai", role: "player", squadNumber: 38, position: "MID", goals: 0, assists: 0, gamesPlayed: 0, contributions: {} },
  { id: "SCF-P39", name: "Fadhir (P)", role: "player", squadNumber: 39, position: "MID", goals: 0, assists: 0, gamesPlayed: 0, contributions: {} },
];

export const allMembers: TeamMember[] = [...officials, ...players];

// Contribution months
export const contributionMonths = [
  { key: "dec-2025", label: "Dec 2025" },
  { key: "jan-2026", label: "Jan 2026" },
  { key: "feb-2026", label: "Feb 2026" },
  { key: "mar-2026", label: "Mar 2026" },
  { key: "apr-2026", label: "Apr 2026" },
];

export const CONTRIBUTION_AMOUNT = 100;

export const initialFinancialRecords: FinancialRecord[] = [];
export const initialGameScores: GameScore[] = [];
export const initialCalendarEvents: CalendarEvent[] = [];

export const teamBackground = {
  origin: "Sun City FC was born out of passion, friendship, and the strong desire to give talented young players a platform to showcase their abilities. What began as a simple gathering of football lovers on dusty fields slowly transformed into a team with a vision. In the early days, we had no proper jerseys, no stable financial support, and sometimes not even enough equipment for training. Despite all these challenges, we showed up every day because we believed in something bigger than ourselves.",
  struggle: "When we first joined the Kanjuri League, our start was very difficult. We lost matches, struggled with coordination, and lacked proper discipline and commitment. Financial hardship almost broke us apart, and there were moments when morale was low and unity was tested. However, through resilience and determination, we refused to give up.",
  coachImpact: "The turning point came when Fabian became the coach of the team. At that time, the team needed structure, discipline, and a fresh vision. Fabian stepped in not only as a coach but as a leader determined to rebuild the team's foundation. He introduced a monthly contribution system to help stabilize the team financially and ensure accountability among players. Under his leadership, the team managed to purchase new jerseys, restoring pride and identity. He worked hard to motivate players, strengthen bonds between teammates, and create a spirit of unity and brotherhood. Discipline was instilled both on and off the pitch, and he made sure every player felt comfortable, valued, and respected within the team. The culture of seriousness and commitment that we see today is a result of his dedication and leadership.",
  acknowledgements: "We also extend sincere appreciation to Fadhir for working tirelessly for the team and consistently building a positive image of Sun City FC. His effort and commitment behind the scenes have greatly contributed to where we are today. Special thanks also go to Captain Ethan for always performing his role responsibly, keeping players on their toes, and leading by example. To all team leaders, your cooperation with the coach has made the work easier, and you are encouraged to fully understand your roles and continue bringing ideas that will help move the team to the next level.",
  values: "As a coach, I want to make it very clear that Sun City FC is not a place for indiscipline, laziness, or division. Any player who is not ready to work with the team, the officials, and the leadership should reconsider their position. If any form of disrespect, disunity, or refusal to cooperate is noted, the player will face suspension for a period of not less than ten days. We are competing seriously in the Kanjuri League, and discipline, commitment, and unity are non-negotiable values.",
};

export function authenticateMember(identifier: string, pin?: string): TeamMember | null {
  const upperId = identifier.toUpperCase();
  if (upperId.includes("P")) {
    const player = players.find((p) => p.id.toUpperCase() === upperId);
    if (player) return player;
  }
  if (pin) {
    const official = officials.find((o) => o.id.toUpperCase() === upperId && o.pin === pin);
    if (official) return official;
  }
  if (pin) {
    const official = officials.find((o) => o.username?.toUpperCase() === upperId && o.pin === pin);
    if (official) return official;
  }
  return null;
}
