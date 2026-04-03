

# Remaining Phases + All Requested Updates — Implementation Plan

This plan covers Phase 4, Phase 5, and all additional requests in a single strategic implementation divided into 6 work groups executed sequentially.

---

## GROUP A: WhatsApp FABs, Player ID Hiding, Favicon, Weekly Award Names

### WhatsApp Floating Action Buttons
- Create `src/components/WhatsAppFAB.tsx` — a floating button cluster at bottom-right
- **Two public buttons** (visible without login): Coach WhatsApp (`wa.me/254753310940`) and Manager WhatsApp (`wa.me/254112563036`) with pre-filled message
- **One private button** (visible only to logged-in members): Team Group invite (`https://chat.whatsapp.com/FF9oZ8H8oXPA1jny5Kacs2`)
- WhatsApp green `#25D366`, smooth hover animation, mobile-safe positioning (bottom-20 right-4)
- Render FAB in `App.tsx` outside routes so it appears on all pages
- On Players page, add a dedicated "Join Team WhatsApp" card with the group link

### Hide Player IDs in Player Cards
- `Players.tsx` PlayerCard: Remove the `<p className="text-primary">{member.id}</p>` line
- Player list cards: Remove ID display from the button text

### Update Favicon
- Copy `src/assets/suncity-badge.png` to `public/favicon.png`
- Update `index.html`: add `<link rel="icon" href="/favicon.png" type="image/png">`

### Rename Weekly Award Titles
- In `Stats.tsx` `AWARD_NAMES` array, update to:
  1. ⭐⭐⭐⭐⭐ Top Week Performer
  2. ⭐⭐⭐⭐ Consistent Performer
  3. ⭐⭐⭐ Midfield Driver
  4. ⭐⭐ Defender of the Week
  5. ⭐ Positive Influence
  6. 📈 Most Weekly Improved

---

## GROUP B: Lottie Animation Engine (Complete Implementation)

### Universal Loader
- Update `LottieAnimation.tsx` `LottieLoader` to be a full-screen centered loader
- Replace any loading spinners across pages with `<LottieLoader />`
- Use in Suspense boundaries and data-loading states

### Player Category Dividers
- In `Players.tsx`, after each section's player list (except the last), inject `<LottieAnimation animationData={playersAnimation} className="h-16 w-[150px] md:w-[250px] mx-auto my-3" />`

### Profile Badge (allmembers_profile)
- In `PlayerProfile.tsx` and `OfficialProfile.tsx` profile header: Change avatar layout to `flex flex-row items-center gap-3`, shrink avatar to `w-18 h-18`, add `<LottieAnimation animationData={allmembersProfile} className="w-10 h-10 md:w-16 md:h-16" />` next to it

### Trophy Engine (POTM + Other Awards on Profile)
- In `PlayerProfile.tsx` and `OfficialProfile.tsx` (for captain/Fadhir): 
  - Query `match_awards` for current user, sort by `created_at desc`
  - Store `recentAward` (latest) and `historicalAwards` (rest)
  - Helper: `getAwardAnimation(type)` — returns `manofthematch.json` for POTM, `other_match_rewards.json` for everything else
  - **Recent Honour section**: Below stats card, show animation + award name + reason with `border-2 border-yellow-500 rounded-lg`
  - **Trophy Cabinet modal**: Button "View Award History (N)" opening Dialog with grid of historical awards
  - Awards from weekly/monthly/season overviews also included

### Login Toast Animations
- In `Profile.tsx`: When POTM detected, show the `manofthematch.json` animation in a toast-like overlay for 3 seconds
- For non-POTM awards, show `other_match_rewards.json` overlay
- Weekly overview recognized players also get `other_match_rewards.json` toast

### Page Animation Sizing
- Slightly increase all page-top animations from `h-28` to `h-36`

---

## GROUP C: Financial System Fixes + Export Enhancement

### Financial Month Reactivity
- In `OfficialProfile.tsx` `handleRecordTransaction`: Use the selected `finMonth` to determine which month's record to update, not the current month
- When a transaction is entered for a past month (e.g., March data entered in April), insert it under that month's financial_records entry
- Recalculate closing balances for that month and all subsequent months

### Financial Summary DOCX Enhancement
- In `docx-export.ts`: Update `exportFinancialPdf` to add emojis (💰, 📊, 📈, 💵), colored headers, contributor names with ✅/⬜ per month, and summary stats
- Match the visual richness of the detailed player profile DOCX

### Contribution Events Integration to Financial Summary
- When a contribution event payment is toggled, calculate the total collected and add it to the relevant month's financial record
- Show event label in financial overview cards

