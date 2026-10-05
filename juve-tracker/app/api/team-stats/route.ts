export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { resolveMatchIds } from "@/lib/competitionFilter";

export async function GET(req: NextRequest) {
  const db = supabaseServer();
  const competition = req.nextUrl.searchParams.get("competition");

  const matchIds = await resolveMatchIds(db, competition);

  let query = db.from("match_team_stats").select("*").eq("side", "juve");
  if (matchIds !== null) query = query.in("match_id", matchIds.length > 0 ? matchIds : [-1]);

  const { data: rows, error } = await query;
  if (error) {
    console.error("Errore /api/team-stats:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const n = (rows || []).length;
  const sum = (key: string) => (rows || []).reduce((acc, r: any) => acc + (r[key] || 0), 0);
  const avg = (key: string) => {
    const valid = (rows || []).filter((r: any) => r[key] != null);
    if (valid.length === 0) return null;
    return valid.reduce((acc: number, r: any) => acc + Number(r[key]), 0) / valid.length;
  };

  const shotsTotal = sum("shots_total");
  const shotsOnTarget = sum("shots_on_target");

  return NextResponse.json({
    matchesWithStats: n,
    possession_avg: avg("possession"),
    shots_total: shotsTotal,
    shots_on_target: shotsOnTarget,
    shot_accuracy_avg: shotsTotal > 0 ? (shotsOnTarget / shotsTotal) * 100 : null,
    corners: sum("corners"),
    fouls: sum("fouls"),
    fouls_per_match: n > 0 ? sum("fouls") / n : null,
    yellow_cards: sum("yellow_cards"),
    red_cards: sum("red_cards"),
    offsides: sum("offsides"),
    passes_total: sum("passes_total"),
    passes_accuracy_avg: avg("passes_accuracy"),
    xg: sum("xg"),
    xg_avg: avg("xg"),
    big_chances: sum("big_chances"),
    shots_blocked: sum("shots_blocked"),
    touches: sum("touches"),
    long_balls: sum("long_balls"),
    crosses: sum("crosses"),
    dribbles_won: sum("dribbles_won"),
    duels_won: sum("duels_won"),
    aerial_won: sum("aerial_won"),
    tackles: sum("tackles"),
    interceptions: sum("interceptions"),
    clearances: sum("clearances"),
    saves: sum("saves"),
    hit_woodwork: sum("hit_woodwork"),
    shots_inside_box: sum("shots_inside_box"),
    shots_outside_box: sum("shots_outside_box"),
    headed_shots: sum("headed_shots"),
    goal_kicks: sum("goal_kicks"),
    throw_ins: sum("throw_ins"),
    shot_creating: sum("shot_creating"),
  });
}
