-- Create a function to sync match performance stats to members table
-- This will be called after each match performance insert
CREATE OR REPLACE FUNCTION public.sync_match_perf_to_member()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment cumulative stats on the members table
  UPDATE public.members SET
    successful_tackles = successful_tackles + NEW.tackles,
    interceptions = interceptions + NEW.interceptions,
    goals = goals + NEW.goals,
    assists = assists + NEW.assists,
    saves = saves + NEW.saves,
    aerial_duels = aerial_duels + NEW.aerial_duels,
    direct_shots = direct_shots + NEW.direct_shots,
    games_played = games_played + 1,
    clean_sheets = CASE WHEN NEW.clean_sheet THEN clean_sheets + 1 ELSE clean_sheets END
  WHERE id = NEW.player_id;

  -- Insert player_game_log entry (ignore if already exists)
  INSERT INTO public.player_game_log (player_id, game_id)
  VALUES (NEW.player_id, NEW.game_id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger on match_performances
CREATE TRIGGER trg_sync_match_perf_to_member
AFTER INSERT ON public.match_performances
FOR EACH ROW
EXECUTE FUNCTION public.sync_match_perf_to_member();

-- Add unique constraint to player_game_log to support ON CONFLICT
ALTER TABLE public.player_game_log ADD CONSTRAINT player_game_log_player_game_unique UNIQUE (player_id, game_id);