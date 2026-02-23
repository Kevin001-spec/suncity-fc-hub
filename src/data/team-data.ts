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
  excused?: boolean;
  contributions: Record<string, "paid" | "pending" | "unpaid">;
}

export interface GameScore {
  id: string;
  date: string;
  opponent: string;
  ourScore: number;
  theirScore: number;
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

// Officials
export const officials: TeamMember[] = [
  {
    id: "SCF-001", name: "Fabian", role: "coach",
    username: "COACH-FAB", pin: "8246", phone: "0717455265",
    goals: 0, assists: 0, gamesPlayed: 0,
    contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" },
  },
  {
    id: "SCF-002", name: "Fadhir", role: "finance",
    username: "FIN-FAD", pin: "5931", phone: "0748431548",
    goals: 0, assists: 0, gamesPlayed: 0,
    contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" },
  },
  {
    id: "SCF-003", name: "Kevin", role: "manager",
    username: "MGR-KEV", pin: "7719", phone: "0112563036",
    goals: 0, assists: 0, gamesPlayed: 0,
    contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" },
  },
  {
    id: "SCF-004", name: "Ethan", role: "captain",
    username: "CPT-ETH", pin: "4628", phone: "0718258821",
    goals: 0, assists: 0, gamesPlayed: 0,
    contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" },
  },
  {
    id: "SCF-005", name: "Denoh", role: "captain",
    username: "CPT-DEN", pin: "9183", phone: "0769188787",
    goals: 0, assists: 0, gamesPlayed: 0,
    contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" },
  },
  {
    id: "SCF-006", name: "Victor", role: "captain",
    username: "CPT-VIC", pin: "3507", phone: "0786520209",
    goals: 0, assists: 0, gamesPlayed: 0,
    contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" },
  },
  {
    id: "SCF-007", name: "Lucario", role: "captain",
    username: "CPT-LUC", pin: "6842", phone: "0722725900",
    goals: 0, assists: 0, gamesPlayed: 0,
    contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" },
  },
  {
    id: "SCF-008", name: "Austin", role: "captain",
    username: "CPT-AUS", pin: "2059",
    goals: 0, assists: 0, gamesPlayed: 0,
    contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" },
  },
];

// Players - all stats reset to 0
export const players: TeamMember[] = [
  { id: "SCF-P01", name: "Blaise", role: "player", squadNumber: 1, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "unpaid" } },
  { id: "SCF-P02", name: "Bronze", role: "player", squadNumber: 2, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "unpaid", "feb-2026": "unpaid" } },
  { id: "SCF-P03", name: "Lawrence", role: "player", squadNumber: 3, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" } },
  { id: "SCF-P04", name: "Darren", role: "player", squadNumber: 4, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "unpaid" } },
  { id: "SCF-P05", name: "Yassin", role: "player", squadNumber: 5, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" } },
  { id: "SCF-P06", name: "Wakili", role: "player", squadNumber: 6, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "unpaid", "feb-2026": "unpaid" } },
  { id: "SCF-P07", name: "Collo", role: "player", squadNumber: 7, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" } },
  { id: "SCF-P08", name: "Fad", role: "player", squadNumber: 8, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "unpaid", "feb-2026": "unpaid" } },
  { id: "SCF-P09", name: "Sam", role: "player", squadNumber: 9, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" } },
  { id: "SCF-P10", name: "Olise", role: "player", squadNumber: 10, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "unpaid" } },
  { id: "SCF-P11", name: "Kibe", role: "player", squadNumber: 11, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" } },
  { id: "SCF-P12", name: "Mugi J.r", role: "player", squadNumber: 12, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "unpaid", "feb-2026": "unpaid" } },
  { id: "SCF-P13", name: "Francis", role: "player", squadNumber: 13, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "unpaid" } },
  { id: "SCF-P14", name: "Kanja", role: "player", squadNumber: 14, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" } },
  { id: "SCF-P15", name: "Felix M", role: "player", squadNumber: 15, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "unpaid", "feb-2026": "unpaid" } },
  { id: "SCF-P16", name: "Brian(d)", role: "player", squadNumber: 16, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "unpaid", "feb-2026": "unpaid" } },
  { id: "SCF-P17", name: "Bivon", role: "player", squadNumber: 17, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "unpaid" } },
  { id: "SCF-P18", name: "Mungai", role: "player", squadNumber: 18, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "unpaid" } },
  { id: "SCF-P19", name: "Foden", role: "player", squadNumber: 19, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" } },
  { id: "SCF-P20", name: "Njuguna", role: "player", squadNumber: 20, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "unpaid", "feb-2026": "unpaid" } },
  { id: "SCF-P21", name: "Amos", role: "player", squadNumber: 21, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "unpaid", "feb-2026": "unpaid" } },
  { id: "SCF-P22", name: "Bill", role: "player", squadNumber: 22, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "unpaid" } },
  { id: "SCF-P23", name: "Einstein", role: "player", squadNumber: 23, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "unpaid", "feb-2026": "unpaid" } },
  { id: "SCF-P24", name: "Travis", role: "player", squadNumber: 24, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "unpaid" } },
  { id: "SCF-P25", name: "Morgan", role: "player", squadNumber: 25, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" } },
  { id: "SCF-P26", name: "Kayb", role: "player", squadNumber: 26, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "unpaid", "feb-2026": "unpaid" } },
  { id: "SCF-P27", name: "Davie", role: "player", squadNumber: 27, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "paid" } },
  { id: "SCF-P28", name: "Brian", role: "player", squadNumber: 28, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "unpaid" } },
  { id: "SCF-P29", name: "William", role: "player", squadNumber: 29, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "unpaid", "feb-2026": "unpaid" } },
  { id: "SCF-P30", name: "Joshua", role: "player", squadNumber: 30, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "paid", "feb-2026": "unpaid" } },
  { id: "SCF-P31", name: "Krish", role: "player", squadNumber: 31, goals: 0, assists: 0, gamesPlayed: 0, contributions: { "dec-2025": "paid", "jan-2026": "unpaid", "feb-2026": "unpaid" } },
];

