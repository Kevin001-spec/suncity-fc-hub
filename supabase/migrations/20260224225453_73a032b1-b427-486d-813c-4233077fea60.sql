
-- =============================================
-- SUNCITY FC — FULL DATABASE SCHEMA + SEED DATA
-- =============================================

-- 1. MEMBERS TABLE
CREATE TABLE public.members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'player',
  username TEXT,
  pin TEXT,
  phone TEXT,
  squad_number INTEGER,
  position TEXT,
  goals INTEGER NOT NULL DEFAULT 0,
  assists INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  excused BOOLEAN NOT NULL DEFAULT false,
  excused_type TEXT,
  excused_days TEXT[],
  profile_pic_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on members" ON public.members FOR SELECT USING (true);
CREATE POLICY "Allow public insert on members" ON public.members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on members" ON public.members FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on members" ON public.members FOR DELETE USING (true);

-- 2. CONTRIBUTIONS TABLE
CREATE TABLE public.contributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id TEXT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  month_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(member_id, month_key)
);

ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on contributions" ON public.contributions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on contributions" ON public.contributions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on contributions" ON public.contributions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on contributions" ON public.contributions FOR DELETE USING (true);

-- 3. PENDING APPROVALS TABLE
CREATE TABLE public.pending_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  month_key TEXT NOT NULL,
  month_label TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rejection_note TEXT
);

ALTER TABLE public.pending_approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on pending_approvals" ON public.pending_approvals FOR SELECT USING (true);
CREATE POLICY "Allow public insert on pending_approvals" ON public.pending_approvals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on pending_approvals" ON public.pending_approvals FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on pending_approvals" ON public.pending_approvals FOR DELETE USING (true);

-- 4. FINANCIAL RECORDS TABLE
CREATE TABLE public.financial_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month TEXT NOT NULL UNIQUE,
  contributors INTEGER NOT NULL DEFAULT 0,
  contributor_note TEXT,
  opening_balance NUMERIC NOT NULL DEFAULT 0,
  contributions NUMERIC NOT NULL DEFAULT 0,
  closing_balance NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on financial_records" ON public.financial_records FOR SELECT USING (true);
CREATE POLICY "Allow public insert on financial_records" ON public.financial_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on financial_records" ON public.financial_records FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on financial_records" ON public.financial_records FOR DELETE USING (true);

-- 5. FINANCIAL EXPENSES TABLE
CREATE TABLE public.financial_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id UUID NOT NULL REFERENCES public.financial_records(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on financial_expenses" ON public.financial_expenses FOR SELECT USING (true);
CREATE POLICY "Allow public insert on financial_expenses" ON public.financial_expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on financial_expenses" ON public.financial_expenses FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on financial_expenses" ON public.financial_expenses FOR DELETE USING (true);

-- 6. GAME SCORES TABLE
CREATE TABLE public.game_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date TEXT NOT NULL,
  opponent TEXT NOT NULL,
  our_score INTEGER NOT NULL DEFAULT 0,
  their_score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.game_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on game_scores" ON public.game_scores FOR SELECT USING (true);
CREATE POLICY "Allow public insert on game_scores" ON public.game_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on game_scores" ON public.game_scores FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on game_scores" ON public.game_scores FOR DELETE USING (true);

-- 7. GAME SCORERS TABLE
CREATE TABLE public.game_scorers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.game_scores(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE
);

ALTER TABLE public.game_scorers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on game_scorers" ON public.game_scorers FOR SELECT USING (true);
CREATE POLICY "Allow public insert on game_scorers" ON public.game_scorers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on game_scorers" ON public.game_scorers FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on game_scorers" ON public.game_scorers FOR DELETE USING (true);

-- 8. CALENDAR EVENTS TABLE
CREATE TABLE public.calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on calendar_events" ON public.calendar_events FOR SELECT USING (true);
CREATE POLICY "Allow public insert on calendar_events" ON public.calendar_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on calendar_events" ON public.calendar_events FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on calendar_events" ON public.calendar_events FOR DELETE USING (true);

-- 9. MEDIA ITEMS TABLE
CREATE TABLE public.media_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  caption TEXT,
  date TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on media_items" ON public.media_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert on media_items" ON public.media_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on media_items" ON public.media_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on media_items" ON public.media_items FOR DELETE USING (true);

-- 10. LINEUP POSITIONS TABLE
CREATE TABLE public.lineup_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  position_id TEXT NOT NULL UNIQUE,
  player_id TEXT REFERENCES public.members(id) ON DELETE SET NULL,
  label TEXT NOT NULL
);

