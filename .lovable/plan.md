

# Final System Update: Homepage Removal, Auth Rearchitecture, Carousels, Financial Fixes, Awards & QA

## Summary

Remove the standalone homepage/login page. Make Dashboard the entry point (`/`). Dashboard, Stats, Players, Results are public. Profile requires login (shows login UI inline). Copy uploaded carousel animation files. Fix Google OAuth persistence. Implement financial system reactivity. Deploy trophy cabinet with retroactive awards. Add member ID registry to coach profile.

---

## Architecture Change: Remove Homepage, Make Dashboard Public

### `src/App.tsx`
- Remove `Login` lazy import and its route
- Change `"/"` route to render `<Dashboard />`
- Remove `ProtectedRoute` wrapper from Dashboard, Stats, Players, Results
- Keep `ProtectedRoute` ONLY on `/profile`
- `ProtectedRoute` now redirects to `/profile` login UI instead of `"/"`
- Remove guest feature entirely

### `src/pages/Dashboard.tsx`
- Remove `if (!user) return <Navigate ... />`
- Wrap the Team Gallery (MediaGallery) section in `{user && ...}` so only logged-in users see it
- Move homepage carousel images section here (visible to all) — actually keep existing structure, just gate media behind auth
- Add `dashboardc1`, `dashboardc2`, `dashboardc3` animations to the LottieCarousel array alongside existing `dashboardAnimation`

### `src/pages/Stats.tsx`, `src/pages/Results.tsx`, `src/pages/Players.tsx`
- Remove `if (!user) return <Navigate ... />` — make pages public
- Stats/Players: Add `statsnplayerspagec1`, `statsnplayerspagec2` to their LottieCarousel arrays alongside existing animations

### `src/pages/Profile.tsx`
- If `!user && !isLinking`: Show a login UI (not redirect) with the results animation carousel on top, then the member ID input + Google sign-in button + PIN field
- Remove the `<Navigate>` redirect — instead render inline login form
- Add a multi-page carousel at top using ALL animations from dashboard + stats + players + profile carousels
- After successful login, render PlayerProfile or OfficialProfile as before

### `src/components/Navbar.tsx`
- Show navbar even when `!user` — but hide Profile link and logout for non-logged-in users
- Show Home, Results, Players, Stats always; Profile + Logout only when logged in

---

## Carousel Animation Files

### Copy uploaded files to `src/assets/animations/`:
- `dashboardc1.json`, `dashboardc2.json`, `dashboardc3.json`
- `everyoneprofilecarrousel1.json`, `everyoneprofilecarrousel2.json`, `everyoneprofilecarrousel3.json`, `everyoneprofilecarrousel5.json`
- `statsnplayerspagec1.json`, `statsnplayerspagec2.json`

### Carousel integration:
| Page | Animation array |
|------|----------------|
| Dashboard | `[dashboardAnimation, dashboardc1, dashboardc2, dashboardc3]` |
| Stats | `[statsAnimation, statsnplayerspagec1, statsnplayerspagec2]` |
| Players | `[playersAnimation, statsnplayerspagec1, statsnplayerspagec2]` |
| Profile (everyone) | `[allmembersProfile, everyoneprofilecarrousel1, everyoneprofilecarrousel2, everyoneprofilecarrousel3, everyoneprofilecarrousel5]` |
| Profile login screen | All of the above combined |
| Category dividers (Players) | `[playersAnimation, statsnplayerspagec1, statsnplayerspagec2]` |

### Animation size increase:
- Page-top carousels: keep `h-44` (already increased)
- Profile badge: already `w-16 h-16 md:w-24 md:h-24`

---

## Google OAuth Persistence Fix

### `src/contexts/AuthContext.tsx`
- In `onAuthStateChange`: After finding linked member, also persist to `localStorage` immediately (already done — verify it works)
- On mount `getSession()`: If session exists AND localStorage has `suncity_user`, trust localStorage (don't re-query and overwrite)
- Key fix: When returning from Google OAuth redirect, the `SIGNED_IN` event fires but if user is already set via localStorage, skip the linking screen
- Add guard: if `user` is already set from localStorage, don't show linking screen even if `onAuthStateChange` fires

### `src/pages/Profile.tsx` (login UI)
- Update linking screen heading to: **"Link your SunCity ID with your Google account."**
- Subtext: "You only need to do this once to permanently secure your account."

---

## Financial System Fixes

### `src/pages/OfficialProfile.tsx`

**Month-reactive transactions:**
- `handleRecordTransaction`: Use `finMonth` (already selected by user) to determine which month's `financial_records` entry to update
- After inserting the transaction, recalculate closing balances for that month and all subsequent months
- The `finDate` should be used for the expense date label but the `finMonth` determines which record it belongs to

**Fadhir contribution toggle:**
- Replace checkbox-based contribution UI with Switch toggles matching the attendance toggle style
- Add small Input next to each member for custom amount (default 100)
- When toggled with custom amount, update `contributions` table and adjust `financial_records`

**Captain contribution events → financial summary integration:**
- When a contribution event payment is toggled, calculate total collected and update the relevant month's `financial_records`
- Show event label in financial overview cards

**Financial DOCX export enhancement:**
- Add emojis (💰📊📈💵) to headers
- Add contributor names with ✅/⬜ per month
- Match the richness of the player profile DOCX

---

## Match Recorder UX (Smart Player Selector)

### `src/pages/OfficialProfile.tsx`
- When `perfGameId` is selected, query `match_performances` for that game to find already-recorded players
- Filter them OUT of the player dropdown (they don't appear)
- Query last match's players and sort them first in the dropdown
- Make the dropdown more visually appealing (show position, avatar)

---

## Awards & Trophy Cabinet

### Retroactive award sweep
- Awards already exist in `match_awards` table (confirmed from DB query above)
- `PlayerProfile.tsx` already loads awards and shows Recent Honour + Trophy Cabinet
- **Split trophy cabinet** into two sections:
  1. "⚔️ Match Honours" — from `match_awards` table
  2. "🏅 Season Recognition" — weekly recognized (most disciplined, top rated)

### Weekly recognized awards on profiles
- When weekly overview is locked, the recognized players (top rated, most disciplined) get awards placed on their profile
- These stay until the next weekly overview is locked
- Toast on login for weekly recognized players using `otherMatchRewards` animation

### Manager notification card
- Add a card in manager's profile showing all current system awards pending trophy animations
- Show "🔔 Awards requiring attention: [list]"

---

## Member ID Registry (Coach Profile)

### `src/pages/OfficialProfile.tsx`
- Add a collapsible card on coach's profile: "📋 Member ID Registry"
- Show a table of ALL members with their ID and name, sorted alphabetically
- This way the manager always knows the IDs when adding new members
- When a new player/fan is added, the `addedFanId` toast already shows the ID — keep that

---

## Favicon
- Already copied to `public/favicon.png` and linked in `index.html` — verify

---

## WhatsApp FAB Smoothness
- Already uses spring transitions — add `layout` prop to main button for smoother toggle

---

## Files Changed Summary

| Area | Files |
|------|-------|
| Architecture | `App.tsx`, `Profile.tsx`, `Navbar.tsx` |
| Public pages | `Dashboard.tsx`, `Stats.tsx`, `Players.tsx`, `Results.tsx` |
| Auth | `AuthContext.tsx` |
| Animations | 9 new JSON files copied to `src/assets/animations/` |
| Financial | `OfficialProfile.tsx`, `docx-export.ts` |
| Awards | `PlayerProfile.tsx`, `OfficialProfile.tsx`, `Profile.tsx` |
| UX | `WhatsAppFAB.tsx` |

No new database migrations needed.

