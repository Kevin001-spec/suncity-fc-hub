

# Massive System Update — Phased Implementation Plan

This covers all requested updates across 5 implementation phases. Each phase is self-contained and must complete before the next begins.

---

## PHASE 1: Data Fixes, Beavon Exclusion, Attendance Glitch, Remove Brian (d), Add Manager to Attendance

### 1A. Exclude Beavon (SCF-P40) from contributions, attendance, performance tables
- In `OfficialProfile.tsx`: Add `m.id !== "SCF-P40"` to `playerMembers` filter (line 270) for attendance and contributions sections, but keep him in match perf recorder
- In `Stats.tsx`: Add same filter to `contributionMembers`, `attendanceRanking`, `performanceMembers`
- His stats remain recordable and downloadable — only excluded from contribution/attendance/performance grids

### 1B. Fix attendance toggle glitch
- Root cause: The `updateAttendance` function in `TeamDataContext.tsx` likely has a race condition — multiple rapid upserts conflict. Fix by adding optimistic local state update and debouncing the Supabase call, or by using a queue to serialize updates

### 1C. Remove "Brian (d)" from system
- Delete from `members` table via insert tool: `DELETE FROM members WHERE name = 'Brian (d)'` or matching ID
- Remove from fallback data in `team-data.ts` if present

### 1D. Add fans to removable list in coach section
- In the "Remove Player" section of `OfficialProfile.tsx`, change the dropdown to include fans: add `|| m.role === "fan"` to the filter

### 1E. Add Manager (SCF-003) to weekly attendance system
- In `OfficialProfile.tsx` attendance table (line 1529): Change `playerMembers` to also include manager role
- In `Stats.tsx` `attendanceRanking`: Include manager in the filter

### 1F. Coach notification for inactive players
- On coach profile mount, query `match_performances` for players with 0 games and check attendance > 70% and contributions > 2 paid months
- Display a card: "🔔 Active but unplayed: [names]"

**Files: `OfficialProfile.tsx`, `Stats.tsx`, `TeamDataContext.tsx`, `team-data.ts`, DB insert tool**

---

## PHASE 2: Tracking System Overhaul (Weekly/Monthly/Season Awards)

### 2A. Fix weekly overview "top rated" logic
Current bug: `weeklyData.top3` sorts by `(goals + assists)` only — players with 0 stats can appear. Fix:
- New scoring formula: `(gamesPlayed * 15) + (goals * 30) + (assists * 20) + (successfulTackles * 5) + (saves * 10) + (attendancePct * 0.5) + (paidContribs * 10)`
- Filter: Only include players with `gamesPlayed > 0 OR attendancePct >= 80`
- Expand to 6 players with unique achievement names and star ratings (6 to 1 stars):
  1. ⭐⭐⭐⭐⭐⭐ "The Commander" — highest overall score (reason why)
  2. ⭐⭐⭐⭐⭐ "The Warrior" — second highest
  3. ⭐⭐⭐⭐ "The Engine" — third
  4. ⭐⭐⭐ "The Rock" — fourth
  5. ⭐⭐ "The Spark" — fifth
  6. ⭐ "The Rising Force" — sixth

### 2B. Monthly overview — fix and enable
- Aggregate data from 3+ weekly archives
- Calculate: best average attendance, most consistent performer, most improved across weeks
- Awards: "Monthly MVP", "Iron Man" (best attendance), "Most Consistent", "Growth Machine", "Silent Hero", "The Backbone"
- Auto-generate when 3 weekly reports exist; use fair calculations from actual data

### 2C. Season overview — fix and enable
- Aggregate all monthly data for the season period
- Calculate: season-long best performers, most reliable, biggest transformation
- Awards: "Season MVP", "Golden Boot", "Unbreakable" (best attendance), "Rising Legend", "Heart of the Team", "Mr. Reliable"
- Trigger when season end date passes

### 2D. Invent additional post-match awards (expand from 6)
Beyond existing POTM, Defensive Wall, Sharpshooter, Playmaker, Iron Wall, Rising Star — add:
- "🎩 Hat-trick Hero" (3+ goals)
- "🔒 Lockdown" (defender with 0 goals conceded + tackles > 8)
- "👟 Engine Room" (highest combined tackles + assists for midfielders)

### 2E. Duplicate detection in data entry
- In `handleAddMatchPerf`: Before inserting, check if `match_performances` already has an entry for this `player_id + game_id`. If yes, show warning toast and skip insert.
- Same for `handleUpdateStats`: Compare old vs new values and warn if identical

**Files: `Stats.tsx`, `OfficialProfile.tsx`, `TeamDataContext.tsx`**

---

## PHASE 3: Animations, Lottie Integration, App Icon

### 3A. Install lottie-react and copy animation files
- Copy all 7 uploaded JSON files to `src/assets/animations/`
- Install `lottie-react` dependency

### 3B. Animation placement:
- **allmembers_profile.json** → All member profiles (officials, fans, players) — horizontally next to profile pic, reduce pic size to make room. Stays permanently.
- **universalloadingscreen.json** → Create a `<LottieLoader>` component, use it for all loading states across all pages
- **manofthematch.json** → Toast on login for POTM player, then persistent on their profile pic area until next match
- **dashboardanimation.json** → Dashboard page, below team motto, with decorative borders
- **resultsanimation.json** → Top of Results page permanently, resized to fit, animation plays then data loads below
- **statsanimation.json** → Top of Stats page permanently
- **playersanimation.json** → Top of Players page permanently + between each position group section (GK/DEF/MID/ATT separators)
- **other_match_rewards.json** → Toast on login for non-POTM award winners, persistent section next to profile pic with border and reason text

