
-- Create game_stats table for first/second half match statistics
CREATE TABLE public.game_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.game_scores(id) ON DELETE CASCADE,
  half TEXT NOT NULL DEFAULT 'first',
  shots INT DEFAULT 0,
  shots_on_target INT DEFAULT 0,
  penalties INT DEFAULT 0,
  freekicks INT DEFAULT 0,
  corner_kicks INT DEFAULT 0,
  fouls INT DEFAULT 0,
  offsides INT DEFAULT 0,
  yellow_cards INT DEFAULT 0,
  red_cards INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.game_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on game_stats" ON public.game_stats FOR SELECT USING (true);
CREATE POLICY "Allow public insert on game_stats" ON public.game_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on game_stats" ON public.game_stats FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on game_stats" ON public.game_stats FOR DELETE USING (true);

-- Create player_game_log table linking players to specific games
CREATE TABLE public.player_game_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL,
  game_id UUID NOT NULL REFERENCES public.game_scores(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(player_id, game_id)
);

ALTER TABLE public.player_game_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select on player_game_log" ON public.player_game_log FOR SELECT USING (true);
CREATE POLICY "Allow public insert on player_game_log" ON public.player_game_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on player_game_log" ON public.player_game_log FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on player_game_log" ON public.player_game_log FOR DELETE USING (true);
