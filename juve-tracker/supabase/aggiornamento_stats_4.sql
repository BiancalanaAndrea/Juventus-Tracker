-- Incolla TUTTO nello SQL Editor di Supabase e premi RUN (sicuro, non cancella nulla).
alter table matches add column if not exists coach_id integer references players(id) on delete set null;
alter table match_team_stats add column if not exists hit_woodwork integer;
