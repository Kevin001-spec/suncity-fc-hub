

# Suncity FC — Comprehensive System Update Plan

This plan covers all requested features organized by priority and grouped logically.

---

## 1. Google Search Console Verification

- Copy `user-uploads://google84912e3b26fbb3e1_1.html` to `public/google84912e3b26fbb3e1.html`
- This file will be served at the root URL automatically by Vite since it's in `public/`
- No routing changes needed — the SPA router only handles paths that hit `index.html`; direct file requests to `public/` are served as-is

---

## 2. SEO & Homepage Overhaul

### index.html meta tag updates
- Title: `SunCity FC | Official Team Site & Match Stats`
- Description: `Official homepage of SunCity FC, based in Nairobi. View our team history, recent match statistics, player profiles, and gallery. Motto: Discipline • Unity • Victory.`
- og:title, og:description, twitter:title, twitter:description all updated to match

### Login page → Public Homepage redesign
The current `/` route is the Login page. Transform it into a full public homepage:

- **Hero section**: Team badge (with white background circle) + `<h1>SUNCITY FC</h1>` + motto
- **Feature Carousel**: 4 scrollable images (stored in a new Supabase `homepage-images` folder in `team-assets` bucket). Uses embla-carousel with touch-swiping support. All images have descriptive `alt` text
- **Our Story section**: Reuse the creative `StorySection` component but **exclude the "contributions/commitment" section**. Wrapped in `<section>` with `<h2>Our Story</h2>`
- **Recent Match Stats**: A semantic `<table>` showing latest 3 game scores, pulled from Supabase (publicly readable). `<h2>Recent Results</h2>`
- **Login section**: The existing login card, placed below the content sections
- Proper semantic HTML: single `<h1>`, `<h2>` for sections

### robots.txt
Already exists at `public/robots.txt` allowing all crawlers — no change needed.

---

## 3. Homepage Photo Management (Coach/Manager)

- Add a new section on Coach and Manager profile: "Homepage Photos"
- Upload area that accepts up to 4 images
- Images are auto-compressed to WebP before upload (see section 8)
- Stored in `team-assets/homepage-images/` folder
- Coach/Manager can delete current ones and replace
- These photos only appear on the homepage carousel, nowhere else
- New Supabase table: `homepage_images` (id, url, sort_order, created_at)

---

## 4. Multi-File Media Upload

- The media upload input already has `multiple` attribute — confirm it works
- The `handleMediaUpload` already uses `Array.from(files)` — this should work
- Verify and fix any issues with the media picker accepting multiple selections

---

## 5. Manager Photo Deletion from Gallery

- Add a delete button (visible only to Manager role) on each gallery photo
- When clicked: delete from `media_items` table AND from `team-assets/team-media/` storage bucket
- New function in TeamDataContext: `deleteMediaItem(itemId: string, url: string)`
- Extracts the storage path from the URL and calls `supabase.storage.from("team-assets").remove([path])`

---

## 6. Financial Summary Math Fix (CORE)

The contributor count bug: the current system increments `contributors` each time ANY contribution action happens, leading to double-counting. Fix:

- When computing financial summary figures, **derive contributor count** from the actual `contributions` table rather than storing it independently
- New approach for `contributors` field: On any contribution change, query `SELECT COUNT(*) FROM contributions WHERE month_key = X AND status = 'paid'` and use that exact count
- Same for the `contributions` (money) field: `count * 100` (KSh 100 per contributor)
- Recalculate `closing_balance = opening_balance + (count * 100) - total_expenses`
- Apply this recalculation in `approveContribution`, `rejectContribution`, and `updateContributionDirect`
- Add a reusable `recalculateFinancialRecord(monthLabel)` function that always queries the actual paid count

### Financial Export for Officials
- Add an export button on the financial summary section (both OfficialProfile and Stats page, officials only)
- Generates a branded PDF (see section 9 for PDF details)

---

## 7. Game Scores → Auto-Update Player Goals

The `addGameScore` function already updates player goals in Supabase (lines 238-244 of TeamDataContext). However it then only calls `loadGameScores()` — it should also call `loadMembers()` to refresh the member data with updated goal counts.

- Add `loadMembers()` call after goal updates in `addGameScore`
- Also update `gamesPlayed` for ALL players who participated (increment by 1 for all squad members or just scorers — based on current logic, just ensure scorers get goals counted)

---

## 8. Auto-Compression & WebP Conversion

- Install `browser-image-compression` library
- Create a utility function `compressAndConvertToWebP(file: File, prefix: string): Promise<File>`
  - Max width: 1200px, quality: 0.8
  - Output as WebP using canvas API
  - Rename to clean slug format
- Apply to:
  - `uploadMediaToStorage` — compress each file before uploading
  - `uploadProfilePicToStorage` — compress before uploading
  - Homepage image uploads
- Show a "Compressing & uploading..." toast/status during the process

### Badge Image Optimization
- Convert `src/assets/suncity-badge.png` to WebP format (create `suncity-badge.webp`)
- Update all imports across the codebase (Login, Navbar, Dashboard) to use the `.webp` version
- Ensure aspect ratio is maintained

---

## 9. PDF Export (Replace DOCX)

