

# Position-Specific Stats, Auto POTM, Improvement Tracking & Export Fix

## Summary

This plan fixes position-specific stat fields across the entire system, implements automatic Player of the Match determination, adds match-to-match improvement analytics for officials, and restores proper table-based exports.

---

## 1. Position-Specific Stats — Everywhere

### Current problem
- Manager's **Team Stats Editor** shows common fields (goals, assists, games, successful tackles, direct targets) for ALL positions, then adds GK/DEF-specific ones. Attackers see irrelevant fields.
- **Match Day Performance Recorder** shows ALL fields (saves, tackles, blocks, clearances, aerial duels, rating, POTM checkbox) for every player regardless of position.
- **PlayerProfile.tsx** and **Players.tsx** PlayerCard show some wrong stats for defenders (blocks instead of goals).

### New position-specific stat sets

| Position | Stats shown everywhere |
|----------|----------------------|
| **GK** | Saves, Clean Sheets, Aerial Duels |
| **DEF** | Tackles, Interceptions, Assists, Goals, Shots on Target |
| **MID/ATT** | Tackles, Goals, Assists, Shots on Target |

### Files changed
- **`OfficialProfile.tsx`** — Team Stats Editor (lines 872-955): Replace all current fields with position-specific ones only. Match Day Performance Recorder (lines 957-1006): Show only position-relevant fields, remove `rating` input and `POTM` checkbox.
- **`PlayerProfile.tsx`** — `getStatCards()` (lines 82-105): Update to new stat sets.
- **`Players.tsx`** — `PlayerCard` (lines 34-55): Update stat display to new sets.
- **`handleUpdateStats`** in OfficialProfile (lines 329-353): Only send position-relevant fields.

### Column mapping
- "Shots on Target" maps to existing `direct_shots` column in `members` table (reuse, no migration needed).

---

## 2. Auto Player of the Match (System-Determined)

### How it works
After all match performances are recorded for a game, the system automatically calculates POTM using a weighted scoring formula:

```text
Score = goals×10 + assists×7 + saves×5 + tackles×3 + interceptions×3 + cleanSheet×8 + aerialDuels×2
```

The player with the highest score for that game is auto-flagged as POTM.

### Implementation
- **`OfficialProfile.tsx`**: Remove `perfRating` and `perfIsPotm` state/inputs. After `handleAddMatchPerf`, recalculate POTM across all performances for that game and update the `is_potm` flag via Supabase update. Remove the rating field from the insert.
- **`Stats.tsx`**: Add a "Man of the Match" card for the most recent game with fancy decorative UI showing the POTM player's name, photo, and the stats that earned them the award (goals, assists, saves etc. — only non-zero ones).

---

## 3. Match-to-Match Improvement Analytics (Officials Only)

### What it does
After a new match is recorded, compare each player's performance in the current match vs. the previous match they played. Show:
- **Most Improved**: Player with biggest positive delta
- **Performance Drop**: Players whose stats declined

### Implementation
- **`OfficialProfile.tsx`**: Add a new card "Post-Match Analytics" that appears when `matchPerformances` has data for 2+ games. For each player in the latest game, find their previous game performance and compute deltas. Display with green/red indicators.

---

## 4. Best of Week/Month/Season — Persistent Storage for Officials

### Current state
Weekly/monthly/season overviews exist but use `weekly_overviews` table with JSON `data` column. The "best player" data is computed on-the-fly and not persisted.

### Fix
- When the weekly overview is saved/archived, include the computed "best player" data in the JSON `data` field.
- **`Stats.tsx`**: In the archive view, display the stored best-of data from the JSON. Already partially works — just ensure the archive save includes `bestPlayer`, `top3`, `mostDisciplined` in the data payload.
- Add a new "Hall of Records" card visible only to officials that lists all archived best-of-week/month/season winners.

---

## 5. Export System — Restore Tables, Make Flexible

### Current problem
The `docx-export.ts` was redesigned to use paragraph-based layout, removing tables. User wants tables back but flexible (system analyzes data and arranges in neat tables).

### Fix
- **`docx-export.ts`**: Restore `generateBrandedDocx` to use proper `Table` elements with `TableRow`/`TableCell`. Keep the branded header. The function already accepts `DocxTableData[]` with head/body arrays — ensure it renders actual tables, not paragraphs.
- `generatePlayerProfileDocx`: Use tables for stats, attendance, contributions, match history. Keep flexible — only include sections that have data.

---

## Files Changed Summary

| File | Changes |
|------|---------|
| `src/pages/OfficialProfile.tsx` | Position-specific stats editor fields, position-specific match perf fields, remove rating/POTM manual inputs, auto-POTM calculation, post-match improvement analytics card |
| `src/pages/PlayerProfile.tsx` | Update `getStatCards()` to new position sets |
| `src/pages/Players.tsx` | Update `PlayerCard` stats to new position sets |
| `src/pages/Stats.tsx` | Auto POTM display card with fancy UI, Hall of Records for officials |
| `src/lib/docx-export.ts` | Restore table-based rendering in `generateBrandedDocx`, flexible table layout in `generatePlayerProfileDocx` |
| `src/data/team-data.ts` | No changes needed (columns already exist) |

No database migrations needed — all columns exist, we just change which ones are displayed/edited per position.

