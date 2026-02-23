

# Suncity FC System — Major Update Plan

This is a large update covering login redesign, bug fixes, state management, UI improvements, financial detail, gallery, stats, theme changes, 3D lineup builder, and more.

---

## 1. Login Page Redesign — Single Smart Input (No Tabs)

Remove the Player/Official tabs entirely. Replace with a single "Enter Your ID" input field.

- When user types an ID containing "P" (like SCF-P01), the system knows it's a player — no PIN field appears, login proceeds with ID only.
- When user types an official ID (like SCF-001) with a number after the dash (no "P"), a PIN input field smoothly appears below.
- Officials log in with their official ID (SCF-001, SCF-002, etc.) + PIN — not their username anymore.
- The `authenticateMember` function will be updated to support official login by official ID + PIN.

---

## 2. Fix Stats Page 404

The Navbar links to `/stats` but no route exists in App.tsx. A new Stats page will be created and the route added. This page will show:
- All players grouped by position (if set) with goals, assists, games played.
- Monthly contribution status grid (Dec 2025 - May 2026) for every member.
- Financial summary (visible to everyone — not deep finance, just the overview).
- Export button for officials to download a .txt file of contribution statuses.

---

## 3. Shared Global State — Fix "Updates Don't Reflect" Issue

Currently all data (scores, events, contributions, finances) lives in isolated `useState` within each page. Changes made by officials on their profile don't show on the dashboard.

**Solution**: Create a central `TeamDataContext` (React Context) that holds:
- Game scores, calendar events, media items, financial records, player stats, contribution statuses, pending approvals, and lineup data.
- All pages read from and write to this single source of truth.
- Updates by officials immediately reflect everywhere (dashboard, profiles, stats).

---

## 4. Fix Approval/Reject Buttons

Currently the approval buttons in OfficialProfile are static — they don't update any state. With the new `TeamDataContext`:
- When a player clicks "Mark as Paid" on their profile, it creates a pending approval entry in the shared context.
- When Fadhir or Coach clicks "Accept", the player's contribution status changes from "pending" to "paid" globally.
- When they click "Reject", it reverts to "unpaid".
- The approval entry is removed from the pending list.

---

## 5. Financial Overview — Detailed Monthly Breakdown

Redesign the financial overview to match the PDF provided. Each month gets its own detailed card showing:
- Month name, number of contributors, contributor note
- Opening balance
- Contributions received
- Itemized expenses with dates (e.g., "Feb 15 — Field painting: KSh 200")
- Total expenses
- Closing balance
- The Feb 2026 closing balance will be corrected to **-2,100** (4,800 - 6,900) based on the PDF data showing 750 — will use the PDF figure of **750** as the actual closing.

The summary remarks from the PDF will also be included.

---

## 6. Rename "God" to "Brian(d)"

Simple data change in `team-data.ts` for player SCF-P16.

---

## 7. Reset All Player Stats to 0

Set goals, assists, and gamesPlayed to 0 for ALL players in the initial data. The Manager will update these in real time via a new stats management panel on their profile.

---

## 8. Manager Stats Update Panel

Add a section to the Manager's (and Coach's) profile where they can:
- See a list of all players
- Enter/update goals, assists, and games played for each player
- Changes save to the shared context and reflect everywhere immediately

---

## 9. Profile Picture Upload (Working File Picker)

For both players and officials:
- The upload button will trigger a proper file input that opens the device file picker.
- Selected images are converted to base64 data URLs and stored in the shared context.
- Profile pictures appear on the member's profile, in the team roster on the dashboard, and in player cards.
- Default avatar icons (generated initials) remain as fallback.

---

## 10. Media Gallery — Swipeable with Date Grouping

Replace the placeholder gallery section with a real swipeable carousel:
- Officials upload photos via file picker (multiple files supported).
- Photos are grouped by upload date with clear date headers.
- Users can swipe left/right to browse photos seamlessly.
- Built using the already-installed `embla-carousel-react` library.
- Any player can view and download photos.

---

## 11. Monthly Contribution Status Section (Visible to All)

Add a section (accessible from Stats page or a dedicated area) showing:
- A grid of all members vs months (Dec 2025 - May 2026)
- Each cell shows a tick emoji, dash, or pending icon
- Financial summary below with opening/closing balances per month
- Not on the main dashboard but easily navigable

---

## 12. "Our Story" Section — Creative Redesign

Keep the exact same text but organize it creatively:
- Break long paragraphs into shorter, highlighted segments
- Add relevant icons (flame for origin, shield for struggle, star for coach, heart for acknowledgements, sword for values, handshake for commitment)
- Use colored accent borders/highlights on each section
- Add subtle navy blue accent dividers
- Make it visually engaging with card-style sections, quotes pulled out, and key phrases highlighted in gold

---

## 13. Export Monthly Contributions Button

On the Stats page (officials only):
- "Export Contributions" button
- Generates and downloads a .txt file with clean formatting:
  ```
  SUNCITY FC — Monthly Contribution Status
  =========================================
  Player Name      | Dec 2025 | Jan 2026 | Feb 2026 | ...
  Blaise           |    ✅     |    ✅     |    —     |
  Bronze           |    ✅     |    —     |    —     |
  ...
  ```

---

## 14. Add Navy Blue to Theme

Add navy blue as a secondary accent alongside the gold/black:
- New CSS variable `--navy` added
- Used for subtle backgrounds, dividers, card accents, and the Navbar
- Creates a richer, more premium feel while keeping gold as the primary accent

---

## 15. 3D Lineup Builder for Coach

Create an interactive football pitch component on the Coach's profile:
- A top-down 2D/3D-styled football field using CSS/SVG (realistic look with perspective transform for 3D feel)
- 11 position markers on the field in a standard formation
- Coach can click any position to open a player selector dropdown
- Selected player's name and number appear at that position
- Players can be swapped or removed
- Built with CSS transforms for the 3D perspective effect and framer-motion for interactions

---

## 16. Bug Sweep and Error Prevention

- Fix all buttons that are clickable but non-functional
- Ensure all form submissions properly validate and update shared state
- Add proper error handling and user feedback (toast notifications) for all actions
- Verify all routes work and navigation is consistent
- Ensure file upload inputs are properly wired to onChange handlers

---

## Technical Summary

| Area | Files Changed/Created |
|------|----------------------|
| Login | `src/pages/Login.tsx` — rewrite to single smart input |
| Data | `src/data/team-data.ts` — rename God, reset stats, fix finance data |
| State | `src/contexts/TeamDataContext.tsx` — new shared state context |
| Auth | `src/contexts/AuthContext.tsx` — update for official ID login |
| Routes | `src/App.tsx` — add /stats route, wrap with TeamDataProvider |
| Stats Page | `src/pages/Stats.tsx` — new page with contribution grid + export |
| Dashboard | `src/pages/Dashboard.tsx` — use shared context, improved gallery + Our Story |
| Player Profile | `src/pages/PlayerProfile.tsx` — working upload, shared contributions |
| Official Profile | `src/pages/OfficialProfile.tsx` — working approvals, stats editor, file uploads |
| Navbar | `src/components/Navbar.tsx` — minor fixes |
| 3D Lineup | `src/components/LineupBuilder.tsx` — new component for coach |
| Theme | `src/index.css` — add navy blue variables and accents |

