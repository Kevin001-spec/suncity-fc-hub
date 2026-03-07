

# System Update Plan

## 1. Fix Add Player Name Bug + Fix P36

**Root cause**: `addPlayer` generates ID as `SCF-P${String(squadNumber).padStart(2, "0")}`. When adding a player with squad number 36, it creates `SCF-P36` which may collide with existing data. Also, the profile page reads from `members` (Supabase), while the players list also reads from `members` — so the name mismatch happens when the DB has stale/wrong data for that ID.

**Fix**: 
- Update P36 name in DB from "Kibeh" to "Oscar" via data update
- Change `addPlayer` to generate unique IDs using a counter query: `SELECT MAX(CAST(SUBSTRING(id, 6) AS INT)) FROM members WHERE id LIKE 'SCF-P%'` + 1, ensuring no collisions
- Also refresh the user in localStorage after login so profile always uses live DB data

**Files**: `src/contexts/TeamDataContext.tsx` (addPlayer function), DB data fix

## 2. Move "Add Recent Results" + "Add Events" to Manager & Captains Only

Currently at lines 511 and 539, both are `isCoach` only. Change:
- Remove from coach profile
- Show for `isManager || isCaptain`

**Files**: `src/pages/OfficialProfile.tsx` — change conditions on lines 511 and 539

## 3. Add Assistant Coach "Clyn"

- Add new role `"assistant_coach"` to the Role type
- Insert Clyn into `members` table with role `assistant_coach`, give username/pin for login
- Update `AuthContext` so `isOfficial` includes `assistant_coach`
- In `OfficialProfile.tsx`: assistant coach can upload photos and mark attendance only (same as `canUploadMedia` and `canManageAttendance` expanded)
- Update `Profile.tsx` to route `assistant_coach` to OfficialProfile

**Files**: `src/data/team-data.ts` (Role type), `src/contexts/AuthContext.tsx`, `src/pages/OfficialProfile.tsx`, `src/pages/Profile.tsx`, DB insert

## 4. Add Fans Feature

- Add role `"fan"` to the Role type
- In the "Add New Player" section (coach/manager), add a dropdown to choose between "Player" and "Fan"
- Fans appear on Stats page below Officials section
- Fan profile: can upload photos, view stats (read-only). Use `PlayerProfile` but with limited sections, or route to OfficialProfile with fan-specific permissions
- Fans show in a "Fans" section on the Stats page

**Files**: `src/data/team-data.ts`, `src/pages/OfficialProfile.tsx` (add fan option), `src/pages/Stats.tsx` (fans section), `src/pages/Profile.tsx` (routing), `src/pages/PlayerProfile.tsx` or new FanProfile

## 5. Amateur Standings

- Create `amateur_standings` table (same schema as `league_teams` but for amateur division) — or reuse `league_teams` with a `division` column
- Better approach: add a `division` TEXT column to `league_teams` table (default 'league', can be 'amateur')
- Manager can add/edit amateur teams on their profile (similar to league standings editor)
- Results page shows Amateur Standings below League Standings

**DB migration**: `ALTER TABLE league_teams ADD COLUMN division TEXT NOT NULL DEFAULT 'league';`
**Files**: `src/pages/OfficialProfile.tsx` (amateur editor), `src/pages/Results.tsx` (amateur table)

## 6. Fix Stretched Official Profile Pics on Stats Page

Line 403-404 in Stats.tsx: the Avatar for officials doesn't have the `aspect-square object-cover` classes.

**Fix**: Add `className="aspect-square object-cover object-center"` to the AvatarImage in the officials grid.

**Files**: `src/pages/Stats.tsx` line 404

## 7. Add Player Stats to Captain Profiles

Currently captains route to `OfficialProfile` which doesn't show personal stats (goals, assists, etc.). Add a personal stats card section to `OfficialProfile` for captains, similar to what `PlayerProfile` shows — position-specific stat cards, weekly attendance display, and monthly contributions.

**Files**: `src/pages/OfficialProfile.tsx` — add captain stats section after profile header

## 8. Universal Messaging System

Currently players can only message 3 officials. Expand:
- **PlayerProfile**: Change recipient dropdown to list ALL members (players + officials)
- **OfficialProfile**: Expand the existing inbox to also show a "Send Message" section where officials can select any team member as recipient
- On login, check for unread messages and show a toast notification: "You have X unread messages"

**Files**: `src/pages/PlayerProfile.tsx` (expand recipient list), `src/pages/OfficialProfile.tsx` (add send message section for all officials), `src/contexts/AuthContext.tsx` or `src/pages/Profile.tsx` (unread notification on login)

## 9. CSS & Badge Fixes

- Strengthen Lovable badge CSS hiding in `src/index.css`

---

## Summary of Changes

| File | Changes |
|------|---------|
| DB data update | Fix P36 name to "Oscar", insert Clyn as assistant_coach |
| DB migration | Add `division` column to `league_teams` |
| `src/data/team-data.ts` | Add `assistant_coach` and `fan` to Role type |
| `src/contexts/AuthContext.tsx` | Include `assistant_coach` in `isOfficial` |
| `src/contexts/TeamDataContext.tsx` | Fix `addPlayer` ID generation (auto-increment), add fan role support |
| `src/pages/OfficialProfile.tsx` | Move scores/events to manager+captain, add assistant_coach permissions, add fan adding, amateur standings editor, captain stats section, universal send message, expand inbox |
| `src/pages/Stats.tsx` | Fix official pic stretching, add Fans section below officials |
| `src/pages/Results.tsx` | Add Amateur Standings table |
| `src/pages/PlayerProfile.tsx` | Expand messaging to all members |
| `src/pages/Profile.tsx` | Route `assistant_coach` and `fan` roles |
| `src/index.css` | Strengthen Lovable badge hiding |

