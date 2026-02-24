

# Suncity FC — Comprehensive System Overhaul

This plan addresses every item raised, organized by priority. The single most critical fix is **data persistence** — currently all data lives in React state and vanishes on page refresh. Everything else builds on top of that foundation.

---

## CRITICAL FIX: Data Persistence via Supabase

**The root cause of data vanishing on refresh**: All scores, events, media, contributions, profile pics, and stats are stored in React `useState` — which resets when the page reloads. This must be migrated to Supabase tables.

### Database Tables to Create

```text
members           — id, name, role, username, pin, phone, squad_number, position, goals, assists, games_played, excused, excused_type, excused_days, profile_pic_url, created_at
contributions     — id, member_id, month_key, status (paid/pending/unpaid/rejected), updated_at
pending_approvals — id, player_id, player_name, month_key, month_label, requested_at, rejection_note
financial_records — id, month, contributors, contributor_note, opening_balance, contributions, closing_balance
financial_expenses — id, record_id, description, amount, date
game_scores       — id, date, opponent, our_score, their_score, created_at
game_scorers      — id, game_id, player_id (tracks who scored in each game)
calendar_events   — id, date, title, description, created_at
media_items       — id, url, caption, date, uploaded_by, created_at
lineup_positions  — id, position_id, player_id, label
attendance        — id, week_start, day, player_id, status (present/absent/excused/no_activity), updated_by
```

### Supabase Storage Buckets

- `team-assets/player-profiles` — for profile pictures
- `team-assets/team-media` — for gallery photos

### RLS Policies

- All tables readable by authenticated users (anon key with member validation via edge function)
- Write policies restricted by role for each table
- Since we're using custom auth (not Supabase Auth), we'll use an edge function to validate member identity and return data, or use public tables with application-level role checks

### Data Seeding

All 39+ members, the Dec–Feb financial records, and contribution statuses will be seeded into the database via SQL INSERT statements.

---

## 1. New Members & Name Changes

**Add**: Kelly (SCF-P32), Edu (SCF-P33), Rodgers (SCF-P34)
**Rename**: Travis → Mannasseh (SCF-P24)
**Existing**: Brian(d) stays as-is (already done)

Update `team-data.ts` and seed into the `members` table.

---

## 2. Contribution Status Corrections

Update the following contribution statuses (arrange by highest paid to lowest, officials on top):

| Player | Ticks (from Dec onward) |
|--------|------------------------|
| Bronze | 3 (Dec, Jan, Feb) |
| Darren | 3 |
| Wakili | 3 |
| Olise | 3 |
| Mugi J.r | 3 |
| Collo | 2 (Dec, Jan) |
| Denoh | 2 |
| Fad | 2 |
| Sam | 2 |
| Amos | 2 |
| Kibe | 2 |
| Davie | 2 |
| Francis | 1 (Dec) |
| Kanja | 1 |
| Morgan | 1 |
| Brian | 1 |
| Joshua | 1 |
| Krish | Feb only (remove Dec tick, place in Feb) |

All others not listed: only Dec tick or none as currently set.

---

## 3. Contribution Approval → Financial Summary Auto-Update

When Fadhir approves a contribution:
1. Player's month gets ticked (already works in context)
2. The `financialRecords` for that month gets its `contributions` field incremented by **KSh 100** (the monthly contribution amount)
3. The `contributors` count for that month increments by 1
4. The `closingBalance` recalculates automatically
5. All of this persists in the database

When rejected: player is notified with a toast/status showing "Rejected" — no financial update.

---

## 4. Fadhir's Contribution Checkbox System

Add a dedicated section on Fadhir's (and Coach's) profile:
- A grid/table of ALL players × months (Dec–May)
- Each cell is a checkbox
- Checking = marks that player as "paid" for that month (updates DB + context)
- Unchecking = marks as "unpaid"
- Changes propagate in real-time to the player's profile and the stats page
- This is independent of the approval workflow — Fadhir can directly manage status

---

## 5. Officials Get Monthly Contribution Section

All officials **except Fabian** will see the same monthly contribution tracker on their profile that players see — with the ability to press "Paid" and send approval to Fadhir.

Fabian is **exempt** from the monthly contribution list entirely.

---

## 6. Clear Dashboard of Pre-loaded Data

- Remove all sample game scores from `initialGameScores` (empty array)
- Remove all sample calendar events from `initialCalendarEvents` (empty array)
- Dashboard starts clean — officials add fresh data

---

## 7. Dashboard Rules

**Recent Results**: Maximum 3 on dashboard, newest at top, oldest at bottom. When a 4th is added, the oldest drops off the dashboard (but stays in the Stats page permanently).

**Upcoming Events**: Maximum 3 on dashboard. Events whose date has passed automatically disappear. Fix the glitch where events vanish prematurely — ensure date comparison uses end-of-day, not start-of-day.

**Team Roster label**: Change "Team Roster" → "Team Members"

---

## 8. Stats Page Updates

**Player Performance table**: Exclude Fabian (coach) and Kevin (manager) — they don't play.

**Game History section (NEW)**: All recorded games appear permanently on the stats page in a scrollable list, newest on top. Each game entry shows:
- Date, opponent, score, result badge
- Goal scorers listed below (e.g., "Blaise ⚽, Olise ⚽")

**Remove remarks** at the bottom of the stats page.

**Export as .docx** (replace .txt): Use the `docx` npm library to generate a professional branded document with:
- Suncity FC badge at the top
- Formatted contribution grid
- Professional styling

