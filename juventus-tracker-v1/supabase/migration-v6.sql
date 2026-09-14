-- V6: tiri subiti (squadra) e tiri subiti al portiere
alter table public.match_team_stats add column if not exists shots_conceded integer;
alter table public.player_match_stats add column if not exists shots_conceded integer default 0;