ALTER TABLE public.lineup_positions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on lineup_positions" ON public.lineup_positions FOR SELECT USING (true);
CREATE POLICY "Allow public insert on lineup_positions" ON public.lineup_positions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on lineup_positions" ON public.lineup_positions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on lineup_positions" ON public.lineup_positions FOR DELETE USING (true);

-- 11. ATTENDANCE TABLE
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start TEXT NOT NULL,
  day TEXT NOT NULL,
  player_id TEXT NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'absent',
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(week_start, day, player_id)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Allow public insert on attendance" ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on attendance" ON public.attendance FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on attendance" ON public.attendance FOR DELETE USING (true);

-- 12. STORAGE BUCKET
INSERT INTO storage.buckets (id, name, public) VALUES ('team-assets', 'team-assets', true);

CREATE POLICY "Allow public read on team-assets" ON storage.objects FOR SELECT USING (bucket_id = 'team-assets');
CREATE POLICY "Allow public upload to team-assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'team-assets');
CREATE POLICY "Allow public update on team-assets" ON storage.objects FOR UPDATE USING (bucket_id = 'team-assets');
CREATE POLICY "Allow public delete on team-assets" ON storage.objects FOR DELETE USING (bucket_id = 'team-assets');

-- =============================================
-- SEED DATA: MEMBERS
-- =============================================

-- Officials
INSERT INTO public.members (id, name, role, username, pin, phone) VALUES
  ('SCF-001', 'Fabian', 'coach', 'COACH-FAB', '8246', '0717455265'),
  ('SCF-002', 'Fadhir', 'finance', 'FIN-FAD', '5931', '0748431548'),
  ('SCF-003', 'Kevin', 'manager', 'MGR-KEV', '7719', '0112563036'),
  ('SCF-004', 'Ethan', 'captain', 'CPT-ETH', '4628', '0718258821'),
  ('SCF-005', 'Denoh', 'captain', 'CPT-DEN', '9183', '0769188787'),
  ('SCF-006', 'Victor', 'captain', 'CPT-VIC', '3507', '0786520209'),
  ('SCF-007', 'Lucario', 'captain', 'CPT-LUC', '6842', '0722725900'),
  ('SCF-008', 'Austin', 'captain', 'CPT-AUS', '2059', NULL);

-- Players (including new: Kelly, Edu, Rodgers; renamed Travis→Mannasseh)
INSERT INTO public.members (id, name, role, squad_number) VALUES
  ('SCF-P01', 'Blaise', 'player', 1),
  ('SCF-P02', 'Bronze', 'player', 2),
  ('SCF-P03', 'Lawrence', 'player', 3),
  ('SCF-P04', 'Darren', 'player', 4),
  ('SCF-P05', 'Yassin', 'player', 5),
  ('SCF-P06', 'Wakili', 'player', 6),
  ('SCF-P07', 'Collo', 'player', 7),
  ('SCF-P08', 'Fad', 'player', 8),
  ('SCF-P09', 'Sam', 'player', 9),
  ('SCF-P10', 'Olise', 'player', 10),
  ('SCF-P11', 'Kibe', 'player', 11),
  ('SCF-P12', 'Mugi J.r', 'player', 12),
  ('SCF-P13', 'Francis', 'player', 13),
  ('SCF-P14', 'Kanja', 'player', 14),
  ('SCF-P15', 'Felix M', 'player', 15),
  ('SCF-P16', 'Brian(d)', 'player', 16),
  ('SCF-P17', 'Bivon', 'player', 17),
  ('SCF-P18', 'Mungai', 'player', 18),
  ('SCF-P19', 'Foden', 'player', 19),
  ('SCF-P20', 'Njuguna', 'player', 20),
  ('SCF-P21', 'Amos', 'player', 21),
  ('SCF-P22', 'Bill', 'player', 22),
  ('SCF-P23', 'Einstein', 'player', 23),
  ('SCF-P24', 'Mannasseh', 'player', 24),
  ('SCF-P25', 'Morgan', 'player', 25),
  ('SCF-P26', 'Kayb', 'player', 26),
  ('SCF-P27', 'Davie', 'player', 27),
  ('SCF-P28', 'Brian', 'player', 28),
  ('SCF-P29', 'William', 'player', 29),
  ('SCF-P30', 'Joshua', 'player', 30),
  ('SCF-P31', 'Krish', 'player', 31),
  ('SCF-P32', 'Kelly', 'player', 32),
  ('SCF-P33', 'Edu', 'player', 33),
  ('SCF-P34', 'Rodgers', 'player', 34);