export const allMembers: TeamMember[] = [...officials, ...players];

// Contribution months
export const contributionMonths = [
  { key: "dec-2025", label: "Dec 2025" },
  { key: "jan-2026", label: "Jan 2026" },
  { key: "feb-2026", label: "Feb 2026" },
  { key: "mar-2026", label: "Mar 2026" },
  { key: "apr-2026", label: "Apr 2026" },
  { key: "may-2026", label: "May 2026" },
];

// Pre-loaded financial records from PDF
export const initialFinancialRecords: FinancialRecord[] = [
  {
    month: "Dec 2025",
    contributors: 35,
    contributorNote: "35 players",
    openingBalance: 0,
    contributions: 3600,
    expenses: [],
    closingBalance: 3600,
  },
  {
    month: "Jan 2026",
    contributors: 19,
    contributorNote: "19 players",
    openingBalance: 3600,
    contributions: 1900,
    expenses: [
      { description: "Ball purchased", amount: 2000, date: "Jan 16" },
      { description: "Transport for ball", amount: 200, date: "Jan 16" },
    ],
    closingBalance: 3300,
  },
  {
    month: "Feb 2026",
    contributors: 15,
    contributorNote: "15 players (to Feb 18)",
    openingBalance: 3300,
    contributions: 1500,
    expenses: [
      { description: "Field painting", amount: 200, date: "Feb 15" },
      { description: "League registration", amount: 2000, date: "Feb 18" },
      { description: "Jersey parcel fee", amount: 200, date: "Feb 18" },
      { description: "Jersey kits", amount: 4500, date: "Feb 18" },
    ],
    closingBalance: 750,
  },
];

// Financial summary remarks from PDF
export const financialRemarks = [
  "Above is an expenditure summary for each month.",
  "In December we had the highest contributions of 35 players while the lowest was February with 15 players.",
  "Looking at where we are now and looking at where we started, there has been eye catching developments.",
  "Thanks 👍 to our coach @Fabian for all the developments and taking our team to another level of standards.",
  "All Captains thank you for you're all strong at game, vocal and responsible as it should be, lets continue to lead that way (Ethan, Denoh, Victor, Lucario) — great work 👏",
  "Thank you all for the unity and respect and let's continue to make Suncity a great team.",
];

