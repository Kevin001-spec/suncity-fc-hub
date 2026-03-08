

# MID/ATT Successful Tackles, Fan Management, Squad Number Removal, Input Zero Fix

## Summary
Four changes: add "Successful Tackles" to MID/ATT stats, build full fan management UI for officials, remove squad numbers from the system, and fix the sticky "0" in number inputs.

---

## 1. Add Successful Tackles to MID/ATT Stats

**`src/lib/position-stats.ts`**
- Add `{ key: "successfulTackles", label: "Successful Tackles", dbColumn: "successful_tackles" }` to `MID_ATT_STATS` array (after directShots)
- This auto-propagates to PlayerProfile, Players page, and OfficialProfile stats editor

**`src/pages/OfficialProfile.tsx`**
- Add `successfulTackles: [statsSuccessfulTackles, setStatsSuccessfulTackles]` to the `stateSetters` map in the stats editor (line ~908)
- The `handleUpdateStats` already iterates position fields dynamically, so it will pick this up

**`src/pages/PlayerProfile.tsx`**
- Add `successfulTackles: Shield` to `iconMap` (line ~22)

---

## 2. Fan Management System (Officials)

**`src/pages/OfficialProfile.tsx`** — New "Fan Management" card (visible to Coach + Manager):
- List all fans (`members.filter(m => m.role === "fan")`)
- For each fan, show: name, current badge, current points
- Editable badge field (text input or preset badges like "Super Fan", "Legend", "MVP Fan", "Rising Star")
- Editable points field (number input)
- Save button per fan that calls `updateFanBadge` and `updateFanPoints` from context
- Already wired: `updateFanBadge` and `updateFanPoints` exist in TeamDataContext

**Badge presets**: "Super Fan", "Legend", "MVP Fan", "Rising Star", "OG Supporter"

---

## 3. Remove Squad Numbers Entirely

**`src/pages/OfficialProfile.tsx`**
- Remove the squad number input from the "Add New Member" card (line 872)
- Remove `newPlayerSquad` state usage from `handleAddPlayer` — pass 0 or remove the param
- Update `handleAddPlayer` disabled check: remove `!newPlayerSquad` condition

**`src/pages/Players.tsx`**
- Remove `member.squadNumber ? ' • #${member.squadNumber}' : ""` from PlayerCard list (line 106)
- Remove squad number display from the expanded PlayerCard overlay (line 32)

**`src/pages/PlayerProfile.tsx`**
- Remove the squad number display line (line 171)

**`src/contexts/TeamDataContext.tsx`**
- In `addPlayer`, for non-fan players, remove `squad_number: squadNumber` from insert — set to null
- Update ID generation: use auto-increment from max existing ID only (already does this)

---

## 4. Fix Input "0" That Won't Disappear on Focus

The issue: number inputs have values like `"0"` which must be manually deleted before typing.

**Fix approach**: For all stat-related number inputs in OfficialProfile (stats editor, match perf recorder, game stats form), add `onFocus` handler that clears the value if it's "0":

```tsx
onFocus={(e) => { if (e.target.value === "0") setter(""); }}
```

Apply to:
- Stats editor fields (line ~921)
- Match perf recorder fields (line ~972)
- Game stats form inputs (firstHalfStats/secondHalfStats fields)
- League standings editor number inputs

For the game stats form (which uses objects not strings), use a similar pattern clearing to empty on focus and defaulting back to 0 on blur if empty.

---

## Files Changed

| File | Changes |
|------|---------|
| `src/lib/position-stats.ts` | Add successfulTackles to MID_ATT_STATS |
| `src/pages/OfficialProfile.tsx` | Fan management card, remove squad number input, fix 0-on-focus for all number inputs, add successfulTackles to stateSetters |
| `src/pages/PlayerProfile.tsx` | Remove squad number display, add successfulTackles icon |
| `src/pages/Players.tsx` | Remove squad number from card display |
| `src/contexts/TeamDataContext.tsx` | Remove squad_number from addPlayer insert |

No database migrations needed.

