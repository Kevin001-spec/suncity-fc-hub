# Suncity FC — Massive System Update Plan

This is a very large update touching nearly every file. Due to the sheer scope, this plan is organized into implementation phases.

---

## Phase 1: Database & Data Changes

### New Supabase Tables

- `**contribution_events**` — id, title, goal_description, target_amount, amount_per_person, created_by, created_at, is_completed
- `**contribution_event_payments**` — id, event_id (FK), member_id, paid (boolean), created_at
- `**league_standings**` — id, played, won, drawn, lost, goal_difference, points, updated_at
- `**weekly_overviews**` — id, week_start, data (jsonb — stores the overview snapshot), type (weekly/monthly/season), created_at
- `**season_config**` — id, end_date, created_by

### Data Updates (via insert tool, not migrations)

- Rename `Brian(d)` → `Brian (K)` in members table
- Change `Brian (K)` role from `player` to `captain`, add pin
- Add `Oscar` as new member (SCF-P36 or SCF-P35 depending on squad numbering)
- Add `position` field data for all players as specified (GK, DEF, MID, ATT)
- Update Feb 2026 financial record: add jersey printing expense of KSh 2000 on Feb 21, add coach personal contribution of KSh 2000 (noted as personal, not from team funds), correct contributors to 17

### Update `team-data.ts` (fallback data)

- Mirror all name/role/position changes
- Add Oscar

---

## Phase 2: Theme & UI Overhaul

### `src/index.css` — Theme Change

- **Background**: Change from dark (40 6% 7%) to **white** (0 0% 100%)
- **Card/Secondary**: Light grays
- **Primary accent**: Keep gold
- **Navy**: Change to **Chelsea blue** (hsl(220, 70%, 40%))
- **Text**: Dark foreground on white background
- **Black accents** on certain elements
- **Gold glow effects** remain on edges/borders
- Add global CSS rule to hide Lovable badge:

```css
[data-lovable-badge], iframe[src*="lovable"], div[class*="lovable-badge"],
div[style*="position: fixed"][style*="bottom"][style*="right"] > a[href*="lovable"] {
  display: none !important;
}
```

---

## Phase 3: Navigation Overhaul

### 5-Tab Navbar (`src/components/Navbar.tsx`)

- **Home** | **Results** | **Players** | **Stats** | **Profile**
- Glowing active tab indicator (gold underline glow)
- Mobile-friendly bottom tab bar

### New Routes (`src/App.tsx`)

- `/results` — Results page (game history + league table)
- `/players` — Players listing page
- Keep `/dashboard` as Home, `/stats`, `/profile`

### New Pages

- `**src/pages/Results.tsx**` — All game history (permanent), league standings table (manager-editable)
- `**src/pages/Players.tsx**` — Player cards with golden glowing edges, name + position on left, profile pic on right, single column layout. Click opens existing player card modal. Officials listed separately on stats page.

---

## Phase 4: Homepage & SEO

### `index.html`

- Add `<meta name="google-site-verification" content="HxrSDUAB8gSHAXiyeMzCyPK18L9VZuQ2dS398pCIFpk" />` in `<head>`

### `src/pages/Login.tsx` (Homepage)

- Remove players/team members from homepage
- Keep: Hero, Carousel, Our Story (exclude commitment), Recent Results (max 3), Login section
- All arranged with white background theme

---

## Phase 5: PDF Export Fixes (CORE)

### `src/lib/pdf-export.ts`

- **Fix emoji rendering**: jsPDF cannot render emoji characters. Replace all emoji symbols with text equivalents in PDF data:
  - `✅` → `[PAID]` or `Yes`
  - `❌` → `[X]` or `No`
  - `🔵` → `[E]` (Excused)
  - `➖` → `[-]` (No Activity)
  - `⏳` → `[Pending]`
- Apply this sanitization before passing data to `autoTable`
- **Financial export**: Make it detailed — for each month show: month name, opening balance, each contributor's name, each expense with date and description, subtotals, closing balance. Include contribution events separately.
- **Attendance export**: Add key legend, sort by ticks > excuses > absences
- **All exports**: Optimized for print (proper margins, page breaks)

---

## Phase 6: Player Profile Simplification

### `src/pages/PlayerProfile.tsx`

- **Remove** the "Mark as Paid" button / request approval feature
- **Remove** the "Request Excuse" section entirely
- Instead, show months paid in a fancy visual way (e.g., gold badges for paid months, gray for unpaid)
- Keep: profile pic upload, stats cards, weekly attendance display

---

## Phase 7: Coach Profile Simplification

### `src/pages/OfficialProfile.tsx` (Coach sections only)

- **Remove** from Coach's profile:
  - Weekly attendance checker (manager only now)
  - Homepage photos editor
  - Player stats editor
  - Record transaction feature
- **Keep** on Coach's profile:
  - Add game scores
  - Add events
  - Upload media
  - Lineup builder
  - Remove player
  - Contribution approvals
  - **NEW**: First 11 selector (analytics-driven player selection)
  - **NEW**: Season end date setter

---

## Phase 8: Manager Attendance Enhancement

