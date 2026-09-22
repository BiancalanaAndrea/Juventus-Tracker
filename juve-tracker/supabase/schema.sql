-- ============================================================
-- JUVE TRACKER — schema database (versione 100% manuale)
-- Incolla tutto questo file in Supabase → SQL Editor → RUN
-- ============================================================

create table if not exists competitions (
  id serial primary key,
  name text not null,
  short_name text unique not null   -- "serie_a" | "coppa_italia" | "europa_league"
);

insert into competitions (name, short_name) values
  ('Serie A', 'serie_a'),
  ('Coppa Italia', 'coppa_italia'),
  ('UEFA Europa League', 'europa_league')
on conflict (short_name) do nothing;

create table if not exists players (
  id serial primary key,
  name text not null,
  position text not null check (position in ('GK','DF','MF','FW')),
  shirt_number integer,
  photo_url text,
  nationality text,
  active boolean default true
);

create table if not exists matches (
  id serial primary key,
  competition_id integer references competitions(id),
  matchday text,                     -- es. "Giornata 5", "Ottavi di finale"
  match_date timestamptz not null,
  venue text,
  opponent_name text not null,
  opponent_logo_url text,
  is_home boolean not null,
  juve_score integer,
  opponent_score integer,
  status text not null default 'SCHEDULED',  -- SCHEDULED | FINISHED | POSTPONED
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists match_team_stats (
  id serial primary key,
  match_id integer references matches(id) on delete cascade,
  side text not null check (side in ('juve','opponent')),
  possession numeric,
  shots_total integer,
  shots_on_target integer,
  corners integer,
  fouls integer,
  yellow_cards integer,
  red_cards integer,
  offsides integer,
  passes_total integer,
  passes_accuracy numeric,
  unique(match_id, side)
);

create table if not exists match_player_stats (
  id serial primary key,
  match_id integer references matches(id) on delete cascade,
  player_id integer references players(id) on delete cascade,
  minutes_played integer default 0,
  goals integer default 0,
  assists integer default 0,
  shots_total integer default 0,
  shots_on_target integer default 0,
  passes_total integer default 0,
  passes_key integer default 0,
  fouls_committed integer default 0,
  fouls_suffered integer default 0,
  yellow_cards integer default 0,
  red_cards integer default 0,
  saves integer default 0,          -- solo portieri
  goals_conceded integer default 0, -- solo portieri
  is_starter boolean default false,
  unique(match_id, player_id)
);

-- Le TUE valutazioni personali ai giocatori (0-10, step 0.25)
create table if not exists ratings (
  id serial primary key,
  match_id integer references matches(id) on delete cascade,
  player_id integer references players(id) on delete cascade,
  rating numeric(3,2) check (rating >= 0 and rating <= 10),
  note text,
  updated_at timestamptz default now(),
  unique(match_id, player_id)
);

-- Classifica: la aggiorni tu a mano, una riga per squadra che ti interessa
-- seguire (di solito basta la Juve, ma puoi aggiungerne altre per contesto)
create table if not exists standings (
  id serial primary key,
  team_name text not null,
  is_juve boolean default false,
  position integer,
  played integer default 0,
  won integer default 0,
  drawn integer default 0,
  lost integer default 0,
  goals_for integer default 0,
  goals_against integer default 0,
  points integer default 0,
  updated_at timestamptz default now(),
  unique(team_name)
);

insert into standings (team_name, is_juve, position) values ('Juventus', true, 1)
on conflict (team_name) do nothing;

create index if not exists idx_matches_date on matches (match_date);
create index if not exists idx_matches_competition on matches (competition_id);
create index if not exists idx_match_player_stats_match on match_player_stats (match_id);
create index if not exists idx_ratings_match on ratings (match_id);