---

## 9. Game Score Entry — Goal Scorers

When officials add a game score, add a section to select which players scored:
- If "Our Score" is 2, show 2 player selector dropdowns
- Each dropdown lists all players
- The scorers are saved and displayed on both the dashboard and the stats page

---

## 10. Media & Gallery System — Supabase Storage

**Upload flow**:
- Profile pictures → `team-assets/player-profiles/{member_id}.jpg`
- Gallery media → `team-assets/team-media/{timestamp}_{filename}`
- Automatic routing based on which component triggers the upload

**Gallery display**:
- Grouped by upload date with clear date headers
- Swipeable left/right using embla-carousel
- Download button on each image
- Clean, professional layout

**Profile pictures persist** across refreshes because they're stored in Supabase Storage, not base64 in React state.

---

## 11. Weekly Attendance System (Manager)

**New on Manager's (and Coach's) profile**: A weekly attendance tracker.

- Table: All players × Mon–Fri
- Manager ticks checkboxes for who attended each day
- Manager can mark a day as "No Activity" (everyone marked accordingly)
- Blank = Absent
- Attendance percentage calculated **only after Friday**
- When a new week starts (Monday), old data clears and fresh week begins
- Old week data is archived in the database

**Player profile**: Shows their attendance for the current week with fancy day-by-day indicators.

**Stats page**: Shows attendance ranking — sorted by highest attendance percentage.

**Excusal integration**: When a player requests an excuse for training, they select which days. Those days are auto-marked as "Excused" in the attendance (counts differently from absent).

**Export**: Attendance data exportable as branded .docx file.

---

## 12. Player Excusal Update

Update the excuse system so the player specifies:
- **Game** or **Training**
- If Training: select which days (Mon–Fri) they won't attend
- Selected days auto-marked as "Excused" in the weekly attendance
- If Game: marked as excused for next game (existing behavior)

---

## 13. Financial Summary — Live Updates

The financial summary section (on Stats page and Fadhir's profile) already has the correct layout. The change is making it **reactive**:

- When Fadhir records a transaction (money in/out), the relevant month's card updates immediately
- When a contribution is approved, that month's contribution total increases by KSh 100
- When a new month begins, a new month card auto-generates with opening balance = previous month's closing balance
- Monthly contribution is **KSh 100** per player — this is hard-coded for calculations
- All math (opening + contributions - expenses = closing) is always accurate

---

## 14. "Our Story" Section

Already creatively redesigned with icons and sections. No content changes needed. Keeping as-is.

---

## 15. Team Badge Integration

Copy the uploaded badge image to `src/assets/suncity-badge.png`. Use it:
- On the login page (replace Sun icon)
- On the dashboard header
- In exported .docx documents
- On the Navbar

---

## 16. Navy Blue Theme Enhancement

Already implemented in CSS. Will ensure more navy blue accents appear in:
- Card borders and section dividers
- Navbar background blend
- Subtle background panels

---

## 17. Export as .docx with Branding

Install the `docx` npm package. Create a utility function that generates professional documents with:
- Suncity FC badge as header image
- Team name and motto
- Formatted data tables
- Professional footer with date and copyright
- Used for both contribution export and attendance export

---

## 18. 3D Lineup Builder

Already implemented and functional. No changes needed unless bugs are found during testing.

---

## Technical Implementation Order

1. **Supabase migrations** — Create all tables, storage buckets, RLS policies
2. **Seed data** — Insert all members, financial records, corrected contributions
3. **Copy badge** — `src/assets/suncity-badge.png`
4. **Install docx** — `npm install docx`
5. **Update `team-data.ts`** — Add new members, rename Travis, fix contributions, clear sample data
6. **Rewrite `TeamDataContext.tsx`** — All reads/writes go through Supabase instead of local state
7. **Update `Dashboard.tsx`** — 3-item limits, event expiry, "Team Members" label, badge
8. **Update `OfficialProfile.tsx`** — Goal scorers on score entry, Fadhir checkbox grid, attendance tracker, contribution section for non-Fabian officials
9. **Update `PlayerProfile.tsx`** — Excusal type selection, attendance display, Supabase profile pic
10. **Update `Stats.tsx`** — Remove remarks, exclude Fabian/Kevin, add permanent game history with scorers, attendance ranking, .docx export
11. **Update `Login.tsx`** — Replace Sun icon with badge
12. **Update `index.css`** — Minor navy blue enhancements

### Files Changed/Created

| File | Action |
|------|--------|
| `src/assets/suncity-badge.png` | Copy from upload |
| `src/data/team-data.ts` | Add members, rename, fix contributions, clear samples |
| `src/contexts/TeamDataContext.tsx` | Major rewrite for Supabase persistence |
| `src/pages/Dashboard.tsx` | Limits, expiry, badge, label change |
| `src/pages/OfficialProfile.tsx` | Checkbox grid, scorers, attendance, contributions |
| `src/pages/PlayerProfile.tsx` | Excusal type, attendance, Supabase storage |
| `src/pages/Stats.tsx` | Game history, attendance, .docx export, exclude coach/manager |
| `src/pages/Login.tsx` | Badge image |
| `src/components/Navbar.tsx` | Badge image |
| `src/index.css` | Minor enhancements |
| `package.json` | Add `docx` dependency |
| Supabase migrations | Multiple table creation SQL files |

This is a large implementation that will be done methodically to ensure every system works correctly and data persists permanently.