-- =============================================
-- SEED DATA: CONTRIBUTIONS (corrected statuses)
-- =============================================

-- Officials: all paid Dec-Feb (except Fabian exempt from contribution list but seeded)
INSERT INTO public.contributions (member_id, month_key, status) VALUES
  -- Officials all paid Dec, Jan, Feb
  ('SCF-001', 'dec-2025', 'paid'), ('SCF-001', 'jan-2026', 'paid'), ('SCF-001', 'feb-2026', 'paid'),
  ('SCF-002', 'dec-2025', 'paid'), ('SCF-002', 'jan-2026', 'paid'), ('SCF-002', 'feb-2026', 'paid'),
  ('SCF-003', 'dec-2025', 'paid'), ('SCF-003', 'jan-2026', 'paid'), ('SCF-003', 'feb-2026', 'paid'),
  ('SCF-004', 'dec-2025', 'paid'), ('SCF-004', 'jan-2026', 'paid'), ('SCF-004', 'feb-2026', 'paid'),
  ('SCF-005', 'dec-2025', 'paid'), ('SCF-005', 'jan-2026', 'paid'), ('SCF-005', 'feb-2026', 'paid'),
  ('SCF-006', 'dec-2025', 'paid'), ('SCF-006', 'jan-2026', 'paid'), ('SCF-006', 'feb-2026', 'paid'),
  ('SCF-007', 'dec-2025', 'paid'), ('SCF-007', 'jan-2026', 'paid'), ('SCF-007', 'feb-2026', 'paid'),
  ('SCF-008', 'dec-2025', 'paid'), ('SCF-008', 'jan-2026', 'paid'), ('SCF-008', 'feb-2026', 'paid'),
  -- Bronze: 3 ticks (Dec, Jan, Feb)
  ('SCF-P02', 'dec-2025', 'paid'), ('SCF-P02', 'jan-2026', 'paid'), ('SCF-P02', 'feb-2026', 'paid'),
  -- Darren: 3
  ('SCF-P04', 'dec-2025', 'paid'), ('SCF-P04', 'jan-2026', 'paid'), ('SCF-P04', 'feb-2026', 'paid'),
  -- Wakili: 3
  ('SCF-P06', 'dec-2025', 'paid'), ('SCF-P06', 'jan-2026', 'paid'), ('SCF-P06', 'feb-2026', 'paid'),
  -- Olise: 3
  ('SCF-P10', 'dec-2025', 'paid'), ('SCF-P10', 'jan-2026', 'paid'), ('SCF-P10', 'feb-2026', 'paid'),
  -- Mugi J.r: 3
  ('SCF-P12', 'dec-2025', 'paid'), ('SCF-P12', 'jan-2026', 'paid'), ('SCF-P12', 'feb-2026', 'paid'),
  -- Collo: 2 (Dec, Jan)
  ('SCF-P07', 'dec-2025', 'paid'), ('SCF-P07', 'jan-2026', 'paid'),
  -- Denoh: 2 (already official, extra entry handled above)
  -- Fad: 2 (Dec, Jan)
  ('SCF-P08', 'dec-2025', 'paid'), ('SCF-P08', 'jan-2026', 'paid'),
  -- Sam: 2
  ('SCF-P09', 'dec-2025', 'paid'), ('SCF-P09', 'jan-2026', 'paid'),
  -- Amos: 2
  ('SCF-P21', 'dec-2025', 'paid'), ('SCF-P21', 'jan-2026', 'paid'),
  -- Kibe: 2
  ('SCF-P11', 'dec-2025', 'paid'), ('SCF-P11', 'jan-2026', 'paid'),
  -- Davie: 2
  ('SCF-P27', 'dec-2025', 'paid'), ('SCF-P27', 'jan-2026', 'paid'),
  -- Francis: 1 (Dec)
  ('SCF-P13', 'dec-2025', 'paid'),
  -- Kanja: 1
  ('SCF-P14', 'dec-2025', 'paid'),
  -- Morgan: 1
  ('SCF-P25', 'dec-2025', 'paid'),
  -- Brian: 1
  ('SCF-P28', 'dec-2025', 'paid'),
  -- Joshua: 1
  ('SCF-P30', 'dec-2025', 'paid'),
  -- Krish: Feb only
  ('SCF-P31', 'feb-2026', 'paid'),
  -- Blaise: Dec only (from original data, Dec tick)
  ('SCF-P01', 'dec-2025', 'paid'),
  -- Others with Dec tick from original data
  ('SCF-P03', 'dec-2025', 'paid'),
  ('SCF-P05', 'dec-2025', 'paid'),
  ('SCF-P15', 'dec-2025', 'paid'),
  ('SCF-P16', 'dec-2025', 'paid'),
  ('SCF-P17', 'dec-2025', 'paid'),
  ('SCF-P18', 'dec-2025', 'paid'),
  ('SCF-P19', 'dec-2025', 'paid'),
  ('SCF-P20', 'dec-2025', 'paid'),
  ('SCF-P22', 'dec-2025', 'paid'),
  ('SCF-P23', 'dec-2025', 'paid'),
  ('SCF-P24', 'dec-2025', 'paid'),
  ('SCF-P26', 'dec-2025', 'paid'),
  ('SCF-P29', 'dec-2025', 'paid');

