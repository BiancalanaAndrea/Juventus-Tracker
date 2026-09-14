create extension if not exists pgcrypto;

create table if not exists public.players (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 external_id text, name text not null, short_name text, number integer, position text, photo_url text, active boolean not null default true,
 created_at timestamptz not null default now(), unique(user_id, external_id)
);
create table if not exists public.matches (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 external_id text, season text not null, competition text not null, competition_logo_url text, match_date timestamptz not null,
 opponent text not null, opponent_logo_url text, venue text, status text default 'scheduled', juve_score integer, opponent_score integer,
 team_rating numeric(3,1), coach_rating numeric(3,1), raw_provider_json jsonb, created_at timestamptz not null default now(), unique(user_id, external_id)
);
create table if not exists public.match_players (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 match_id uuid not null references public.matches(id) on delete cascade, player_id uuid not null references public.players(id) on delete cascade,
 started boolean not null default false, bench boolean not null default false, minutes integer default 0, user_rating numeric(3,1), unique(match_id, player_id)
);
create table if not exists public.player_match_stats (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 match_id uuid not null references public.matches(id) on delete cascade, player_id uuid not null references public.players(id) on delete cascade,
 appearances integer default 0, minutes integer default 0, goals integer default 0, assists integer default 0, shots integer default 0, shots_on_target integer default 0,
 xg numeric(6,2), xa numeric(6,2), chances_created integer default 0, successful_dribbles integer default 0, duels_won integer default 0, recoveries integer default 0,
 yellow_cards integer default 0, red_cards integer default 0, raw_provider_json jsonb, unique(match_id, player_id)
);
create table if not exists public.match_team_stats (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 match_id uuid not null references public.matches(id) on delete cascade, possession numeric(5,2), xg numeric(6,2), shots integer, shots_on_target integer, corners integer, offsides integer,
 passes integer, successful_passes integer, pass_accuracy numeric(5,2), tackles integer, interceptions integer, fouls integer, yellow_cards integer, red_cards integer, saves integer, raw_provider_json jsonb,
 unique(match_id)
);
create table if not exists public.tracker_settings (
 user_id uuid primary key references auth.users(id) on delete cascade, provider text not null default 'espn', season text not null default '2026/27', football_api_key text, updated_at timestamptz not null default now()
);
create table if not exists public.sync_runs (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, provider text not null, started_at timestamptz not null default now(), finished_at timestamptz, status text not null, message text
);

alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.match_players enable row level security;
alter table public.player_match_stats enable row level security;
alter table public.match_team_stats enable row level security;
alter table public.tracker_settings enable row level security;
alter table public.sync_runs enable row level security;

create policy "players own" on public.players for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "matches own" on public.matches for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "match players own" on public.match_players for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "player stats own" on public.player_match_stats for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "team stats own" on public.match_team_stats for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "settings own" on public.tracker_settings for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "sync own" on public.sync_runs for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