- Install `jspdf` and `jspdf-autotable`
- Remove `docx` and `file-saver` dependencies
- Create a utility `generateBrandedPdf(title: string, tables: TableData[], fileName: string)`
  - Header: Suncity FC badge (converted to base64 and embedded), centered
  - Below badge: "Discipline • Unity • Victory" in italic 10pt
  - Top-right: Generated date
  - Clean bordered tables using jspdf-autotable
  - Footer: "© 2026 Suncity FC"
- Replace all `.docx` export functions:
  - Contribution status → PDF
  - Attendance report → PDF (include key: E = Excused)
  - Financial summary → PDF (new)
  - Weekly overview → PDF

### Attendance Report Sorting
- Rank by: highest ticks first, then those with excuses, then those with only absences at bottom

---

## 10. Remove May from System

- Remove `{ key: "may-2026", label: "May 2026" }` from `contributionMonths` array
- This cascades everywhere: player profiles, stats page, contribution grid, Fadhir's checkbox

---

## 11. Attendance: Tick Emojis

- Replace the `✓` / `✗` / `E` / `—` symbols in weekly attendance display with:
  - Present: ✅ (same as contribution table)
  - Absent: ❌
  - Excused: 🔵 or keep "E" with styling
  - No Activity: ➖

---

## 12. Weekly Overview (Stats Page, Friday Only)

- New section on Stats page that **only renders on Friday, Saturday, and Sunday** (visible for 2 days after Friday = disappears Monday)
- Content:
  - "Most Disciplined" — players who attended every training day
  - "Best Player of the Week" — based on highest goals+assists that week
  - Low contributors with low attendance — players who only paid January and have low training attendance percentage
- Officials can export this as branded PDF
- Players see it but cannot export
- Data silently records from Sunday onward for next Friday's report

---

## 13. Add Brian Kim to Team

- Add `{ id: "SCF-P35", name: "Brian Kim", role: "player", squadNumber: 35, goals: 0, assists: 0, gamesPlayed: 0, contributions: {} }` to players array
- Insert into Supabase `members` table via migration

---

## 14. Dashboard Gallery — Only 2 Most Recent Upload Dates

- In `Dashboard.tsx` MediaGallery, limit the grouped dates to only the 2 most recent dates
- Newest uploads on top

---

## 15. Stats Page — Permanent Gallery with Date Icons

- New section: "Team Gallery" on Stats page
- Shows date icons/badges for each upload date (e.g., "📅 Feb 20, 2026")
- Clicking a date icon opens a modal/dialog on the same page
- Modal shows all photos from that date in a swipeable carousel (embla-carousel)
- Each photo has a download button
- Close button to dismiss the modal
- Dates are permanent — never vanish
- Fancy UI with card styling and gold accents

---

## 16. Coach: Player Removal

- New section on Coach's profile: "Remove Player"
- Dropdown to select a player
- Confirm dialog before removal
- On confirm: delete from `members` table, remove their contributions, attendance records
- This permanently removes them from the system

---

## 17. Badge White Background

- Where the badge is displayed on the website (Navbar, Dashboard header, Login page), wrap the `<img>` in a container with a white circular background
- Do NOT apply this in PDF exports — badge embeds as-is in documents

---

## 18. Faster Checkbox Responsiveness

- Use optimistic UI updates for Fadhir's contribution checkboxes and Manager's attendance checkboxes
- Update local state immediately on click, then fire the Supabase upsert in background
- If the DB call fails, revert the local state and show an error toast
- This makes checkboxes feel instant while maintaining data integrity

---

## 19. Mobile Optimization

- All data operations already go through Supabase — changes should reflect on mobile after refresh
- Add `useEffect` polling or Supabase realtime subscriptions for key tables to ensure mobile users see updates within seconds
- Consider adding a pull-to-refresh pattern or auto-refresh interval (every 30 seconds) for the Dashboard
- Ensure all tables have `overflow-x-auto` for horizontal scrolling on mobile
- Test touch interactions on carousels

---

## 20. Universal Data Persistence Audit

- Audit every "Save", "Update", "Add" button across all pages
- Verify each triggers a Supabase insert/upsert
- The current implementation already persists most operations
- Key areas to verify: lineup builder saves, stats editor saves, attendance marks, media uploads, profile pic uploads
- Fix any found gaps

---

## Technical Summary

| Area | Files Changed/Created |
|------|----------------------|
| Google verification | `public/google84912e3b26fbb3e1.html` (copy) |
| SEO | `index.html` — meta tags |
| Homepage | `src/pages/Login.tsx` — complete rewrite as public homepage with login |
| Homepage images | New table `homepage_images`, new storage folder |
| Team data | `src/data/team-data.ts` — add Brian Kim, remove May |
| Context | `src/contexts/TeamDataContext.tsx` — deleteMedia, homepage images, financial recalc, optimistic updates, compression, loadMembers in addGameScore |
| Dashboard | `src/pages/Dashboard.tsx` — 2-date gallery limit, badge white bg |
| OfficialProfile | `src/pages/OfficialProfile.tsx` — homepage photo manager, player removal (coach), financial export |
| Stats | `src/pages/Stats.tsx` — gallery date icons modal, weekly overview, PDF exports, attendance emojis |
| Navbar | `src/components/Navbar.tsx` — badge white bg, webp image |
| New deps | `browser-image-compression`, `jspdf`, `jspdf-autotable` |
| Remove deps | `docx`, `file-saver` (file-saver may still be needed for PDF blob download) |
| Migration | New Supabase migration for `homepage_images` table + Brian Kim member insert |
| Badge | Convert to `.webp`, update all references |

