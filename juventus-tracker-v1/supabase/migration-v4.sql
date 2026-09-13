alter table public.players add column if not exists role_group text;
alter table public.players add column if not exists photo_url text;
create table if not exists public.coaches (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  external_id text not null, name text not null, photo_url text, active boolean default true,
  created_at timestamptz default now(), updated_at timestamptz default now(),
  unique(user_id, external_id)
);
alter table public.player_match_stats add column if not exists passes integer default 0;
alter table public.player_match_stats add column if not exists successful_passes integer default 0;
alter table public.player_match_stats add column if not exists pass_accuracy numeric default 0;
alter table public.player_match_stats add column if not exists tackles integer default 0;
alter table public.player_match_stats add column if not exists interceptions integer default 0;
alter table public.player_match_stats add column if not exists fouls integer default 0;
alter table public.player_match_stats add column if not exists saves integer default 0;
alter table public.player_match_stats add column if not exists chances_created integer default 0;
alter table public.player_match_stats add column if not exists shots integer default 0;
alter table public.player_match_stats add column if not exists shots_on_target integer default 0;
