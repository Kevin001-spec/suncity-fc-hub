
-- Add position-specific stat columns to members
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS saves integer NOT NULL DEFAULT 0;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS clean_sheets integer NOT NULL DEFAULT 0;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS aerial_duels integer NOT NULL DEFAULT 0;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS tackles integer NOT NULL DEFAULT 0;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS interceptions integer NOT NULL DEFAULT 0;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS blocks integer NOT NULL DEFAULT 0;
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS clearances integer NOT NULL DEFAULT 0;

-- Create match_performances table
CREATE TABLE public.match_performances (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id uuid NOT NULL REFERENCES public.game_scores(id) ON DELETE CASCADE,
  player_id text NOT NULL,
  goals integer NOT NULL DEFAULT 0,
  assists integer NOT NULL DEFAULT 0,
  saves integer NOT NULL DEFAULT 0,
  tackles integer NOT NULL DEFAULT 0,
  interceptions integer NOT NULL DEFAULT 0,
  blocks integer NOT NULL DEFAULT 0,
  clearances integer NOT NULL DEFAULT 0,
  clean_sheet boolean NOT NULL DEFAULT false,
  aerial_duels integer NOT NULL DEFAULT 0,
  rating numeric NOT NULL DEFAULT 0,
  is_potm boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.match_performances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read match_performances" ON public.match_performances FOR SELECT USING (true);
CREATE POLICY "Anyone can insert match_performances" ON public.match_performances FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update match_performances" ON public.match_performances FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete match_performances" ON public.match_performances FOR DELETE USING (true);

-- Create messages table
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_id text NOT NULL,
  to_id text NOT NULL,
  content text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Anyone can insert messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update messages" ON public.messages FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete messages" ON public.messages FOR DELETE USING (true);

-- Demote Brian Kim to player
UPDATE public.members SET role = 'player', pin = NULL, username = NULL WHERE id = 'SCF-P35';
