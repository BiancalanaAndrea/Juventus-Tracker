import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { POSITION_ORDER } from "@/lib/types";

export async function GET() {
  const db = supabaseServer();

  const { data: players, error } = await db
    .from("players")
    .select("id, name, position, shirt_number, photo_url, nationality")
    .eq("active", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: stats } = await db.from("match_player_stats").select("*");

  const aggregated = (players || []).map((p) => {
    const rows = (stats || []).filter((s) => s.player_id === p.id);
    const sum = (key: string) => rows.reduce((acc, r: any) => acc + (r[key] || 0), 0);
    return {
      ...p,
      season_stats: {
        matches_played: rows.length,
        minutes: sum("minutes_played"),
        goals: sum("goals"),
        assists: sum("assists"),
        yellow_cards: sum("yellow_cards"),
        red_cards: sum("red_cards"),
        saves: p.position === "GK" ? sum("saves") : undefined,
        goals_conceded: p.position === "GK" ? sum("goals_conceded") : undefined,
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
