import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const db = supabaseServer();
  const competition = req.nextUrl.searchParams.get("competition"); // serie_a | coppa_italia | europa_league | null=tutte

  let query = db
    .from("matches")
    .select(
      "id, api_id, matchday, match_date, venue, home_score, away_score, status, is_home, notes, competition:competitions(id,name,short_name,logo_url), home_team:teams!matches_home_team_id_fkey(id,name,logo_url), away_team:teams!matches_away_team_id_fkey(id,name,logo_url)"
    )
    .order("match_date", { ascending: true });

  if (competition) {
    const { data: comp } = await db
      .from("competitions")
      .select("id")
      .eq("short_name", competition)
      .single();
    if (comp) query = query.eq("competition_id", comp.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ matches: data });
}
