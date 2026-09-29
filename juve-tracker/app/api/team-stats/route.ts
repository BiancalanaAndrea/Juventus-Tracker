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

  return NextResponse.json({
    matchesWithStats: n,
    possession_avg: avg("possession"),
    shots_total: sum("shots_total"),
    shots_on_target: sum("shots_on_target"),
    corners: sum("corners"),
    fouls: sum("fouls"),
    yellow_cards: sum("yellow_cards"),
    red_cards: sum("red_cards"),
    offsides: sum("offsides"),
    passes_total: sum("passes_total"),
    passes_accuracy_avg: avg("passes_accuracy"),
  });
}
