

# 🌅 SUNCITY FC — Team Management System

**Motto: Discipline • Unity • Victory**
**Color Theme: Gold & Black — Premium, bold, and professional**

---

## 1. Login System
- Custom login screen with Suncity FC branding (gold & black theme, team motto)
- **Officials** log in with **Username + 4-digit PIN** (e.g., COACH-FAB / 8246)
- **Players** log in with **their ID only** (e.g., SCF-P01)
- All 39 credentials are pre-loaded — no random values will work
- Role-based routing: after login, each user is directed to their role-specific dashboard

---

## 2. Team Dashboard (Visible to Everyone After Login)
A premium, international-standard dashboard featuring:
- **Team header** with Suncity FC name, logo placeholder, and motto
- **Recent Game Scores** — shows opponent, score, and date (updated by officials)
- **Calendar of Events** — monthly planned activities (updated by officials only)
- **Media Carousel** — curved deck hover gallery of photos uploaded that day by officials
- **Team Roster** — clickable list of all members; clicking a player shows a **player card** with profile pic, player ID, and positions
- **Team Background section** — the full Suncity FC origin story, organized with sections about the journey, Coach Fabian's impact, acknowledgements, and team values
- Finance and expenses are **NOT** shown on this dashboard

---

## 3. Player Profile (What Each Player Sees)
Each player's personal profile shows:
- **Profile picture** (uploadable from their device)
- **Player ID, squad number, and playing position(s)**
- **Stats panel**: Goals scored, assists, games played
- **Monthly Contribution Tracker**: A visual checklist of months — player presses "Paid" on a month → sends approval request to Fadhir → if accepted, the month gets a ✅ tick
- **Excuse Request**: Player can mark themselves as excused for the next game, and they'll be flagged accordingly
- Profile pic is visible on the team roster member list

---

## 4. Officials' Profiles & Admin Powers

### 🧠 Coach — Fabian (Full System Control)
Everything the Manager and Finance Officer can do, **plus**:
- **3D Football Field Lineup Builder** — a visual pitch with 11 positions; Coach can drag/select players into each position, see player names and icons on the field, and swap players in/out
- Full access to all player profiles and stats
- Can update game scores, calendar events, and upload media
- Can manage the full roster and player data

### 💰 Finance Officer — Fadhir
- **Income/Expense Entry** — can record money in or money out directly from his profile
- System automatically updates monthly activity records visible to everyone
- **Contribution Approval** — receives player payment requests and can accept or reject them
- Views financial overview: opening balance, contributions, expenses, closing balance per month
- Pre-loaded with Dec 2025 – Feb 2026 financial data
- Can see all player contribution statuses grouped by month

### 👔 Manager — Kevin
- Can update game scores and calendar events
- Can upload media to the gallery
- Can record monthly activities
- Can view all player profiles, stats, and contribution statuses
- Access to player roster management

### 🏆 Captains (Ethan, Denoh, Victor, Lucario, Austin)
- Can update game scores and calendar events
- Can upload media to the gallery
- Enhanced player profile with captain badge
- Can view team-wide stats

---

## 5. Finance System (Backend)
- Pre-loaded financial records from Dec 2025 through Feb 2026
- Monthly tracking: contributors count, opening balance, contributions, expenses itemized, closing balance
- Auto-calculated totals
- Fadhir enters all new income/expenses; system updates the monthly activity view
- Contribution approval workflow: Player requests → Fadhir approves/rejects → tick updates

---

## 6. Stats & Data Presentation
- Player stats by position groups (centerbacks, right wing, midfield, etc.)
- Goals, assists, games played per player
- Contribution compliance tracking
- Visual charts and data presentation throughout

---

## 7. Backend (Supabase)
The system will use **Supabase** for:
- User authentication (custom username/PIN login)
- Player profiles, stats, and contribution data storage
- Financial records database
- Media/image uploads (profile pics + gallery)
- Game scores, calendar events
- Role-based access control

---

## Summary
A fully functional, premium gold & black team management portal for Suncity FC with 39 members, role-based dashboards, a 3D lineup builder for the coach, financial tracking with approval workflows, player profiles with stats and contribution tracking, media gallery, and game/event management — all powered by Supabase.

