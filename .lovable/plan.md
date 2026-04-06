# Remaining Updates: Carousel Speed, SEO Fix, Role Manager, Lineup Integration, Player IDs, Public Results & System Tightening

## Summary

Complete all leftover work plus new requests in one implementation pass.

---

## 1. Carousel Interval: 6000ms → 3000ms

- `src/components/LottieCarousel.tsx` line 11: Change default `interval` from `6000` to `3000`
- All carousels site-wide automatically pick up the change

## 2. SEO: Karatina University (Not Nairobi)

- `index.html`: Update ALL references from "Nairobi" to "Karatina, Nyeri County" — title, meta description, OG tags, Twitter tags, JSON-LD schema `addressLocality`, `description`
- Add "Karatina University" to `alternateName` and keywords
- Each page's `<Helmet>` in `Dashboard.tsx`, `Stats.tsx`, `Players.tsx`, `Results.tsx`, `Profile.tsx`: update descriptions to mention "Karatina University"
- `public/sitemap.xml`: ensure all routes listed with correct URLs
- `public/robots.txt`: already correct

## 3. Results & Events Visible to Non-Logged-In Users

- `Results.tsx`: Already public (no auth redirect). Verify calendar events are shown — currently events come from `useTeamData()` context which loads for all. No change needed if already loading. Check that contribution events section isn't gated behind auth.
- `Dashboard.tsx`: Ensure calendar events section is visible to all (not gated by `{user && ...}`)

## 4. Return Player IDs in Cards

- `Players.tsx` line 112: Re-add `<p className="text-xs text-primary font-body">{member.id}</p>` under the player name
- `PlayerCard` modal: Add ID display under name
- `handleAddPlayer` in `OfficialProfile.tsx`: Already shows ID in toast — verify and keep

## 5. Manager: Role Editor (Promote/Demote Officials)

- `OfficialProfile.tsx`: Add new card visible only to Manager (`isManager`)
- Title: "👔 Role Management"
- UI: Dropdown to select any member → Dropdown to pick role (`player`, `captain`, `coach`, `manager`, `finance`, `assistant_coach`, `fan`) → Save button
- Logic: `supabase.from("members").update({ role: newRole }).eq("id", selectedMemberId)`
- After save, call `refreshData()` to reload members
- Safety: Cannot change own role, cannot demote the only manager

## 6. Coach's 3D Lineup ↔ First 11 Integration

- `LineupBuilder.tsx`: When `assignPlayer` is called, also update the parent's `selectedFirst11` state
- Approach: Add an `onFirst11Change` callback prop to `LineupBuilder`
- In `OfficialProfile.tsx` where `<LineupBuilder />` is rendered (line 1698), pass `onFirst11Change` that syncs `selectedFirst11` state
- When a player is assigned to any position in the 3D field, add them to `selectedFirst11` (if not already, max 11)
- When removed from field, remove from `selectedFirst11`
- Reverse: When a player is toggled as "Starting" in First 11 selector, it doesn't auto-place them on the field (that requires position knowledge), but the data stays in sync for export

## 7. Financial System Remaining Fixes

### Fadhir Contribution Toggle (Switch style)

- `OfficialProfile.tsx` lines 1416-1457: Replace the `<Checkbox>` per month with a `<Switch>` toggle, same visual style as attendance toggles
- Add a small `<Input>` next to each member row for custom amount (default 100), stored alongside contribution status

### Month-Reactive Financial Entries

- `handleRecordTransaction` (around line 400-450): When `finMonth` is a past month, insert the expense under that month's `financial_records` entry, not the current month
- After inserting, recalculate closing balances for that month and all subsequent months by iterating through `financialRecords` sorted by month

### Contribution Events → Financial Summary Integration

- When `toggleContribPayment` is called and payment is toggled to paid, calculate total collected for that event and update the relevant month's `financial_records` contribution total

### Financial DOCX Enhancement