// Sample game scores
export const initialGameScores: GameScore[] = [
  { id: "g1", date: "2026-02-15", opponent: "Kanjuri United", ourScore: 3, theirScore: 1 },
  { id: "g2", date: "2026-02-08", opponent: "Valley Stars", ourScore: 2, theirScore: 2 },
  { id: "g3", date: "2026-01-25", opponent: "Highland FC", ourScore: 1, theirScore: 0 },
];

// Sample calendar events
export const initialCalendarEvents: CalendarEvent[] = [
  { id: "e1", date: "2026-02-22", title: "League Match vs Riverside FC", description: "Kanjuri League Round 4" },
  { id: "e2", date: "2026-02-25", title: "Team Training", description: "Evening training session" },
  { id: "e3", date: "2026-03-01", title: "League Match vs Mountain Boys", description: "Kanjuri League Round 5" },
];

// Team background
export const teamBackground = {
  origin: "Sun City FC was born out of passion, friendship, and the strong desire to give talented young players a platform to showcase their abilities. What began as a simple gathering of football lovers on dusty fields slowly transformed into a team with a vision. In the early days, we had no proper jerseys, no stable financial support, and sometimes not even enough equipment for training. Despite all these challenges, we showed up every day because we believed in something bigger than ourselves.",
  struggle: "When we first joined the Kanjuri League, our start was very difficult. We lost matches, struggled with coordination, and lacked proper discipline and commitment. Financial hardship almost broke us apart, and there were moments when morale was low and unity was tested. However, through resilience and determination, we refused to give up.",
  coachImpact: "The turning point came when Fabian became the coach of the team. At that time, the team needed structure, discipline, and a fresh vision. Fabian stepped in not only as a coach but as a leader determined to rebuild the team's foundation. He introduced a monthly contribution system to help stabilize the team financially and ensure accountability among players. Under his leadership, the team managed to purchase new jerseys, restoring pride and identity. He worked hard to motivate players, strengthen bonds between teammates, and create a spirit of unity and brotherhood. Discipline was instilled both on and off the pitch, and he made sure every player felt comfortable, valued, and respected within the team. The culture of seriousness and commitment that we see today is a result of his dedication and leadership.",
  acknowledgements: "We also extend sincere appreciation to Fadhir for working tirelessly for the team and consistently building a positive image of Sun City FC. His effort and commitment behind the scenes have greatly contributed to where we are today. Special thanks also go to Captain Ethan for always performing his role responsibly, keeping players on their toes, and leading by example. To all team leaders, your cooperation with the coach has made the work easier, and you are encouraged to fully understand your roles and continue bringing ideas that will help move the team to the next level.",
  values: "As a coach, I want to make it very clear that Sun City FC is not a place for indiscipline, laziness, or division. Any player who is not ready to work with the team, the officials, and the leadership should reconsider their position. If any form of disrespect, disunity, or refusal to cooperate is noted, the player will face suspension for a period of not less than ten days. We are competing seriously in the Kanjuri League, and discipline, commitment, and unity are non-negotiable values.",
  contributions: "Regarding monthly contributions, old members are required to have five ticks, while new members must have three ticks. Everyone must be clear about their contributions, whether they are with the team financially or not. There will be no hiding behind others and no unnecessary excuses. For Sun City FC to grow stronger, each member must play their role responsibly. If we remain united, disciplined, and focused, there is no limit to what we can achieve together. Sun City FC is more than just a football team; it is our identity, our responsibility, and our future. ⚽🌅",
};

// Auth helper - now supports official login by ID + PIN
export function authenticateMember(identifier: string, pin?: string): TeamMember | null {
  const upperId = identifier.toUpperCase();
  
  // Check if it's a player ID (contains P)
  if (upperId.includes("P")) {
    const player = players.find((p) => p.id.toUpperCase() === upperId);
    if (player) return player;
  }
  
  // Check officials by their official ID (SCF-001, etc.) + PIN
  if (pin) {
    const official = officials.find(
      (o) => o.id.toUpperCase() === upperId && o.pin === pin
    );
    if (official) return official;
  }

  // Also allow officials by username + PIN (backward compat)
  if (pin) {
    const official = officials.find(
      (o) => o.username?.toUpperCase() === upperId && o.pin === pin
    );
    if (official) return official;
  }

  return null;
}
