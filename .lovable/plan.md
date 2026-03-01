

# Suncity FC — System Update Plan

## 1. Brian Kim: Demote to Regular Player

**DB update**: `UPDATE members SET role = 'player' WHERE id = 'SCF-P35'`
**team-data.ts**: Move Brian Kim from `officials` to `players`, change role to "player", remove pin/username. Keep Brian (K) (SCF-009) as official/captain.
Also insert SCF-009 (Brian (K)) into DB members table if not already there.

## 2. New Players: Remove Jan & Feb Contributions from Profile

For SCF-P31 through SCF-P35, filter out `dec-2025` and `jan-2026` from their contribution months display. In `PlayerProfile.tsx` and `Stats.tsx` contribution grid, conditionally show months starting from `feb-2026` for these IDs. Define a `newPlayerIds` set and a `getContribMonthsForMember(id)` helper.

## 3. Replace Red X Emoji with Softer Unpaid Indicator

Replace `❌` for unpaid contributions with `⬜` or a gray dash `—` across:
- `PlayerProfile.tsx` monthly contributions
- `Stats.tsx` contribution grid
- `OfficialProfile.tsx` contribution display
- Exported documents

## 4. Position-Specific Stats for GK & DEF

### Schema change (migration)
Add columns to `members`: `saves INT DEFAULT 0`, `clean_sheets INT DEFAULT 0`, `aerial_duels INT DEFAULT 0`, `tackles INT DEFAULT 0`, `interceptions INT DEFAULT 0`, `blocks INT DEFAULT 0`, `clearances INT DEFAULT 0`.

### UI changes
- **PlayerProfile.tsx**: If position starts with "GK", show Saves/Clean Sheets/Aerial Duels instead of Goals/Assists. If "DEF", show Tackles/Interceptions/Blocks/Clearances.
- **Players.tsx** PlayerCard: Same position-based stat display.
- **Stats.tsx** performance table: Add position-specific columns or show relevant stats per row.
- **OfficialProfile.tsx** Team Stats Editor: When a player is selected, show position-appropriate stat fields (GK fields for keepers, DEF fields for defenders, standard for others).

### TeamDataContext
Update `updatePlayerStats` to accept all stat types. Update `TeamMember` interface in `team-data.ts`.

## 5. Match Day Performance Tracking

### New DB table (migration): `match_performances`
- id, game_id (FK to game_scores), player_id, goals, assists, saves, tackles, interceptions, blocks, clearances, clean_sheet, aerial_duels, rating, is_potm (boolean), created_at

### OfficialProfile (Manager section)
After a match, manager records each selected player's performance stats for that game. Section: "Record Match Day Stats".

### Stats page (Officials)
New section: "Match Day Reports" — list of matches sorted by date (newest first), each expandable to show player performances, rankings, and Player of the Match. Exportable.

## 6. Manager: Edit/Remove Recent Game Scores

Add a section on manager profile to view recent scores with Edit/Delete buttons. Functions: `deleteGameScore(id)` and `updateGameScore(id, data)` in TeamDataContext.

## 7. Coach & Manager: Add Players to System

Add a section on coach and manager profiles: "Add New Player" form with name, squad number, position. Inserts into `members` table.

## 8. Player Messaging to Officials

### New DB table (migration): `messages`
- id, from_id, to_id, content, read (boolean), created_at

### PlayerProfile
New section: "Send Message" — select recipient (Fabian, Kevin, or Fadhir), type message, send.

### OfficialProfile (Fabian/Kevin/Fadhir only)
New section: "Inbox" — view received messages, reply. Replies stored in same table.

## 9. Full Position Names

Update `getPositionLabel` in `Players.tsx` and all display points:
- GK → Goalkeeper
- DEF → Defender, DEF (LB) → Left Back, DEF (CB) → Center Back, DEF (RB) → Right Back
- MID → Midfielder
- ATT → Attacker/Forward

Also update position editor options in coach profile.

## 10. Overview Tracking System (Weekly/Monthly/Season)

### Stats page & Officials profile
Display 3 icons: Weekly 📅, Monthly 📊, Season 🏆
- **Weekly**: Opens Fri-Sun. After Sunday, auto-archived to `weekly_overviews` table with type='weekly'.
- **Monthly**: Opens when 3 weekly reports exist for that month period. Archived with type='monthly'.
- **Season**: Opens when coach's end_date is reached. Type='season'.
- Icons always visible but grayed/locked until their opening time.
- Include "most improved" tracking (comparing current week vs previous).

### Officials Archive
Permanent section on officials stats/profile: past reports as clickable date icons (like gallery). Separated by weekly vs monthly vs season.

## 11. Replace PDF with DOCX Export

Remove `jspdf` and `jspdf-autotable`. Install `docx` and `file-saver`.

Create `src/lib/docx-export.ts`:
- Fetch badge, convert to Buffer/Base64 for docx
- Header: centered logo (80px), "Discipline • Unity • Victory" italic 10pt
- A4 with 1-inch margins, print layout
- Clean bordered tables with auto-column widths
- Use actual emoji characters (✅, ❌, 🔵, ➖) since DOCX supports them

Replace all `generateBrandedPdf` calls with new DOCX generator.

### Player DOCX Export (Fridays only)
PlayerProfile: Export button visible on Fridays. Exports player photo, name, position, stats, attendance, opponents played.

## 12. Financial System Fixes

### Feb 2026: 17 contributors
Current DB shows 19 paid for feb-2026. Need user to confirm which 2 to remove, OR update via SQL to correct.
- Fix the `finMonth` default to use current actual month
- Fix month ordering in financial summary display (Dec, Jan, Feb, Mar, Apr order)
- Add jersey printing expense and coach personal contribution note

## 13. Attendance Math: X = 0%

Current `calcAttendancePct` counts excused as half — correct. But absent days shouldn't add any percentage. The current code already doesn't add percentage for absent. The issue may be that unrecorded days (no attendance entry) are being treated differently. Fix: ensure `absent` status contributes 0 to the percentage, and only `present` and `excused` (half) contribute.

## 14. Lovable Badge CSS

Already exists in `index.css`. Strengthen with additional selectors targeting `position: fixed` bottom-right elements.

## 15. Data Integrity

- Ensure all operations go through Supabase
- No data loss from these changes
- Insert SCF-009 (Brian (K)) into members table if missing

---

## Files Changed/Created

| File | Action |
|------|--------|
| Supabase migration | Add columns to members (saves, clean_sheets, etc.), create match_performances, messages tables |
| DB data updates | Brian Kim → player, insert SCF-009, fix positions |
| `src/data/team-data.ts` | Move Brian Kim to players, update TeamMember interface with new stat fields, full position names |
| `src/lib/docx-export.ts` | NEW — DOCX branded export utility |
| `src/lib/pdf-export.ts` | Remove/deprecate |
| `src/contexts/TeamDataContext.tsx` | Add match performances CRUD, messages CRUD, game score edit/delete, add player, expanded updatePlayerStats |
| `src/pages/PlayerProfile.tsx` | Position-specific stats, filtered contribution months, softer unpaid emoji, messaging, Friday DOCX export |
| `src/pages/Players.tsx` | Full position names, position-specific stats in card |
| `src/pages/OfficialProfile.tsx` | Match day stats recorder, add player, edit/delete scores, position-specific stats editor, overview archive |
| `src/pages/Stats.tsx` | Match day reports, overview icons system, position-specific performance table, DOCX exports |
| `src/index.css` | Strengthen Lovable badge hiding |
| `package.json` | Add `docx`, `file-saver`; remove `jspdf`, `jspdf-autotable` |

