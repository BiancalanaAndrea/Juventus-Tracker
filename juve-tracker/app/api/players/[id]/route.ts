import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = supabaseServer();
  const playerId = Number(params.id);

  const { data: player, error } = await db.from("players").select("*").eq("id", playerId).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  const { data: matchStats } = await db
    .from("match_player_stats")
    .select("*, match:matches(id, match_date, home_score, away_score, is_home, home_team:teams!matches_home_team_id_fkey(name), away_team:teams!matches_away_team_id_fkey(name))")
    .eq("player_id", playerId)
    .order("match_id", { ascending: false });

  const { data: ratings } = await db
    .from("ratings")
    .select("match_id, rating, note")
    .eq("player_id", playerId);

  const ratingByMatch = new Map((ratings || []).map((r) => [r.match_id, r]));
  const history = (matchStats || []).map((m: any) => ({
    ...m,
    my_rating: ratingByMatch.get(m.match_id)?.rating ?? null,
  }));

  const avgRating =
    (ratings || []).length > 0
      ? (ratings || []).reduce((a, r) => a + Number(r.rating), 0) / (ratings || []).length
      : null;

  return NextResponse.json({ player, history, avgRating });
}
