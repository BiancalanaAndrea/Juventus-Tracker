# Juventus Tracker – ESPN V27

## Important: database migration
Run `supabase/migration-v6.sql` once in the Supabase SQL Editor:
- adds `match_team_stats.shots_conceded`
- adds `player_match_stats.shots_conceded`

Then run a full synchronization from Settings.

## Changes
- ESPN completed matches are refreshed on every full sync, including matches already synchronized.
- Dashboard latest/last-five/upcoming logic uses ESPN header competitors and persisted Juventus/opponent scores.
- Match calendar uses the persisted score and correctly handles home/away.
- Friendly matches are excluded from imported matches.
- Added team "Tiri subiti".
- Added player/goalkeeper "Tiri subiti"; for goalkeepers this is opponent total shots faced, separate from the goalkeeper's own "Tiri" field.
- Added "Tiri subiti" to Stats table and player profile.
