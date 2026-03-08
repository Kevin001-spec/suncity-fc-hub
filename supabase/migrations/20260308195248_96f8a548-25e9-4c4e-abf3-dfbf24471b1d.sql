-- Add fan fields to members
ALTER TABLE members ADD COLUMN IF NOT EXISTS fan_badge text DEFAULT NULL;
ALTER TABLE members ADD COLUMN IF NOT EXISTS fan_points integer NOT NULL DEFAULT 0;
ALTER TABLE members ADD COLUMN IF NOT EXISTS favourite_moment text DEFAULT NULL;

-- Add game_type and venue to game_scores
ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS game_type text NOT NULL DEFAULT 'friendly';
ALTER TABLE game_scores ADD COLUMN IF NOT EXISTS venue text DEFAULT NULL;

-- Create weekly_stats_log table for permanent stat history
CREATE TABLE IF NOT EXISTS weekly_stats_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id text NOT NULL,
  week_start text NOT NULL,
  goals integer NOT NULL DEFAULT 0,
  assists integer NOT NULL DEFAULT 0,
  games_played integer NOT NULL DEFAULT 0,
  saves integer NOT NULL DEFAULT 0,
  clean_sheets integer NOT NULL DEFAULT 0,
  aerial_duels integer NOT NULL DEFAULT 0,
  tackles integer NOT NULL DEFAULT 0,
  interceptions integer NOT NULL DEFAULT 0,
  blocks integer NOT NULL DEFAULT 0,
  clearances integer NOT NULL DEFAULT 0,
  successful_tackles integer NOT NULL DEFAULT 0,
  direct_targets integer NOT NULL DEFAULT 0,
  direct_shots integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(player_id, week_start)
);

ALTER TABLE weekly_stats_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on weekly_stats_log" ON weekly_stats_log FOR SELECT USING (true);
CREATE POLICY "Allow public insert on weekly_stats_log" ON weekly_stats_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on weekly_stats_log" ON weekly_stats_log FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on weekly_stats_log" ON weekly_stats_log FOR DELETE USING (true);