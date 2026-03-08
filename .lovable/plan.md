

# Comprehensive System Update Plan

This plan covers: Thursday stat reset with permanent weekly archival, intelligent match-player linking, flexible DOCX export redesign, game stats recording (first/second half), fan management UI, and league standings on Stats page.

---

## 1. Database Migrations

### New table: `game_stats`
Records team-level match statistics per half:
```sql
CREATE TABLE game_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL,
  half TEXT NOT NULL DEFAULT 'first', -- 'first' or 'second'
  shots INT DEFAULT 0,
  shots_on_target INT DEFAULT 0,
  penalties INT DEFAULT 0,
  freekicks INT DEFAULT 0,
  corner_kicks INT DEFAULT 0,
  fouls INT DEFAULT 0,
  offsides INT DEFAULT 0,
  yellow_cards INT DEFAULT 0,
  red_cards INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### New table: `player_game_log`
Links players to specific games they participated in (auto-populated when manager adds +1 games_played):
```sql
CREATE TABLE player_game_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL,
  game_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, game_id)
);
```

Both tables get public RLS policies (matching existing pattern).

---

## 2. Thursday Stat Reset with Permanent Archival

**`TeamDataContext.tsx`**: Add a `checkAndResetWeeklyStats()` function that runs on load:
- Check current day: if day > Thursday (i.e. Friday+), check if a weekly log already exists for the current week for each player
- If not, archive current stats to `weekly_stats_log` then reset all stat fields (goals, assists, games_played, saves, etc.) to 0 in `members` table
- This ensures: stats are visible Mon-Thu, archived and reset on Friday, weekly logs are permanent
- Add a flag column or use the existing `weekly_stats_log` entries to avoid double-archiving

**Key logic**: On app load, if `dayOfWeek >= 5` (Fri) and no log exists for this week for a player, archive current stats and reset to 0. Data is never lost — it moves to `weekly_stats_log`.

---

## 3. Intelligent Match-Player Linking

**`TeamDataContext.tsx`**: When `updatePlayerStats` is called and `gamesPlayed` increases:
- Find the most recent game score (the one just added by the manager)
- Auto-insert into `player_game_log` with (player_id, game_id)

**`PlayerProfile.tsx`**: New "Match History" section:
- Load from `player_game_log` joined with `game_scores` data
- Display each match the player participated in: opponent, date, result, game type (friendly/league/amateur), venue
- Show comprehensively — nothing hidden

---

## 4. Game Stats Form (Manager Profile)

**`OfficialProfile.tsx`**: After the "Add Recent Results" card succeeds, show a "Game Stats" dialog/section:
- Two columns: First Half / Second Half
- Fields: Shots, Shots on Target, Penalties, Freekicks, Corner Kicks, Fouls, Offsides, Yellow Cards, Red Cards
- Save to `game_stats` table with the game_id from the just-added score

**`Stats.tsx` / `Results.tsx`**: When viewing match reports, also load and display `game_stats` for each game (first half + second half summary).

---

## 5. Flexible DOCX Export Redesign

**`docx-export.ts`**: Redesign both `generateBrandedDocx` and `generatePlayerProfileDocx`:
- Replace strict table-only layout with mixed content: section headings, key-value pairs as paragraphs, only use tables when data is truly tabular (standings, multi-column data)
- For player profiles: use styled paragraphs for stats (e.g. "Goals: 5 | Assists: 3 | Games: 8"), attendance as inline text with emoji, contributions as a compact list
- Weekly logs: each week as a styled heading + inline stat summary paragraph rather than rigid table rows
- Financial reports: use paragraph-based layout with indented expenses
- Keep branding: badge image + "SUNCITY FC" + motto at top, footer at bottom
- Ensure profile image displays correctly (already fixed with query param stripping)

---

## 6. Fan Management UI (Manager Profile)

**`OfficialProfile.tsx`**: Add a "Fan Management" card for the manager:
- List all fans with their current badge, points
- For each fan: buttons to assign badge (`Super Fan`, `Stadium Regular`, `Top Fan`)
- Button to add +2 points (for match/training attendance)
- Auto-rank: on Sunday, the fan with most points auto-gets `Super Fan` badge (checked on load)

---

## 7. League & Amateur Standings on Stats Page

**`Stats.tsx`**: Load `league_teams` from Supabase and display:
- "Kanjuri League Standings" table
- "Amateur League Standings" table below it
- Both visible to everyone, read-only

---

## 8. Export Buttons Visibility

Player profile export buttons should appear Friday to Sunday only (already implemented). Add the "Export Full Record" button that includes comprehensive match history from `player_game_log` with game details.

---

## Files Changed

| File | Changes |
|------|---------|
| DB migration | Create `game_stats` and `player_game_log` tables with RLS |
| `src/data/team-data.ts` | Add `GameStats`, `PlayerGameLog` interfaces |
| `src/contexts/TeamDataContext.tsx` | Thursday reset logic, game stats CRUD, player game log auto-linking, fan management methods |
| `src/pages/OfficialProfile.tsx` | Game stats form after adding score, fan management card with badges/points |
| `src/pages/PlayerProfile.tsx` | Match history section from player_game_log, updated export with comprehensive data |
| `src/pages/Stats.tsx` | League + amateur standings tables for everyone, game stats in match reports |
| `src/pages/Results.tsx` | Show game stats (first/second half) on result cards |
| `src/lib/docx-export.ts` | Redesign to flexible paragraph-based layout, remove strict tabular design |

