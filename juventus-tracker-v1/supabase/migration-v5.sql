alter table public.player_match_stats add column if not exists goals_conceded integer default 0;