### `src/pages/OfficialProfile.tsx` (Manager sections)

- Add **Excused** option per player per day on the attendance checkbox grid
- Simplify checkbox UX: three-state toggle (Present ✅ → Excused 🔵 → clear/Absent ❌) instead of separate controls
- No Activity button per day stays as-is

### Attendance Math Fix

- If all 5 days had training: each day = 20% (100%/5)
- Logic
  - **Default:** 5 days = **20% each** (100 / 5).
  - **If 1 day is "No Activity":** 4 days = **25% each** (100 / 4).
  - **If 2 days are "No Activity":** 3 days = **33.3% each** (100 / 3).
- Progressive calculation:  each day marked as present should give the percent of the day, the next day when marked as present it should add the previous percent to give the new percent
- Final percentage is also shown when a document is exported
- Use `activeDays` count as denominator, `presentDays` as numerator

---

## Phase 9: Contribution Events System

### Fadhir & Captains' Profile — New Section

- "Add Contribution Event" form: title, description, amount per person, target amount
- Creates entry in `contribution_events` table
- Shows checkbox grid for who has contributed
- Progress bar toward target
- When target reached, officials can delete the event
- **Financial summary integration**: Listed separately under "Other Activities" per month
- Tracked and exportable in stats

---

## Phase 10: Financial Summary — Feb Specifics

### Financial Data Updates

- Feb 2026: 17 contributors (not 18)
- Add expense: "Jersey Printing" — KSh 2,000 on Feb 21
- Add note: "Coach Fabian contributed KSh 2,000 personally toward jersey purchase (not from team funds)"
- Math: When team contributions reach KSh 2,000, allocate to jersey printing, remainder = balance
- Display this clearly in the financial card with a note

---

## Phase 11: Overview Reports System (Weekly/Monthly/Season)

### Stats Page + Officials Archive

- **Weekly Overview**: Appears Friday-Sunday, shows most disciplined, best player, most improved, low contributors. After Sunday, archived to `weekly_overviews` table.
- **Monthly Overview**: After 3 weekly reports, a monthly summary opens. Archived similarly.
- **Season Overview**: Coach sets end date in `season_config`. When reached, all-time best players are calculated.
- **Display**: Three icon buttons (Weekly 📅, Monthly 📊, Season 🏆) on stats page. Clickable when their time comes.
- **Officials Archive**: Permanent section showing all past weekly/monthly reports by date, separated by type.

---

## Phase 12: Results Page & League Table

### `src/pages/Results.tsx`

- All game results permanently displayed, newest first
- **League Standings Table**: P, W, D, L, GD, Pts — editable by Manager only
- Stored in `league_standings` table

---

## Phase 13: First 11 Selector (Coach Only)

### New section on Coach's profile

- Button "Plan First 11"
- System pulls analytics: training attendance %, goals, assists for each player
- Ranks players by composite score
- Coach selects 11 starters + substitutes
- Exportable as branded PDF

---

## Phase 14: Calendar Date Picker for Transactions

### `src/pages/OfficialProfile.tsx`

- Replace the text input for transaction date with a proper Shadcn DatePicker (Popover + Calendar component)
- Ensure `pointer-events-auto` on calendar

---

## Phase 15: Event Fix

- Debug and fix the issue where events added by officials don't appear in the dashboard events section
- Ensure `addCalendarEvent` properly inserts and `loadCalendarEvents` refreshes

---

## Summary of Files Changed/Created


| File                               | Action                                                                                                                      |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `index.html`                       | Add Google verification meta tag                                                                                            |
| `src/index.css`                    | Complete theme overhaul (white bg, Chelsea blue, gold, black) + Lovable badge hide                                          |
| `src/App.tsx`                      | Add `/results`, `/players` routes                                                                                           |
| `src/components/Navbar.tsx`        | 5-tab nav with glowing tabs                                                                                                 |
| `src/pages/Login.tsx`              | Remove players section, white theme                                                                                         |
| `src/pages/Dashboard.tsx`          | Remove Team Members section (moved to /players), white theme                                                                |
| `src/pages/Results.tsx`            | NEW — game history + league table                                                                                           |
| `src/pages/Players.tsx`            | NEW — player cards with golden glow                                                                                         |
| `src/pages/Stats.tsx`              | Overview report icons, officials archive, officials list, contribution events display                                       |
| `src/pages/OfficialProfile.tsx`    | Major refactor — coach simplification, manager excused checkbox, Fadhir contribution events, date picker, first 11 selector |
| `src/pages/PlayerProfile.tsx`      | Remove approval request + excuse, fancy paid months display                                                                 |
| `src/contexts/TeamDataContext.tsx` | Add contribution events CRUD, league standings, overview archives, season config                                            |
| `src/data/team-data.ts`            | Name changes, positions, Oscar, Brian Kim captain                                                                           |
| `src/lib/pdf-export.ts`            | Fix emoji rendering, detailed financial export                                                                              |
| Supabase migration                 | New tables: contribution_events, contribution_event_payments, league_standings, weekly_overviews, season_config             |
| Supabase data updates              | Name changes, position data, Feb financial corrections                                                                      |
