DELETE FROM attendance WHERE player_id = 'SCF-P16';
DELETE FROM contributions WHERE member_id = 'SCF-P16';
DELETE FROM pending_approvals WHERE player_id = 'SCF-P16';
DELETE FROM player_game_log WHERE player_id = 'SCF-P16';
DELETE FROM match_performances WHERE player_id = 'SCF-P16';
DELETE FROM weekly_stats_log WHERE player_id = 'SCF-P16';
DELETE FROM match_awards WHERE player_id = 'SCF-P16';
DELETE FROM messages WHERE from_id = 'SCF-P16' OR to_id = 'SCF-P16';
DELETE FROM members WHERE id = 'SCF-P16';