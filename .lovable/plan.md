

# Suncity FC — System Fixes & Enhancements

This update covers 15 specific issues: navbar mobile position, sign-out button, attendance math fix, player positions/ordering, team stats editor restoration, league standings multi-team support, opponent tracking, player data export, DOCX export restoration with emojis, financial system fixes, tracking/overview system, gallery scroll fix, profile pic aspect ratio, Ethan attendance access, and Lovable badge hiding.

---

## 1. Navbar: Move Mobile Tab Bar to Top + Add Sign Out

**`src/components/Navbar.tsx`**
- Change mobile nav from `fixed bottom-0` to `sticky top-0` (same as desktop)
- Merge mobile and desktop into a single top navbar that adapts
- Add a LogOut button visible on mobile (currently only on desktop)
- Remove the `<div className="h-16 sm:hidden" />` spacer at bottom

---

## 2. Attendance Math Fix (CORE)

**`src/pages/OfficialProfile.tsx`** and **`src/pages/Stats.tsx`**

Current bug: excused days count as full attendance in the percentage. The correct logic:

```text
For each player in the week:
  activeDays = days with status != "no_activity" (and status is recorded)
  presentDays = days with status == "present"
  excusedDays = days with status == "excused"
  
  Each excuse = HALF a day's value
  dayValue = 100 / activeDays.length
  percentage = (presentDays * dayValue) + (excusedDays * dayValue * 0.5)
  
  Progressive: only count days that have been recorded so far
```

Apply this formula in:
- `OfficialProfile.tsx` attendance table (lines ~576-579)
- `Stats.tsx` attendanceRanking useMemo (lines ~41-57)

---

## 3. Player Positions & Ordering on Players Page

**`src/pages/Players.tsx`**
- Sort players: Captains (labeled "Field Captain") first, then by position group (GK → DEF → MID → ATT)
- Show position title below name (e.g., "Field Captain • Midfielder")
- Add position group headers between sections

**`src/data/team-data.ts`** — Update positions for players missing them based on provided data:
- Add specific positions (LB, CB, RB, etc.) as sub-positions where provided
- These are already partially set; update the detailed sub-positions

**DB update** — Update member positions in Supabase via SQL:
```sql
UPDATE members SET position = 'GK' WHERE name IN ('Kibe', 'Brayo');
UPDATE members SET position = 'DEF (LB)' WHERE name = 'Victor';
-- etc. for all players
```

**Coach's profile** — Add a "Edit Player Positions" section where coach can select a player and set/change their position, saved to Supabase.

---

## 4. Restore Team Stats Editor on Manager Profile

**`src/pages/OfficialProfile.tsx`**
- The `updatePlayerStats` function exists in context but no UI for it on manager profile
- Add back the Team Stats Editor card for the manager: select player → edit goals, assists, games played → save
- Add an "Opponent" field: when updating games_played, also input opponent name
- Store opponents played against (add `opponents_played` text[] column to members table, or store in game_scorers)

---

## 5. League Standings — Multi-Team Support

**`src/pages/Results.tsx`** — Currently only shows Suncity FC's single row
- Restructure to support multiple teams in the league table
- Manager can add/remove teams and update their stats
- Suncity FC row highlighted with primary color/different background
- Auto-sort by points (highest to lowest), then goal difference

**Database migration**: Create `league_teams` table:
```sql
CREATE TABLE league_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name text NOT NULL,
  played int DEFAULT 0,
  won int DEFAULT 0,
  drawn int DEFAULT 0,
  lost int DEFAULT 0,
  goal_difference int DEFAULT 0,
  points int DEFAULT 0,
  is_own_team boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
INSERT INTO league_teams (team_name, is_own_team) VALUES ('Suncity FC', true);
```
- Move league standings editing to Manager's profile (not Results page)
- Results page shows read-only league table

---

## 6. Opponent Tracking in Player Profiles

**`src/pages/OfficialProfile.tsx`** (Manager stats editor)
- When recording games played for a player, add input for opponent name
- Store as array on the member record or in a join table

**`src/pages/PlayerProfile.tsx`**
- Add a section (not at top) showing opponents played against
- Pull from game_scorers joined with game_scores to get opponent names for games the player participated in

---

## 7. Player Data Export (DOCX on Fridays)

**`src/pages/PlayerProfile.tsx`**
- Show export button only on Fridays (dayOfWeek === 5)
- Export as DOCX with team branding: player name, position, stats, attendance, opponents played
- Use the `docx` library (reinstall it)

---

## 8. Switch ALL Exports Back to DOCX + Restore Emojis

This reverses the PDF switch. Reinstall `docx` and `file-saver` packages.

