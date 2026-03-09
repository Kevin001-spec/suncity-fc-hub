

# Fix Lost Stats, Permanent Performance Data, Match Perf Fields Alignment

## Issues Identified

### 1. Lost Stats — Root Cause
The weekly reset system (`checkAndResetWeeklyStats` in TeamDataContext.tsx) runs on Fri/Sat/Sun and **zeros all player stats** in the `members` table after archiving to `weekly_stats_log`. Today is Sunday, so it ran and wiped everything. The Player Performance table in Stats.tsx reads from `members` (which is now all zeros).

**Fix**: The Player Performance table must show **cumulative totals** by summing ALL `weekly_stats_log` entries + current `members` values. This makes performance data permanent regardless of weekly resets.

### 2. Match Perf Recorder — Missing Fields
Current match day perf fields don't match profile stats:
- DEF_PERF has: tackles, interceptions, goals, assists — **missing shots on target, uses generic "tackles" instead of "successful tackles"**
- MID_ATT_PERF has: goals, assists, tackles — **missing shots on target, uses generic "tackles" instead of "successful tackles"**

**Fix**: Align perf fields exactly to profile stats (minus gamesPlayed which is auto-tracked):

| Position | Match Perf Fields |
|----------|------------------|
| GK | Saves, Aerial Duels, Clean Sheet |
| DEF | Successful Tackles, Interceptions, Assists, Goals, Shots on Target |
| MID/ATT | Successful Tackles, Goals, Assists, Shots on Target |

### 3. `handleUpdateStats` — Missing `successfulTackles` in stateMap
Line 370: the `stateMap` doesn't include `successfulTackles`, so saving stats for MID/ATT/DEF silently drops that field.

### 4. Match perf `tackles` column reuse
The `match_performances` table has a `tackles` column. We'll use it for "Successful Tackles" data (same meaning in match context). The `direct_shots` column doesn't exist in `match_performances` — but we can store shots on target in a workaround: use the existing `blocks` column (unused) to store shots on target for match perfs, OR add a migration. Better approach: add `direct_shots` column to `match_performances`.

---

## Changes

### Migration: Add `direct_shots` to `match_performances`
```sql
ALTER TABLE match_performances ADD COLUMN IF NOT EXISTS direct_shots integer NOT NULL DEFAULT 0;
```

### `src/lib/position-stats.ts`
- Update DEF_PERF: `successfulTackles` (maps to `tackles` db column), `interceptions`, `goals`, `assists`, `directShots` (maps to new `direct_shots` column)
- Update MID_ATT_PERF: `successfulTackles` (maps to `tackles`), `goals`, `assists`, `directShots`
- GK_PERF stays the same

### `src/pages/OfficialProfile.tsx`
- **`handleUpdateStats` stateMap** (line 370): Add `successfulTackles: statsSuccessfulTackles`
- **Match perf recorder**: Add `perfDirectShots` state. Update `perfStateMap` to include `directShots` and rename `tackles` key to `successfulTackles`. Update `handleAddMatchPerf` to send `direct_shots` for all positions and use `tackles` column for successful tackles data.
- Reset `perfDirectShots` after recording

### `src/pages/Stats.tsx`
- Load `weekly_stats_log` data in the component
- Compute **cumulative stats** for each player: sum all `weekly_stats_log` entries for that player + current `members` table values
- Display cumulative totals in the Player Performance table instead of just current `members` values
- This makes stats permanent and visible even after weekly resets

### `src/contexts/TeamDataContext.tsx`
- In `loadMatchPerformances`: map new `direct_shots` field
- In `addMatchPerformance`: include `direct_shots` in insert
- Update `MatchPerformance` type in `team-data.ts` to include `directShots`

### `src/data/team-data.ts`
- Add `directShots?: number` to `MatchPerformance` interface

---

## Files Changed

| File | Changes |
|------|---------|
| Migration | Add `direct_shots` column to `match_performances` |
| `src/lib/position-stats.ts` | Align DEF_PERF and MID_ATT_PERF to profile stats |
| `src/pages/OfficialProfile.tsx` | Fix stateMap, add directShots to match perf, align all perf fields |
| `src/pages/Stats.tsx` | Cumulative stats from weekly_stats_log + members for permanent display |
| `src/contexts/TeamDataContext.tsx` | Map new direct_shots in match perf load/save |
| `src/data/team-data.ts` | Add directShots to MatchPerformance interface |

