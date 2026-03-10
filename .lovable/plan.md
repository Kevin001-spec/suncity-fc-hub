

# Fix Match Stats Integration, Data Recovery, Messaging, Login Badges

## Root Cause Confirmed

**`addMatchPerformance`** (TeamDataContext.tsx line 743) inserts into `match_performances` but **never updates the `members` table**. That is why all player profiles show zeros despite stats being recorded. The data exists in `match_performances` — it just never flows to `members`.

## Verified Data from Supabase

Second batch recordings (2026-03-09 10:40-10:48, the correct data):

| Player | Position | Successful Tackles | Interceptions | Goals | Assists | Saves | Aerial Duels | Shots on Target | Games Played |
|--------|----------|-------------------|---------------|-------|---------|-------|-------------|----------------|-------------|
| SCF-P12 (Mugi Jr) | ATT | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| SCF-005 (Denoh) | MID | 7 | 0 | 0 | 0 | 0 | 0 | 1 | 1 |
| SCF-P25 (Morgan) | — | 6 | 0 | 0 | 0 | 0 | 0 | 1 | 1 |
| SCF-P01 (Blaise) | MID | 8 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| SCF-P17 (Bivon) | ATT | 7 | 0 | 0 | 0 | 0 | 0 | 2 | 1 |
| SCF-P04 (Darren) | MID | 12 | 0 | 0 | 0 | 0 | 0 | 3 | 1 |
| SCF-007 (Lucario) | MID | 7 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| SCF-006 (Victor) | DEF | 12 | 0 | 0 | 0 | 0 | 0 | 2 | 1 |
| SCF-P24 (Mannasseh) | DEF | 5 | 10 | 0 | 0 | 0 | 0 | 0 | 1 |
| SCF-P19 (Foden) | — | 12 | 0 | 0 | 0 | 0 | 0 | 0 | 1 |
| SCF-P40 (Beavon) | GK | 0 | 0 | 0 | 0 | 8 | 2 | 0 | 1 |
| SCF-004 (Ethan) | MID | 7 | 0 | 0 | 0 | 0 | 0 | 3 | 1 |
| SCF-P18 (Mungai) | DEF | 6 | 8 | 0 | 0 | 0 | 0 | 1 | 1 |
| SCF-P02 (Bronze) | MID | 6 | 0 | 0 | 0 | 0 | 0 | 2 | 1 |

Note: SCF-005 has two entries in this batch — using the latest (10:41:31, tackles=7, direct_shots=1).

## Plan — 6 Changes

### 1. Data Recovery — Apply Thesapians match stats to `members` table (insert tool)

Run UPDATE statements to SET each player's `successful_tackles`, `interceptions`, `goals`, `assists`, `saves`, `aerial_duels`, `direct_shots`, `games_played` to the correct values from the second batch. Since this is the only match, we SET rather than increment.

Also INSERT `player_game_log` entries for all 14 players linking to game `347366a4-d72b-4c94-8cf1-6fb3a7e519eb`.

Also DELETE duplicate match_performances (first batch entries before 10:40).

### 2. Fix `addMatchPerformance` — Auto-sync to `members` table (TeamDataContext.tsx)

After the `match_performances` insert, add logic to:
- Read the player's current stats from `members`
- Increment the relevant cumulative fields: `successful_tackles += tackles`, `direct_shots += direct_shots`, `interceptions += interceptions`, `goals += goals`, `assists += assists`, `saves += saves`, `aerial_duels += aerial_duels`
- Increment `games_played` by 1
- If `clean_sheet` is true, increment `clean_sheets` by 1
- Insert a `player_game_log` entry

This ensures every future match recording immediately reflects on profiles.

### 3. Optimize button delay (OfficialProfile.tsx)

Move the success toast to fire immediately after `addMatchPerformance` returns, BEFORE the POTM recalculation queries. The POTM calc runs in background without blocking UI.

### 4. Universal messaging (PlayerProfile.tsx)

Line 343: Change `members.filter(m => ["coach","manager",...].includes(m.role))` to `members.filter(m => m.id !== user.id)`. Change card title to "Send Message".

### 5. POTM Login Badge (Profile.tsx)

On mount, query `match_performances` for the latest record with `is_potm = true`. If the current user's ID matches, show a trophy toast notification. Also check for "Most Improved" by comparing the two most recent `weekly_stats_log` entries.

### 6. Duplicate cleanup

Delete the older batch match_performances for the Thesapians game (entries created before 10:40 on March 9) and the duplicate SCF-005 entry (10:41:13, keeping only the 10:41:31 one).

---

## Files Changed

| File | Changes |
|------|---------|
| Data (insert tool) | UPDATE 14 members rows with correct stats; INSERT 14 player_game_log entries; DELETE duplicate match_performances |
| `src/contexts/TeamDataContext.tsx` | `addMatchPerformance`: after insert, increment members stats + games_played, insert player_game_log |
| `src/pages/OfficialProfile.tsx` | Move toast before POTM calc to eliminate delay |
| `src/pages/PlayerProfile.tsx` | Universal messaging — remove officials-only filter, update title |
| `src/pages/Profile.tsx` | Add POTM badge toast notification on login |