**`src/lib/docx-export.ts`** — New utility replacing pdf-export
- Create branded DOCX documents with team badge, motto, tables
- Use actual emoji characters (✅, ❌, 🔵, ➖) since DOCX supports them
- Apply to: contributions, attendance, financial summary, weekly overview, first 11, player profile

**All pages**: Replace `generateBrandedPdf` calls with new DOCX generator

**Website UI**: Restore emoji display:
- Contribution status: ✅ for paid, ❌ for unpaid
- Attendance: ✅ present, 🔵 excused, ❌ absent, ➖ no activity
- Update Stats.tsx, OfficialProfile.tsx, PlayerProfile.tsx

---

## 9. Financial System Fixes (CORE)

**Fix Feb contributors count**: Update DB record to show 17 not 18
```sql
UPDATE financial_records SET contributors = 17, contributions = 1700 WHERE month = 'Feb 2026';
```

**Fix month ordering**: Sort financial records by a defined order (Dec, Jan, Feb, Mar, Apr) not by created_at

**Fix "jumps to March" bug**: In `addFinancialTransaction`, the month selection defaults to "Mar 2026" (line 57). Change default to current month based on date. Also ensure the record lookup matches correctly.

**Detailed financial export**: Organize by month with itemized tables, contributor names, expense breakdowns

**Feb 2026 specific data**:
- Jersey printing expense: KSh 2,000 on Feb 21
- Note: "Coach Fabian contributed KSh 2,000 personally (not from team funds)"
- Math: Team balance = contributions - expenses. Coach's personal contribution is noted but doesn't affect team money math
- Current balance as of Feb 27: -400

---

## 10. Tracking/Overview System (Weekly/Monthly/Season)

**`src/pages/Stats.tsx`**
- Display 3 icons: Weekly 📅, Monthly 📊, Season 🏆
- Weekly: clickable on Fri-Sun, shows overview data
- Monthly: clickable after 3 weekly reports
- Season: clickable when coach's end date is reached
- All archived in `weekly_overviews` table with type field

**Officials stats/profile**: Add permanent archive section showing past reports as date icons (like gallery), clickable to view

---

## 11. Gallery Scroll Fix

**`src/pages/Dashboard.tsx`** `MediaGallery` component
- Bug: `emblaRef` is used for all date groups but only initialized once
- Fix: Create separate Embla instances per date group, or use a single carousel per group

---

## 12. Profile Picture Aspect Ratio Fix

**`src/index.css`** or component-level:
- All Avatar/AvatarImage: `aspect-ratio: 1/1`, `object-fit: cover`, `object-position: center`
- Apply to: PlayerProfile, OfficialProfile, Players page cards, Dashboard members

---

## 13. Ethan Attendance Access

**`src/pages/OfficialProfile.tsx`**
- Currently attendance section only shows for `isManager`
- Add condition: also show for Ethan (SCF-004)
- `const canManageAttendance = isManager || user.id === "SCF-004";`

---

## 14. Official Profile Pics Visible

Ensure officials' profile pictures (from Supabase storage) load and display in Stats page officials list and anywhere officials appear.

---

## 15. Lovable Badge Hide (CSS)

**`src/index.css`** — Already has rules but may need strengthening:
```css
[data-lovable-badge],
iframe[src*="lovable"],
div[class*="lovable-badge"],
a[href*="lovable.dev"][style*="position: fixed"],
div[style*="position: fixed"][style*="bottom"][style*="right"] > a[href*="lovable"] {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
  pointer-events: none !important;
}
```

---

## Files Changed/Created

| File | Action |
|------|--------|
| `src/components/Navbar.tsx` | Mobile nav to top, add sign out |
| `src/pages/OfficialProfile.tsx` | Stats editor, attendance math, Ethan access, position editor, league management |
| `src/pages/Stats.tsx` | Attendance math fix, emojis, overview icons, archive section |
| `src/pages/PlayerProfile.tsx` | Opponents section, DOCX export, emojis, aspect ratio |
| `src/pages/Players.tsx` | Position ordering, captain titles, group headers |
| `src/pages/Results.tsx` | Multi-team league table, read-only view |
| `src/pages/Dashboard.tsx` | Gallery scroll fix |
| `src/contexts/TeamDataContext.tsx` | Add league_teams CRUD, position update function |
| `src/data/team-data.ts` | Detailed positions with sub-positions |
| `src/lib/docx-export.ts` | NEW — DOCX branded export utility |
| `src/lib/pdf-export.ts` | Keep but deprecate |
| `src/index.css` | Profile pic aspect ratio, Lovable badge hide |
| `package.json` | Reinstall `docx`, `file-saver` |
| Supabase migration | `league_teams` table |
| Supabase data updates | Positions, Feb financial fix, Brian Kim captain |