### 3C. Change app icon
- Use the team badge (`suncity-badge.png`) as the favicon in `index.html`
- Generate appropriate icon sizes or reference the badge directly

**Files: New `src/components/LottieAnimation.tsx`, all page files, `index.html`, new asset copies**

---

## PHASE 4: Export System Fixes, DOCX Improvements, Captain/Fadhir Exports

### 4A. Fix profile pic not visible in DOCX
- Debug `fetchImageAsBuffer` — the Supabase storage URL may need auth token or proper CORS handling
- Try fetching with the full URL including query params

### 4B. Detailed export enhancements
- Include ALL past weekly attendance data (query all `attendance` records, group by week)
- Show weekly attendance compactly (week start + emoji grid per week)
- Include all match history with opponent, date, venue, stats, result
- Include monthly/season achievements if applicable
- Add emojis throughout for achievements and recognitions

### 4C. DOCX mobile optimization
- Increase column widths, reduce font sizes slightly
- Use `WidthType.DXA` throughout (never percentage)
- Add cell margins/padding for readability
- Ensure table fits within A4 portrait with 0.5" margins

### 4D. Match day reports fix — show actual player stats
- In Stats.tsx match report table: Show position-specific stats (tackles for DEF, saves for GK, goals/assists for ATT/MID) instead of just goals/assists

### 4E. Captain and Fadhir export features
- Add detailed export button to captain profiles and Fadhir's profile
- Include all their match history from `player_game_log` + `match_performances`
- Include all games played, their stats per game, and their role

### 4F. Manager export toggle for detailed exports
- Already has `export_enabled` in `season_config` — ensure the toggle card works in manager profile
- Detailed export available on weekends OR when manager enables it

**Files: `docx-export.ts`, `PlayerProfile.tsx`, `OfficialProfile.tsx`, `Stats.tsx`**

---

## PHASE 5: Google Login, SEO, Guest Role, Homepage Restructure

### 5A. Google OAuth integration
- Add `@supabase/auth-helpers-react` if needed
- Add "Sign in with Google" button on login page
- On first Google login: check if email exists in `members` table
  - If not found: show one-time setup screen to enter SunCity FC ID and link
  - If found: log in directly
- Save Google user ID to `members` table (new column `google_id`)
- For unregistered users: assign "guest" role with read-only access to public pages

### 5B. Homepage restructure
- Move login section to the very bottom
- Move homepage carousel photos to Dashboard
- Remove "Team Media" from Dashboard (it's in Stats gallery)
- Allow full homepage browsing without login
- On reaching profile section: prompt Google login or ID entry

### 5C. Guest role restrictions
- Guests can only view: Home, Story, Gallery (public pages)
- Hide: Edit buttons, Manager tabs, Financial data, Profile editing
- Show message: "Welcome to the Suncity FC Portal. If you are a registered player, please enter your Player ID to access your profile."

### 5D. SEO architecture
- Install `react-helmet-async`
- Add dynamic `<title>` and `<meta>` tags per page
- Player profiles: `<title>[Player Name] - SunCity FC Profile</title>`
- Generate `public/sitemap.xml` with all routes
- Update `robots.txt` to point to sitemap
- Ensure "Our Story" and public stats render without auth

### 5E. Dynamic meta tags per route
- Home: "SunCity FC | Official Team Site"
- Dashboard: "SunCity FC Dashboard"
- Stats: "SunCity FC Statistics & Performance"
- Results: "SunCity FC Match Results"
- Players: "SunCity FC Squad & Player Profiles"
- Profile: "[Player Name] - SunCity FC Profile"

**Files: `App.tsx`, `Login.tsx`, `Dashboard.tsx`, `AuthContext.tsx`, `index.html`, new `public/sitemap.xml`, all page files**

---

## Database Changes Required

### Migration 1: Google auth support
```sql
ALTER TABLE members ADD COLUMN IF NOT EXISTS google_id text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_members_google_id ON members(google_id) WHERE google_id IS NOT NULL;
```

### Data operations (insert tool):
- Delete "Brian (d)" from members
- Clean up any duplicate data entries

---

## Files Changed Summary

| Phase | Files |
|-------|-------|
| 1 | `OfficialProfile.tsx`, `Stats.tsx`, `TeamDataContext.tsx`, `team-data.ts`, DB inserts |
| 2 | `Stats.tsx`, `OfficialProfile.tsx`, `TeamDataContext.tsx` |
| 3 | New `LottieAnimation.tsx`, 7 animation assets copied, all page files, `index.html` |
| 4 | `docx-export.ts`, `PlayerProfile.tsx`, `OfficialProfile.tsx`, `Stats.tsx` |
| 5 | `App.tsx`, `Login.tsx`, `Dashboard.tsx`, `AuthContext.tsx`, `index.html`, `sitemap.xml`, all pages |

Total: ~15 files modified/created, 1 migration, several data operations

