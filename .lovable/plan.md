
# Fix Stats: Remove Tackles, Add Games Played, Ensure Shots on Target

## Summary
Three updates: replace "Tackles" with "Successful Tackles" for DEF/MID/ATT positions, add "Games Played" as an auto-tracked stat visible on player profiles, and ensure "Shots on Target" is properly wired in the stats editor.

---

## Changes

### 1. `src/lib/position-stats.ts`
- **DEF_STATS**: Remove `tackles`, replace with `successfulTackles`
- **MID_ATT_STATS**: Remove `tackles`, keep `successfulTackles`
- Add `gamesPlayed` (display-only) to all stat sets — this is auto-tracked from match recordings

**New stat sets:**
| Position | Stats |
|----------|-------|
| GK | Saves, Clean Sheets, Aerial Duels, Games Played |
| DEF | Successful Tackles, Interceptions, Assists, Goals, Shots on Target, Games Played |
| MID/ATT | Successful Tackles, Goals, Assists, Shots on Target, Games Played |

### 2. `src/pages/OfficialProfile.tsx`
- **Team Stats Editor**: Remove `statsTackles` from the `stateSetters` map
- Keep `statsSuccessfulTackles` and `statsDirectShots` (which maps to Shots on Target)
- Games Played is NOT in the editor — it's auto-recorded when match performance is logged

### 3. `src/pages/PlayerProfile.tsx`
- Add `gamesPlayed: Gamepad2` to `iconMap` for the Games Played stat display
- The `statFields` from `getStatsForPosition` will now include `gamesPlayed`

---

## Files Changed
| File | Changes |
|------|---------|
| `src/lib/position-stats.ts` | Update DEF_STATS and MID_ATT_STATS: remove tackles, keep successfulTackles; add gamesPlayed to all sets |
| `src/pages/OfficialProfile.tsx` | Remove `tackles` from stateSetters map |
| `src/pages/PlayerProfile.tsx` | Add gamesPlayed icon mapping |
