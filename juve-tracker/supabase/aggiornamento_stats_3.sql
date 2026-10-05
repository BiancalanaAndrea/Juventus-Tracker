-- Incolla TUTTO nello SQL Editor di Supabase e premi RUN (sicuro, non cancella nulla).
alter table match_player_stats add column if not exists penalties_attempted integer;
alter table match_player_stats add column if not exists penalties_won integer;
alter table match_player_stats add column if not exists penalties_conceded integer;
alter table match_player_stats add column if not exists tackles_won integer;
alter table match_player_stats add column if not exists shots_on_target_against integer;
alter table players drop constraint if exists players_position_check;
alter table players add constraint players_position_check check (position in ('GK','DF','MF','FW','CO'));
