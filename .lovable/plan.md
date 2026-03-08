

# Fix: Game Stats Not Saving or Displaying on Results Page

## Root Cause
The `handleSaveGameStats` in `OfficialProfile.tsx` uses `upsert` with `onConflict: "game_id,half"`, but there is **no unique constraint** on `(game_id, half)` in the `game_stats` table. This causes the upsert to fail silently — no rows are ever inserted. The Results page code is correct, but there's simply no data to display.

## Fix

### 1. Database Migration
Add a unique constraint on `(game_id, half)` to the `game_stats` table:
```sql
ALTER TABLE game_stats ADD CONSTRAINT game_stats_game_id_half_key UNIQUE (game_id, half);
```

### 2. Fix `OfficialProfile.tsx` — `handleSaveGameStats`
The current code creates an inline `saveGameStats` function that shadows the one from context. It also doesn't check for errors. Fix:
- Remove the shadowed inline function — use a direct `supabase.from("game_stats").upsert(...)` call properly
- Add error checking on the upsert result
- Log errors via toast if the save fails

### 3. Results page — already correct
The Results page code correctly finds the latest game, fetches its `game_stats`, and renders the first/second half table. Once data actually saves, it will display automatically.

## Files Changed
| File | Change |
|------|--------|
| DB migration | Add `UNIQUE(game_id, half)` constraint |
| `src/pages/OfficialProfile.tsx` | Fix `handleSaveGameStats` to not shadow context function, add error handling |

