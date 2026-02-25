
-- Create homepage_images table
CREATE TABLE public.homepage_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.homepage_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read homepage images" ON public.homepage_images FOR SELECT USING (true);
CREATE POLICY "Anyone can insert homepage images" ON public.homepage_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update homepage images" ON public.homepage_images FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete homepage images" ON public.homepage_images FOR DELETE USING (true);

-- Add Brian Kim
INSERT INTO public.members (id, name, role, squad_number, goals, assists, games_played, excused)
VALUES ('SCF-P35', 'Brian Kim', 'player', 35, 0, 0, 0, false)
ON CONFLICT (id) DO NOTHING;
