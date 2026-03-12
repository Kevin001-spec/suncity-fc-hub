

# Fadhir Player Stats, Fan Cleanup, Enhanced DOCX, Post-Match Achievements

## Issues Found

### 1. Fadhir (SCF-002) not in match perf recorder
- `playerMembers` on line 263 filters `m.role === "player" || m.role === "captain"` — excludes "finance" role
- Fadhir has no position set in DB (`position: null`)
- His profile shows "My Stats" section via `(isCaptain || isFadhir)` check but he can't be selected in the match recorder
- There's also a duplicate `SCF-P39 "Fadhir (P)"` in fallback data — this is confusing. Fadhir should use `SCF-002` with position set

### 2. Fans in attendance & contributions
- Attendance table (line 1424): uses `playerMembers` which already filters `player|captain` — fans excluded. But need to verify
- Contribution grid in Stats.tsx (line 748): `sortedContributionMembers` uses `contributionMembers` which only excludes SCF-001, so fans ARE included — needs fixing
- Fadhir's contribution grid (line 1279): filters `m.id !== "SCF-001"` — fans still included there too

### 3. Detailed DOCX needs improvements
- Profile pic needs JPEG format for mobile compatibility
- Missing POTM/achievement badges in export
- Missing match-by-match performance comparison
- Manager should control export availability via a toggle

### 4. Post-match achievements (max 6)
- Currently only POTM exists
- Need to add: Defensive Wall (most tackles), Playmaker (most assists), Sharpshooter (most goals), Iron Wall (GK — most saves), Rising Star (biggest improvement vs last match)
- These are auto-calculated from `match_performances` when manager records stats

### 5. Trigger exists and works
- `trg_sync_match_perf_to_member` is active — stats DO sync now

---

## Changes

### Migration: Set Fadhir's position, create match_awards table

```sql
-- Set Fadhir's position
UPDATE members SET position = 'MID' WHERE id = 'SCF-002';

-- Table for post-match awards
CREATE TABLE IF NOT EXISTS match_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL,
  player_id text NOT NULL,
  award_type text NOT NULL,
  award_label text NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE match_awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read match_awards" ON match_awards FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert match_awards" ON match_awards FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can delete match_awards" ON match_awards FOR DELETE TO public USING (true);

-- Add export_enabled flag for manager control
ALTER TABLE season_config ADD COLUMN IF NOT EXISTS export_enabled boolean NOT NULL DEFAULT false;
```

### `src/data/team-data.ts`
- Add `MatchAward` interface: `{ id, gameId, playerId, awardType, awardLabel, reason }`
- Set Fadhir's position to "MID" in fallback officials array
- Remove `SCF-P39 "Fadhir (P)"` from players array (duplicate)

### `src/pages/OfficialProfile.tsx`
- **playerMembers** (line 263): Change filter to include `m.role === "finance"` (so Fadhir appears in recorder, stats editor, attendance)
- **Contribution grid** (line 1279): Add `&& m.role !== "fan"` filter
- **Attendance table** (line 1424): Already uses `playerMembers` — will auto-include Fadhir with updated filter
- **Post-match achievement system**: After POTM calculation in `handleAddMatchPerf`, compute up to 6 awards:
  1. **🏆 Player of the Match** — highest POTM score
  2. **🛡️ Defensive Wall** — most tackles (min 5)
  3. **🎯 Sharpshooter** — most goals (min 1)
  4. **🅰️ Playmaker** — most assists (min 1)
  5. **🧤 Iron Wall** — most saves (GK, min 3)
  6. **📈 Rising Star** — biggest improvement vs previous match
- Insert awards into `match_awards` table
- **Manager export toggle**: Add a card with toggle to enable/disable detailed export for players

### `src/pages/Stats.tsx`
- **Contribution grid** (line 748): Filter out fans from `sortedContributionMembers`
- **Attendance ranking** (line 111): Already filters `player|captain` — add `finance` role
- **Match Awards section**: After MOTM card, display all awards for latest match with badges, player names, and reasons
- **performanceMembers** (line 95): Include `finance` role

### `src/pages/PlayerProfile.tsx`
- **Detailed export**: Check `season_config.export_enabled` from Supabase; if false and not weekend, disable detailed export
- **Enhanced DOCX**: Pass match performances, POTM info, awards to `generatePlayerProfileDocx`
- Add match-by-match performance data in export

### `src/lib/docx-export.ts`
- **Profile pic**: Convert to JPEG/PNG with proper dimensions for mobile doc viewers (use `type: "png"` which is already done)
- **Add achievements section**: Show POTM badges, awards with emojis
- **Match performance comparison**: Show each match's stats side-by-side with best/lowest indicators
- **More emojis**: Add achievement emojis throughout (🏆, ⭐, 🔥, 📈, 🛡️, 🎯, etc.)

### `src/contexts/TeamDataContext.tsx`
- Add `matchAwards` state and load function
- Add `loadMatchAwards` and expose in context
- Update `playerMembers`-like filters throughout to include finance role

### `src/pages/Profile.tsx`
- Add match award badge notification on login (check `match_awards` for current user from latest game)

---

## Files Changed

| File | Changes |
|------|---------|
| Migration | Set Fadhir position, create `match_awards` table, add `export_enabled` to `season_config` |
| `src/data/team-data.ts` | Add `MatchAward` interface, fix Fadhir position, remove SCF-P39 duplicate |
| `src/pages/OfficialProfile.tsx` | Include finance in playerMembers, exclude fans from contrib grid, post-match awards engine, export toggle |
| `src/pages/Stats.tsx` | Exclude fans from contributions, include finance in perf/attendance, display match awards |
| `src/pages/PlayerProfile.tsx` | Respect export toggle, enhanced detailed export |
| `src/lib/docx-export.ts` | Add achievements, match comparisons, more emojis, mobile-friendly pic |
| `src/contexts/TeamDataContext.tsx` | Add matchAwards state/loader |
| `src/pages/Profile.tsx` | Award badge notifications on login |

