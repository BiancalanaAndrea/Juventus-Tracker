import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = supabaseServer();
  const matchId = Number(params.id);

  const { data: match, error } = await db
    .from("matches")
    .select(
      "id, api_id, matchday, match_date, venue, home_score, away_score, status, is_home, notes, competition:competitions(id,name,short_name,logo_url), home_team:teams!matches_home_team_id_fkey(id,name,logo_url), away_team:teams!matches_away_team_id_fkey(id,name,logo_url)"
    )
    .eq("id", matchId)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  const { data: teamStats } = await db
    .from("match_team_stats")
    .select("*, team:teams(id,name,logo_url)")
    .eq("match_id", matchId);

  const { data: playerStats } = await db
    .from("match_player_stats")
    .select("*, player:players(id,name,position,shirt_number,photo_url)")
    .eq("match_id", matchId);

  const { data: ratings } = await db
    .from("ratings")
    .select("player_id, rating, note")
    .eq("match_id", matchId);

  return NextResponse.json({ match, teamStats, playerStats, ratings });
}

// Modifica manuale dei campi generali della partita (data, orario, luogo, note...)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const db = supabaseServer();
  const matchId = Number(params.id);
  const body = await req.json();

  const allowed = ["match_date", "venue", "notes", "home_score", "away_score", "status"];
  const update: Record<string, unknown> = { updated_manually: true, updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const { error } = await db.from("matches").update(update).eq("id", matchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
