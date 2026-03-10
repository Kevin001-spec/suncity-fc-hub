

# System Update Plan

## Task 1: Move "Add Recent Results" and "Add Events" to Coach Profile Only

Currently `canManageScores` and `canManageEvents` include coach, manager, and captain. Change:
- **Add Score** card: Show only for `isCoach` (not manager/captain)
- **Add Event** card: Show only for `isCoach`
- **Manager gets a NEW "Edit/Remove Recent Scores"** card instead — shows list of `gameScores` with Edit/Delete buttons per entry

**Files:** `src/pages/OfficialProfile.tsx`
- Change line 399 condition from `canManageScores` to `isCoach`
- Change line 427 condition from `canManageEvents` to `isCoach`
- Add new Manager card: "Manage Recent Results" with list of games, each having Edit (inline fields) and Delete (with confirm) buttons

## Task 2: Update Team Stats Editor with Position-Specific Stats

The stats editor (lines 484-516) only has Goals/Assists/Games fields. Update to show position-appropriate fields:
- **All players**: Goals, Assists, Games Played, Successful Tackles, Direct Targets (new fields needed)
- **Defenders only**: Additional Tackles, Interceptions, Clearances, Direct Shots
- **GK**: Saves, Clean Sheets, Aerial Duels

**Database migration**: Add `successful_tackles` and `direct_targets` columns (and `direct_shots` for DEF) to `members` table.

**Files:**
- Supabase migration: `ALTER TABLE members ADD COLUMN successful_tackles INT DEFAULT 0, ADD COLUMN direct_targets INT DEFAULT 0, ADD COLUMN direct_shots INT DEFAULT 0;`
- `src/data/team-data.ts`: Add new fields to `TeamMember` interface
- `src/pages/OfficialProfile.tsx`: Expand stats editor — add state variables for all new stats, detect selected player's position group, show relevant fields dynamically
- `src/contexts/TeamDataContext.tsx`: Extend `updatePlayerStats` mapping to include new fields
- `src/pages/PlayerProfile.tsx`: Update `getStatCards()` to show new stats for each position
- `src/pages/Stats.tsx`: Update performance table columns

## Task 3: Overview Tracking System (Weekly/Monthly/Season) — 3 Icons

This is the repeating core request. Currently there's a single "Weekly Overview" card that shows Fri-Sun. Need to transform into 3 icons like the gallery:

**Design:**
- 3 icon buttons on Stats page (and officials dashboard): 📅 Weekly, 📊 Monthly, 🏆 Season
- **Weekly**: Icon always visible. Clickable only Fri-Sun. Opens dialog with overview data. After Sunday, auto-archive to `weekly_overviews` table.
- **Monthly**: Icon always visible. Clickable after 3 weekly reports exist. Opens dialog with monthly summary.
- **Season**: Icon always visible. Clickable only when coach's end date has passed. Opens dialog with all-time stats.
- Each includes "Most Improved" tracking (compare current vs previous week data for discipline, goals, assists).
- **Archive Section**: On officials stats/profile — permanent archive of past reports, displayed as clickable date icons (like gallery), separated by type (weekly/monthly/season).

**Files:**
- `src/pages/Stats.tsx`: Replace the single weekly overview with 3 icon system + archive section
- `src/pages/OfficialProfile.tsx`: Add archive section for officials
- Logic: Load `weekly_overviews` and `season_config` from Supabase, compute available reports

## Task 4: Player DOCX Export (Friday-Sunday)

Currently `isFriday = new Date().getDay() === 5`. Change to show Fri-Sun:
```
const showExport = [0, 5, 6].includes(new Date().getDay());
```

The export already calls `generatePlayerProfileDocx` — just need to update the visibility condition.

**Files:** `src/pages/PlayerProfile.tsx` — change line 33

## Task 5: Match Day Performance Tracking on Officials Stats

Need a section on Stats page where officials see match-by-match player performance data. Already have `match_performances` table and `addMatchPerformance` in context.

**Manager's profile**: Add "Record Match Day Stats" section — select a game, add player performances (position-specific stats + rating + POTM checkbox).

**Stats page**: Add "Match Day Reports" section — games listed by date (newest first), expandable to show each player's stats, ranked by rating, POTM highlighted. Exportable as DOCX.

**Files:**
- `src/pages/OfficialProfile.tsx`: Add match performance recorder for manager
- `src/pages/Stats.tsx`: Add match reports section

## Task 6: Manager Edit/Remove Recent Scores

Covered in Task 1 — the new "Manage Recent Results" card.

## Task 7: Add Players Section for Coach & Manager

Currently `addPlayer` exists in context but no UI. Add an "Add New Player" card for both `isCoach` and `isManager`:
- Name, Squad Number, Position selector
- Inserts via `addPlayer(name, squadNumber, position)`

**Files:** `src/pages/OfficialProfile.tsx` — add card with condition `isCoach || isManager`

## Task 8: Fix New Players Contribution Display in Stats

In `Stats.tsx` contribution grid (line 408-427), new players (SCF-P31 to SCF-P35) still show ❌ for Dec/Jan. Fix by using `getContribMonthsForMember` to determine which months to show, and for months that don't apply, show `—` instead.

**Files:** `src/pages/Stats.tsx` — update contribution grid to check `NEW_PLAYER_IDS` and skip/show dash for inapplicable months

## Task 9: Lovable Badge CSS

Already exists but will re-verify/strengthen in `src/index.css`.

---

## Summary of Files

| File | Changes |
|------|---------|
| Supabase migration | Add `successful_tackles`, `direct_targets`, `direct_shots` to `members` |
| `src/data/team-data.ts` | Add new stat fields to `TeamMember` interface |
| `src/contexts/TeamDataContext.tsx` | Extend `updatePlayerStats` and `loadMembers` for new fields |
| `src/pages/OfficialProfile.tsx` | Major: scores→coach only, events→coach only, manager gets edit/delete scores, expanded stats editor, match performance recorder, add player UI, overview archive |
| `src/pages/Stats.tsx` | Overview 3-icon system + archive, match reports section, fix new player contribution display, updated performance table |
| `src/pages/PlayerProfile.tsx` | Export visible Fri-Sun, new stat cards |
| `src/index.css` | Strengthen Lovable badge hiding |

