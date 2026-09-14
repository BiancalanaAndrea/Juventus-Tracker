# Juventus Tracker V10

Next.js + Supabase Juventus tracker using ESPN public soccer endpoints.

V10 fixes the main data issue in previous versions: ESPN soccer player boxscore stats are supplied as `statistics[].labels` plus each athlete's `stats[]`; the sync now maps those values into the database instead of treating the value array as objects. It also keeps home/away ordering correct, displays jersey numbers, parses substitution key events, and keeps live refresh separate from the full season synchronization.

After deploying, run the existing Supabase migrations if needed, then perform one manual full synchronization to rebuild automatic statistics from ESPN. User ratings are preserved.