### Fadhir Contribution Toggle
- Change Fadhir's contribution management from table checkboxes to a Switch-style toggle matching the manager's attendance toggle (same shape and layout)

---

## GROUP D: Match Recorder UX + Match Reports Fix

### Smart Player Selector
- In `OfficialProfile.tsx` match perf recorder: When a game is selected, query `match_performances` for that game to get already-recorded players
- Sort player dropdown: players from last match who haven't been recorded yet appear first, then rest
- Players already recorded for THIS game are hidden from the dropdown (not removed, just filtered out)

### Match Day Reports Fix
- In `Stats.tsx` match report table: Currently shows zeros — ensure it reads actual `match_performances` data
- Add position-specific stat columns: show tackles for DEF, saves for GK, goals/assists for ATT/MID
- This already seems to work based on code (lines 700-714) — verify data is being loaded correctly in `matchPerformances` from context

---

## GROUP E: DOCX Export Improvements + Captain/Fadhir Exports

### Profile Pic Fix in DOCX
- In `fetchImageAsBuffer`: Try fetching the full URL first (with query params), then fallback to cleaned URL
- Add proper error handling and CORS retry with `mode: 'cors'`

### Detailed Export: All Weekly Attendance
- Query ALL `attendance` records for the player (not just current week)
- Group by `week_start` and display compactly in DOCX: each week as a row with emoji grid

### Detailed Export: Full Match History with Stats
- Include all match performances from `match_performances` table per game
- Show opponent, date, venue, result, and the player's individual stats for that game
- Highlight best and lowest performing matches

### DOCX Mobile Optimization
- Use `WidthType.DXA` for all table widths (never percentage)
- Set page margins to 0.5" (720 DXA)
- Add cell padding, reduce font sizes slightly for mobile doc viewers
- Ensure A4 portrait fit

### Captain & Fadhir Export
- Add export buttons to captain and Fadhir profiles in `OfficialProfile.tsx`
- Include all match history from `player_game_log` + `match_performances`
- Include their role, position, all games played with stats

---

## GROUP F: Google OAuth, SEO, Guest Role, Coach Notifications

### Google Login
- Add "Sign in with Google" button to Login page using `supabase.auth.signInWithOAuth({ provider: 'google' })`
- On first Google login: check `members` table for matching `google_id`
  - If not found: show one-time ID-linking screen
  - If found: log in directly with that member's data
- For unregistered users: assign "guest" role with read-only access

### Guest Role Restrictions
- In `App.tsx`: Create `GuestRoute` that only allows Home, Story, Gallery
- Hide all edit buttons, manager tabs, financial data from guests
- Show onboarding message for guest users

### SEO Architecture
- Install `react-helmet-async`
- Add `<HelmetProvider>` to `App.tsx`
- Add `<Helmet>` with dynamic `<title>` and `<meta>` tags per page
- Generate static `public/sitemap.xml` with all routes
- Update `public/robots.txt` to point to sitemap

### Coach Notification for Inactive Players
- On coach profile mount: Query players with 0 games_played but >70% attendance and >2 paid months
- Display notification card: "🔔 Active but unplayed: [names]"

### Manager in Attendance
- Already done in Phase 1 (playerMembers filter includes manager role) — verify

---

## GROUP G: Final QA Pass (After all groups complete)

- Verify all attendance toggle works without glitch (race condition check)
- Verify financial summary calculations are correct across months
- Verify POTM calculation fairness
- Verify weekly/monthly/season overviews open correctly and show accurate data
- Verify Beavon excluded from grids but stats recordable
- Verify all exports generate correctly and are mobile-readable
- Verify animations render at correct sizes without layout shifts
- Verify WhatsApp links work correctly
- Verify Google login flow works end-to-end
- Strengthen any weak logic found during review

---

## Files Changed Summary

| Group | Files |
|-------|-------|
| A | `Players.tsx`, `Stats.tsx`, `index.html`, new `WhatsAppFAB.tsx`, `App.tsx` |
| B | `LottieAnimation.tsx`, `Players.tsx`, `PlayerProfile.tsx`, `OfficialProfile.tsx`, `Profile.tsx`, `Dashboard.tsx`, `Results.tsx`, `Stats.tsx` |
| C | `OfficialProfile.tsx`, `docx-export.ts`, `TeamDataContext.tsx` |
| D | `OfficialProfile.tsx`, `Stats.tsx` |
| E | `docx-export.ts`, `OfficialProfile.tsx`, `PlayerProfile.tsx` |
| F | `App.tsx`, `Login.tsx`, `AuthContext.tsx`, `index.html`, `robots.txt`, new `sitemap.xml` |
| G | All files — review and fix pass |

No new database migrations needed — all required tables and columns already exist.

