

# Add Clickable Player Cards for Officials & Fans on Stats Page

## What needs to happen

The Stats page currently shows officials and fans as static cards. When clicked, they should open a player-card-style popup (same as the `PlayerCard` component in `Players.tsx`).

## Implementation

### File: `src/pages/Stats.tsx`

1. **Add state**: `selectedMemberCard` of type `TeamMember | null`
2. **Add a `MemberCard` component** inline (or reuse pattern from `Players.tsx`):
   - Shows avatar, name, ID, role (badge), position if applicable
   - For officials with captain/finance role who have stats: show goals/assists/games
   - For fans: show fan badge, points, favourite moment
   - For coach/manager/assistant_coach: show role badge only
3. **Make official cards clickable**: Wrap each official `<div>` in the officials grid (line 402) with `onClick={() => setSelectedMemberCard(officialFromMembers)}` — need to find the official in `members` array to get live DB data (profile pics, stats)
4. **Make fan cards clickable**: Same pattern for fan grid (line 433)
5. **Render the card dialog**: Add `<AnimatePresence>` block at the bottom that shows the `MemberCard` overlay when `selectedMemberCard` is set

### Details
- Use the exact same visual pattern as `PlayerCard` from `Players.tsx`: full-screen overlay with backdrop blur, centered card with avatar, name, stats grid
- Officials who are captains or Fadhir show their game stats (goals/assists/games + position-specific)
- Fans show badge, points, and favourite moment instead of game stats
- Coach/Manager/Assistant Coach show their role in a badge with no stats grid

