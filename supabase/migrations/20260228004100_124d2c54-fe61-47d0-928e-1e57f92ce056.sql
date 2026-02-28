
-- Create league_teams table for multi-team league standings
CREATE TABLE public.league_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name text NOT NULL,
  played int NOT NULL DEFAULT 0,
  won int NOT NULL DEFAULT 0,
  drawn int NOT NULL DEFAULT 0,
  lost int NOT NULL DEFAULT 0,
  goal_difference int NOT NULL DEFAULT 0,
  points int NOT NULL DEFAULT 0,
  is_own_team boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.league_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read league_teams" ON public.league_teams FOR SELECT USING (true);
CREATE POLICY "Anyone can insert league_teams" ON public.league_teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update league_teams" ON public.league_teams FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete league_teams" ON public.league_teams FOR DELETE USING (true);

-- Insert Suncity FC as the own team
INSERT INTO public.league_teams (team_name, is_own_team) VALUES ('Suncity FC', true);