- `exportFinancialPdf` in `OfficialProfile.tsx`: Add emojis (💰📊📈) to section headers, add contributor names with ✅/⬜ per month, summary statistics at the end

## 8. Smart Match Recorder Player Selector

- `OfficialProfile.tsx` match perf section (around line 930-990 where `perfPlayerId` dropdown is rendered):
  - When `perfGameId` is selected, query `match_performances` for that game to get already-recorded player IDs
  - Filter those players OUT of the dropdown
  - Query the most recent previous game's `match_performances` to get "last match players" — sort them first
  - Show position badge next to each player name

## 9. Award System Tightening

- Awards already exist in DB (confirmed: potm, defensive_wall, sharpshooter, iron_wall, rising_star, engine_room across multiple games)
- `PlayerProfile.tsx` already loads `match_awards` and displays Recent Honour + Trophy Cabinet
- Verify `getAwardAnimation()` in `award-animations.ts` maps all award types to correct animation files
- Ensure weekly overview recognized players (most disciplined, top rated) get `otherMatchRewards` toast on login and badge on profile
- Add weekly awards to the "Season Recognition" section of trophy cabinet

## 10. Manager Awards Notification Card

- `OfficialProfile.tsx`: Add a card for Manager showing recent match awards across all games
- Query `match_awards` grouped by `game_id`, show which players got what
- Purpose: Manager awareness of all system-generated awards

## 11. Member ID Registry on Coach Profile

- Already discussed but not implemented
- `OfficialProfile.tsx`: Add collapsible card on coach's profile showing ALL members with ID and name, sorted alphabetically
- Simple table: ID | Name | Role | Position

## 12. System Tightening & Auto-Improvements

- Verify `sync_match_perf_to_member` trigger exists (it does as a function but trigger may not be attached) — if not attached, create migration to attach it
- Ensure duplicate match performance detection works correctly
- Verify financial balance cascading logic
- Ensure all number inputs use the `onFocus`/`onBlur` pattern to handle sticky zeros
- Ensure the google authentication with ID linking  works smoothly and correctly, no errors. also when someone enters their ID first instead of google, accept the ID then prompt them  the only way to enter is by linking with their google account, after succcesful google account selection now they can succesfully login. so the point is they can press the google button first then enter their ID ,or they can start by entering their correct ID, then accept the correct ID then prompt them to link the google account since they cant proceed withount linking the google account. ensure this procedure will have no errors bugs or anything that will interfere its smooth process and authentication, also welcome the user  with a notification toast with their name such as `welcome Kevin` but using their name.

---

## Files Changed Summary


| File                                | Changes                                                                                                    |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/components/LottieCarousel.tsx` | Default interval 6000→3000                                                                                 |
| `index.html`                        | SEO: Nairobi→Karatina University, enhanced keywords                                                        |
| `public/sitemap.xml`                | Verify all routes                                                                                          |
| `src/pages/Dashboard.tsx`           | SEO meta update, ensure events visible                                                                     |
| `src/pages/Stats.tsx`               | SEO meta update                                                                                            |
| `src/pages/Players.tsx`             | SEO meta, re-add player IDs in cards                                                                       |
| `src/pages/Results.tsx`             | SEO meta, ensure events visible to all                                                                     |
| `src/pages/Profile.tsx`             | SEO meta update                                                                                            |
| `src/pages/OfficialProfile.tsx`     | Role editor, ID registry, financial fixes, smart player selector, awards notification, lineup↔first11 sync |
| `src/components/LineupBuilder.tsx`  | Add `onFirst11Change` callback prop                                                                        |
| `src/lib/award-animations.ts`       | Verify all mappings                                                                                        |
| `src/contexts/TeamDataContext.tsx`  | Verify trigger, add `updateMemberRole` method                                                              |


Possible migration: Attach `sync_match_perf_to_member` trigger to `match_performances` table if not already attached.