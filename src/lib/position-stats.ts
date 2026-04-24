import { getPositionGroup } from "@/data/team-data";

// Position-specific stat field definitions used across the entire system
export interface StatField {
  key: string;
  label: string;
  dbColumn: string;
}

// GK: Saves, Clean Sheets, Aerial Duels, Games Played
const GK_STATS: StatField[] = [
  { key: "saves", label: "Saves", dbColumn: "saves" },
  { key: "cleanSheets", label: "Clean Sheets", dbColumn: "clean_sheets" },
  { key: "aerialDuels", label: "Aerial Duels", dbColumn: "aerial_duels" },
  { key: "gamesPlayed", label: "Games Played", dbColumn: "games_played" },
];

// DEF: Successful Tackles, Interceptions, Assists, Goals, Shots on Target, Games Played
const DEF_STATS: StatField[] = [
  { key: "successfulTackles", label: "Successful Tackles", dbColumn: "successful_tackles" },
  { key: "interceptions", label: "Interceptions", dbColumn: "interceptions" },
  { key: "assists", label: "Assists", dbColumn: "assists" },
  { key: "goals", label: "Goals", dbColumn: "goals" },
  { key: "directShots", label: "Shots on Target", dbColumn: "direct_shots" },
  { key: "gamesPlayed", label: "Games Played", dbColumn: "games_played" },
];

// MID/ATT: Successful Tackles, Goals, Assists, Shots on Target, Games Played
const MID_ATT_STATS: StatField[] = [
  { key: "successfulTackles", label: "Successful Tackles", dbColumn: "successful_tackles" },
  { key: "goals", label: "Goals", dbColumn: "goals" },
  { key: "assists", label: "Assists", dbColumn: "assists" },
  { key: "directShots", label: "Shots on Target", dbColumn: "direct_shots" },
  { key: "gamesPlayed", label: "Games Played", dbColumn: "games_played" },
];

export function getStatsForPosition(position?: string): StatField[] {
  const group = getPositionGroup(position);
  if (group === "GK") return GK_STATS;
  if (group === "DEF") return DEF_STATS;
  return MID_ATT_STATS;
}

// Match performance fields per position (for recording match day stats)
export interface PerfField {
  key: string;
  label: string;
  dbColumn: string;
}

const GK_PERF: PerfField[] = [
  { key: "saves", label: "Saves", dbColumn: "saves" },
  { key: "aerialDuels", label: "Aerial Duels", dbColumn: "aerial_duels" },
  { key: "cleanSheet", label: "Clean Sheet", dbColumn: "clean_sheet" },
];

const DEF_PERF: PerfField[] = [
  { key: "successfulTackles", label: "Successful Tackles", dbColumn: "tackles" },
  { key: "interceptions", label: "Interceptions", dbColumn: "interceptions" },
  { key: "goals", label: "Goals", dbColumn: "goals" },
  { key: "assists", label: "Assists", dbColumn: "assists" },
  { key: "directShots", label: "Shots on Target", dbColumn: "direct_shots" },
];

const MID_ATT_PERF: PerfField[] = [
  { key: "successfulTackles", label: "Successful Tackles", dbColumn: "tackles" },
  { key: "goals", label: "Goals", dbColumn: "goals" },
  { key: "assists", label: "Assists", dbColumn: "assists" },
  { key: "directShots", label: "Shots on Target", dbColumn: "direct_shots" },
];

export function getPerfFieldsForPosition(position?: string): PerfField[] {
  const group = getPositionGroup(position);
  if (group === "GK") return GK_PERF;
  if (group === "DEF") return DEF_PERF;
  return MID_ATT_PERF;
}

// POTM calculation: weighted scoring formula (position-aware)
export function calculatePotmScore(perf: {
  goals: number;
  assists: number;
  saves: number;
  tackles: number;
  interceptions: number;
  cleanSheet: boolean;
  aerialDuels: number;
  positionGroup?: string;
}): number {
  const isGK = perf.positionGroup === "GK";
  const isDef = perf.positionGroup === "DEF";
  
  return (
    (perf.goals || 0) * (isDef ? 20 : 15) + 
    (perf.assists || 0) * 10 +
    (perf.saves || 0) * (isGK ? 4 : 2) +
    (perf.tackles || 0) * (isDef ? 2 : 3) + 
    (perf.interceptions || 0) * (isDef ? 2 : 3) +
    (perf.cleanSheet ? (isGK || isDef ? 10 : 0) : 0) +
    (perf.aerialDuels || 0) * 1
  );
}
