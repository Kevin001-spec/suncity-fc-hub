
-- Contribution Events
CREATE TABLE public.contribution_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  goal_description text,
  target_amount numeric NOT NULL DEFAULT 0,
  amount_per_person numeric NOT NULL DEFAULT 0,
  created_by text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_completed boolean NOT NULL DEFAULT false
);
ALTER TABLE public.contribution_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read contribution_events" ON public.contribution_events FOR SELECT USING (true);
CREATE POLICY "Anyone can insert contribution_events" ON public.contribution_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update contribution_events" ON public.contribution_events FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete contribution_events" ON public.contribution_events FOR DELETE USING (true);

-- Contribution Event Payments
CREATE TABLE public.contribution_event_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.contribution_events(id) ON DELETE CASCADE,
  member_id text NOT NULL,
  paid boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.contribution_event_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read contribution_event_payments" ON public.contribution_event_payments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert contribution_event_payments" ON public.contribution_event_payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update contribution_event_payments" ON public.contribution_event_payments FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete contribution_event_payments" ON public.contribution_event_payments FOR DELETE USING (true);

-- League Standings
CREATE TABLE public.league_standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  played integer NOT NULL DEFAULT 0,
  won integer NOT NULL DEFAULT 0,
  drawn integer NOT NULL DEFAULT 0,
  lost integer NOT NULL DEFAULT 0,
  goal_difference integer NOT NULL DEFAULT 0,
  points integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.league_standings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read league_standings" ON public.league_standings FOR SELECT USING (true);
CREATE POLICY "Anyone can insert league_standings" ON public.league_standings FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update league_standings" ON public.league_standings FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete league_standings" ON public.league_standings FOR DELETE USING (true);

-- Weekly Overviews (archived reports)
CREATE TABLE public.weekly_overviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  type text NOT NULL DEFAULT 'weekly',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.weekly_overviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read weekly_overviews" ON public.weekly_overviews FOR SELECT USING (true);
CREATE POLICY "Anyone can insert weekly_overviews" ON public.weekly_overviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update weekly_overviews" ON public.weekly_overviews FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete weekly_overviews" ON public.weekly_overviews FOR DELETE USING (true);

-- Season Config
CREATE TABLE public.season_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  end_date text NOT NULL,
  created_by text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.season_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read season_config" ON public.season_config FOR SELECT USING (true);
CREATE POLICY "Anyone can insert season_config" ON public.season_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update season_config" ON public.season_config FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete season_config" ON public.season_config FOR DELETE USING (true);
