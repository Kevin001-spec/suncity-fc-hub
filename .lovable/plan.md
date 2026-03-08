

# Game Stats Recording After Add Score

## What the user wants
- When the manager clicks "Add Score", after the score is saved, a game stats form should appear for that specific game
- The form has 1 table split into First Half and Second Half columns
- Stats: Shots, Shots on Target, Penalties, Freekicks, Corner Kicks, Fouls, Offsides, Yellow Cards, Red Cards
- On the Results page, show the most recent game's stats table (replaces when a new game is recorded)
- This is visible to everyone on the Results page

## Changes

### `src/pages/OfficialProfile.tsx`
1. Add state: `lastAddedGameId` (string | null), plus 18 state fields for first/second half stats (e.g. `firstShots`, `secondShots`, etc.) — or use two objects for cleaner code
2. In `addScore()`: after `addGameScore()` returns, capture the game ID and set `lastAddedGameId` to show the stats form
3. Add a new section that renders when `lastAddedGameId` is set — a card with a table:
   - Columns: Stat Name | 1st Half | 2nd Half
   - Rows: Shots, Shots on Target, Penalties, Freekicks, Corner Kicks, Fouls, Offsides, Yellow Cards, Red Cards
   - All inputs are number fields
   - "Save Game Stats" button that calls `saveGameStats` twice (once for 'first', once for 'second') then clears the form
4. Need `addGameScore` to return the new game's ID — check if it already does

### `src/contexts/TeamDataContext.tsx`
- Ensure `addGameScore` returns the new game ID so the form knows which game to attach stats to

### `src/pages/Results.tsx`
1. Load game stats from Supabase (`game_stats` table)
2. Find the most recent game (first in `gameScores` sorted by date)
3. Display a single "Match Stats" card showing a table with First Half / Second Half columns for that game only
4. When a new game is recorded, it naturally replaces since we always show the latest

