-- Create match_awards table for post-match achievements
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