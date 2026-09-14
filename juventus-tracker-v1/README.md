# Juventus Tracker

Next.js + Supabase Juventus tracker using ESPN as the primary provider.

The API key is entered by the authenticated user in Impostazioni and stored in `tracker_settings.football_api_key`. The server reads it for synchronization; it is never exposed to client-side API calls.

ESPN Free currently provides 100 requests/day and 10 requests/minute. The sync uses the Juventus team season fixture list and the combined fixture detail response to minimize calls.