-- =============================================
-- SEED DATA: FINANCIAL RECORDS
-- =============================================

INSERT INTO public.financial_records (id, month, contributors, contributor_note, opening_balance, contributions, closing_balance)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Dec 2025', 35, '35 players', 0, 3600, 3600),
  ('00000000-0000-0000-0000-000000000002', 'Jan 2026', 19, '19 players', 3600, 1900, 3300),
  ('00000000-0000-0000-0000-000000000003', 'Feb 2026', 15, '15 players (to Feb 18)', 3300, 1500, 750);

-- Jan expenses
INSERT INTO public.financial_expenses (record_id, description, amount, date) VALUES
  ('00000000-0000-0000-0000-000000000002', 'Ball purchased', 2000, 'Jan 16'),
  ('00000000-0000-0000-0000-000000000002', 'Transport for ball', 200, 'Jan 16');

-- Feb expenses
INSERT INTO public.financial_expenses (record_id, description, amount, date) VALUES
  ('00000000-0000-0000-0000-000000000003', 'Field painting', 200, 'Feb 15'),
  ('00000000-0000-0000-0000-000000000003', 'League registration', 2000, 'Feb 18'),
  ('00000000-0000-0000-0000-000000000003', 'Jersey parcel fee', 200, 'Feb 18'),
  ('00000000-0000-0000-0000-000000000003', 'Jersey kits', 4500, 'Feb 18');

-- =============================================
-- SEED DATA: DEFAULT LINEUP POSITIONS
-- =============================================

INSERT INTO public.lineup_positions (position_id, label) VALUES
  ('gk', 'GK'), ('lb', 'LB'), ('cb1', 'CB'), ('cb2', 'CB'), ('rb', 'RB'),
  ('lm', 'LM'), ('cm1', 'CM'), ('cm2', 'CM'), ('rm', 'RM'),
  ('st1', 'ST'), ('st2', 'ST');
