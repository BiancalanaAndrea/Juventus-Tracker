-- ============================================================
-- JUVE TRACKER — schema database (Supabase / Postgres)
-- Incolla tutto questo file in Supabase → SQL Editor → RUN
-- ============================================================

create table if not exists competitions (
  id serial primary key,
  api_id integer unique not null,       -- id della competizione su API-Football
  name text not null,                   -- "Serie A", "Coppa Italia", "UEFA Europa League"
  short_name text not null,             -- "serie_a" | "coppa_italia" | "europa_league"
  logo_url text
);

create table if not exists teams (
  id serial primary key,
  api_id integer unique not null,
  name text not null,
  logo_url text
);

create table if not exists players (
  id serial primary key,
  api_id integer unique not null,
  name text not null,
  position text not null check (position in ('GK','DF','MF','FW')),
  shirt_number integer,
  photo_url text,
  birth_date date,
  nationality text,
  active boolean default true
);

create table if not exists matches (
  id serial primary key,
  api_id integer unique not null,
  competition_id integer references competitions(id),
  matchday text,                        -- es. "Giornata 5", "Ottavi di finale"
  match_date timestamptz not null,
  venue text,
  home_team_id integer references teams(id),
  away_team_id integer references teams(id),
  home_score integer,
  away_score integer,
  status text not null default 'SCHEDULED', -- SCHEDULED | LIVE | FINISHED | POSTPONED
  is_home boolean not null,             -- true se la Juve gioca in casa
  -- campi editabili manualmente dall'utente
  notes text,
  updated_manually boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists match_team_stats (
  id serial primary key,
  match_id integer references matches(id) on delete cascade,
  team_id integer references teams(id),
  possession numeric,
  shots_total integer,
  shots_on_target integer,
  shots_off_target integer,
  corners integer,
  fouls integer,
  yellow_cards integer,
  red_cards integer,
  offsides integer,
  passes_total integer,
  passes_accuracy numeric,
  unique(match_id, team_id)
);

create table if not exists match_player_stats (
  id serial primary key,
  match_id integer references matches(id) on delete cascade,
  player_id integer references players(id),
  minutes_played integer default 0,
  goals integer default 0,
  assists integer default 0,
  shots_total integer default 0,
  shots_on_target integer default 0,
  passes_total integer default 0,
  passes_key integer default 0,
  tackles integer default 0,
  fouls_committed integer default 0,
  fouls_suffered integer default 0,
  yellow_cards integer default 0,
  red_cards integer default 0,
  saves integer default 0,        -- solo portieri
  goals_conceded integer default 0, -- solo portieri
  is_starter boolean default false,
  unique(match_id, player_id)
);

-- Le TUE valutazioni personali ai giocatori (0-10, step 0.25)
create table if not exists ratings (
  id serial primary key,
  match_id integer references matches(id) on delete cascade,
  player_id integer references players(id),
  rating numeric(3,2) check (rating >= 0 and rating <= 10),
  note text,
  updated_at timestamptz default now(),
  unique(match_id, player_id)
);

-- Classifica Serie A, aggiornata ogni giorno dal cron
create table if not exists standings (
  id serial primary key,
  competition_id integer references competitions(id),
  position integer,
  team_id integer references teams(id),
  played integer,
  won integer,
  drawn integer,
  lost integer,
  goals_for integer,
  goals_against integer,
  points integer,
  updated_at timestamptz default now(),
  unique(competition_id, team_id)
);

-- Impostazioni semplici chiave/valore (usate dalla sezione Impostazioni)
create table if not exists app_settings (
  key text primary key,
  value text
);

insert into app_settings (key, value) values
  ('juventus_api_id', '496'),          -- id Juventus su API-Football (verifica in fase di setup)
  ('season_year', '2026'),
  ('theme', 'light')
on conflict (key) do nothing;

-- Indici utili
create index if not exists idx_matches_date on matches (match_date);
create index if not exists idx_matches_competition on matches (competition_id);
create index if not exists idx_match_player_stats_match on match_player_stats (match_id);
create index if not exists idx_ratings_match on ratings (match_id);
