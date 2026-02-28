
-- Update player positions in members table
UPDATE members SET position = 'GK' WHERE name IN ('Kibe', 'Brayo');
UPDATE members SET position = 'DEF (LB)' WHERE name = 'Victor';
UPDATE members SET position = 'DEF (CB)' WHERE name IN ('Mannasseh', 'Lawrence');
UPDATE members SET position = 'DEF (LB)' WHERE name IN ('Sam', 'Collo');
UPDATE members SET position = 'DEF (RB)' WHERE name IN ('Mungai', 'Wakili');
UPDATE members SET position = 'MID' WHERE name IN ('Darren', 'Brian', 'Austin', 'Bronze', 'Masai', 'Blaise', 'Joe', 'Kanja');
UPDATE members SET position = 'MID' WHERE name IN ('Ethan', 'Denoh', 'Lucario', 'Fadhir (P)');
UPDATE members SET position = 'ATT' WHERE name IN ('Mugi J.r', 'Bivon', 'Fad', 'Amos');

-- Brian (K) becomes captain
UPDATE members SET role = 'captain', pin = '1374' WHERE name = 'Brian Kim';

-- Fix Feb 2026 financial record
UPDATE financial_records SET contributors = 17, contributions = 1700 WHERE month = 'Feb 2026';
