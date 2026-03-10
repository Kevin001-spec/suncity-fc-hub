-- Data recovery: Apply Thesapians match stats to members table
UPDATE members SET successful_tackles = 7, direct_shots = 0, interceptions = 0, goals = 0, assists = 0, saves = 0, aerial_duels = 0, games_played = 1 WHERE id = 'SCF-P12';
UPDATE members SET successful_tackles = 6, direct_shots = 2, interceptions = 0, goals = 0, assists = 0, saves = 0, aerial_duels = 0, games_played = 1 WHERE id = 'SCF-P02';
UPDATE members SET successful_tackles = 12, direct_shots = 3, interceptions = 0, goals = 0, assists = 0, saves = 0, aerial_duels = 0, games_played = 1 WHERE id = 'SCF-P04';
UPDATE members SET successful_tackles = 6, direct_shots = 1, interceptions = 0, goals = 0, assists = 0, saves = 0, aerial_duels = 0, games_played = 1 WHERE id = 'SCF-P25';
UPDATE members SET successful_tackles = 8, direct_shots = 0, interceptions = 0, goals = 0, assists = 0, saves = 0, aerial_duels = 0, games_played = 1 WHERE id = 'SCF-P01';
UPDATE members SET successful_tackles = 7, direct_shots = 1, interceptions = 0, goals = 0, assists = 0, saves = 0, aerial_duels = 0, games_played = 1 WHERE id = 'SCF-005';
UPDATE members SET successful_tackles = 7, direct_shots = 2, interceptions = 0, goals = 0, assists = 0, saves = 0, aerial_duels = 0, games_played = 1 WHERE id = 'SCF-P17';
UPDATE members SET successful_tackles = 6, direct_shots = 1, interceptions = 8, goals = 0, assists = 0, saves = 0, aerial_duels = 0, games_played = 1 WHERE id = 'SCF-P18';
UPDATE members SET successful_tackles = 5, direct_shots = 0, interceptions = 10, goals = 0, assists = 0, saves = 0, aerial_duels = 0, games_played = 1 WHERE id = 'SCF-P24';
UPDATE members SET successful_tackles = 7, direct_shots = 3, interceptions = 0, goals = 0, assists = 0, saves = 0, aerial_duels = 0, games_played = 1 WHERE id = 'SCF-004';
UPDATE members SET successful_tackles = 12, direct_shots = 0, interceptions = 0, goals = 0, assists = 0, saves = 0, aerial_duels = 0, games_played = 1 WHERE id = 'SCF-P19';
UPDATE members SET successful_tackles = 0, direct_shots = 0, interceptions = 0, goals = 0, assists = 0, saves = 8, aerial_duels = 2, games_played = 1 WHERE id = 'SCF-P40';
UPDATE members SET successful_tackles = 7, direct_shots = 0, interceptions = 0, goals = 0, assists = 0, saves = 0, aerial_duels = 0, games_played = 1 WHERE id = 'SCF-007';
UPDATE members SET successful_tackles = 12, direct_shots = 2, interceptions = 0, goals = 0, assists = 0, saves = 0, aerial_duels = 0, games_played = 1 WHERE id = 'SCF-006';

-- Insert player_game_log entries for all 14 players
INSERT INTO player_game_log (player_id, game_id) VALUES ('SCF-P12', '347366a4-d72b-4c94-8cf1-6fb3a7e519eb') ON CONFLICT (player_id, game_id) DO NOTHING;
INSERT INTO player_game_log (player_id, game_id) VALUES ('SCF-P02', '347366a4-d72b-4c94-8cf1-6fb3a7e519eb') ON CONFLICT (player_id, game_id) DO NOTHING;
INSERT INTO player_game_log (player_id, game_id) VALUES ('SCF-P04', '347366a4-d72b-4c94-8cf1-6fb3a7e519eb') ON CONFLICT (player_id, game_id) DO NOTHING;
INSERT INTO player_game_log (player_id, game_id) VALUES ('SCF-P25', '347366a4-d72b-4c94-8cf1-6fb3a7e519eb') ON CONFLICT (player_id, game_id) DO NOTHING;
INSERT INTO player_game_log (player_id, game_id) VALUES ('SCF-P01', '347366a4-d72b-4c94-8cf1-6fb3a7e519eb') ON CONFLICT (player_id, game_id) DO NOTHING;
INSERT INTO player_game_log (player_id, game_id) VALUES ('SCF-005', '347366a4-d72b-4c94-8cf1-6fb3a7e519eb') ON CONFLICT (player_id, game_id) DO NOTHING;
INSERT INTO player_game_log (player_id, game_id) VALUES ('SCF-P17', '347366a4-d72b-4c94-8cf1-6fb3a7e519eb') ON CONFLICT (player_id, game_id) DO NOTHING;
INSERT INTO player_game_log (player_id, game_id) VALUES ('SCF-P18', '347366a4-d72b-4c94-8cf1-6fb3a7e519eb') ON CONFLICT (player_id, game_id) DO NOTHING;
INSERT INTO player_game_log (player_id, game_id) VALUES ('SCF-P24', '347366a4-d72b-4c94-8cf1-6fb3a7e519eb') ON CONFLICT (player_id, game_id) DO NOTHING;
INSERT INTO player_game_log (player_id, game_id) VALUES ('SCF-004', '347366a4-d72b-4c94-8cf1-6fb3a7e519eb') ON CONFLICT (player_id, game_id) DO NOTHING;
INSERT INTO player_game_log (player_id, game_id) VALUES ('SCF-P19', '347366a4-d72b-4c94-8cf1-6fb3a7e519eb') ON CONFLICT (player_id, game_id) DO NOTHING;
INSERT INTO player_game_log (player_id, game_id) VALUES ('SCF-P40', '347366a4-d72b-4c94-8cf1-6fb3a7e519eb') ON CONFLICT (player_id, game_id) DO NOTHING;
INSERT INTO player_game_log (player_id, game_id) VALUES ('SCF-007', '347366a4-d72b-4c94-8cf1-6fb3a7e519eb') ON CONFLICT (player_id, game_id) DO NOTHING;
INSERT INTO player_game_log (player_id, game_id) VALUES ('SCF-006', '347366a4-d72b-4c94-8cf1-6fb3a7e519eb') ON CONFLICT (player_id, game_id) DO NOTHING;

-- Delete duplicate match_performances (batch 1 and batch 2 - before 10:40)
DELETE FROM match_performances WHERE game_id = '347366a4-d72b-4c94-8cf1-6fb3a7e519eb' AND created_at < '2026-03-09 10:40:00+00';

-- Delete the duplicate SCF-005 entry (keep only the 10:41:31 one)
DELETE FROM match_performances WHERE id = '3f7d99cc-511f-4654-a840-ecb51898b433';