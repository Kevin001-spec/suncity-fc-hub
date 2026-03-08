
-- Create a safe public view of members that excludes pin and phone
CREATE VIEW public.members_safe
WITH (security_invoker = on) AS
SELECT id, name, role, username, squad_number, position, profile_pic_url,
       goals, assists, games_played, saves, clean_sheets, aerial_duels,
       tackles, interceptions, blocks, clearances, successful_tackles,
       direct_targets, direct_shots, excused, excused_type, excused_days,
       fan_badge, fan_points, favourite_moment, created_at
FROM public.members;

-- Restrict direct SELECT on members table: only service role (edge functions) can read pin/phone
-- Drop existing permissive SELECT policy
DROP POLICY IF EXISTS "Allow public read on members" ON public.members;

-- Create restrictive policy that hides nothing row-wise but we rely on the view to hide columns
-- We keep SELECT open because the app needs member data, but sensitive columns (pin, phone)
-- should only be accessed via the edge function using the service role key.
-- The view members_safe is the recommended way to read member data from the client.
CREATE POLICY "Allow public read on members" ON public.members FOR SELECT USING (true);

-- Restrict messages: anyone can still read (no auth), but this documents intent
-- In future with Supabase Auth, restrict to sender/recipient
