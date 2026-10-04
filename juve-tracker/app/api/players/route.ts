export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { POSITION_ORDER } from "@/lib/types";
import { resolveMatchIds } from "@/lib/competitionFilter";

export async function GET(req: NextRequest) {
  const db = supabaseServer();
  const competition = req.nextUrl.searchParams.get("competition");

  const { data: players, error } = await db
    .from("players")
    .select("id, name, position, shirt_number, photo_url, photo_focus_y, nationality")
    .eq("active", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const matchIds = await resolveMatchIds(db, competition);

  let statsQuery = db.from("match_player_stats").select("*");
  if (matchIds !== null) statsQuery = statsQuery.in("match_id", matchIds.length > 0 ? matchIds : [-1]);
  const { data: stats } = await statsQuery;

  let ratingsQuery = db.from("ratings").select("player_id, rating");
  if (matchIds !== null) ratingsQuery = ratingsQuery.in("match_id", matchIds.length > 0 ? matchIds : [-1]);
  const { data: ratings } = await ratingsQuery;

  const aggregated = (players || []).map((p) => {
    const rows = (stats || []).filter((s) => s.player_id === p.id);
    const sum = (key: string) => rows.reduce((acc, r: any) => acc + (r[key] || 0), 0);
    const minutes = sum("minutes_played");
    const goals = sum("goals");
    const assists = sum("assists");
    const shotsTotal = sum("shots_total");
    const shotsOnTarget = sum("shots_on_target");
    const playerRatings = (ratings || []).filter((r) => r.player_id === p.id);
    const avgRating =
      playerRatings.length > 0
        ? playerRatings.reduce((acc: number, r: any) => acc + Number(r.rating), 0) / playerRatings.length
        : null;
    return {
      ...p,
      season_stats: {
        matches_played: rows.length,
        minutes,
        goals,
        assists,
        goal_contributions: goals + assists,
        avg_rating: avgRating,
        shots_total: shotsTotal,
        shots_on_target: shotsOnTarget,
        shot_accuracy: shotsTotal > 0 ? Math.round((shotsOnTarget / shotsTotal) * 100) : null,
        passes_total: sum("passes_total"),
        passes_key: sum("passes_key"),
        fouls_committed: sum("fouls_committed"),
        fouls_suffered: sum("fouls_suffered"),
        yellow_cards: sum("yellow_cards"),
        red_cards: sum("red_cards"),
        saves: sum("saves"),
        goals_conceded: sum("goals_conceded"),
        minutes_per_goal: goals > 0 ? Math.round(minutes / goals) : null,
      },
    };
  });

  aggregated.sort(
    (a, b) =>
      POSITION_ORDER.indexOf(a.position as any) - POSITION_ORDER.indexOf(b.position as any) ||
      (a.shirt_number || 99) - (b.shirt_number || 99)
  );

  return NextResponse.json({ players: aggregated });
}

// Aggiungi un nuovo giocatore alla rosa
export async function POST(req: NextRequest) {
  const db = supabaseServer();
  const body = await req.json();

  if (!body.name || !body.position) {
    return NextResponse.json({ error: "name e position sono obbligatori" }, { status: 400 });
  }

  const { data, error } = await db
    .from("players")
    .insert({
      name: body.name,
      position: body.position,
      shirt_number: body.shirt_number || null,
      photo_url: body.photo_url || null,
      photo_focus_y: body.photo_focus_y ?? 25,
      nationality: body.nationality || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ player: data });
}
