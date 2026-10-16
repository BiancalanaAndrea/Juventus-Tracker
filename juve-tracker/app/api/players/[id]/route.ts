export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { parseSeasonParam, seasonBounds } from "@/lib/season";
import { countAwards } from "@/lib/awards";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const db = supabaseServer();
  const playerId = Number(params.id);
  const season = parseSeasonParam(req.nextUrl.searchParams.get("season"));
  const bounds = season !== null ? seasonBounds(season) : null;
  const inSeason = (date: string | null | undefined) =>
    !bounds || (!!date && date >= bounds.from && date < bounds.to);

  const { data: player, error } = await db.from("players").select("*").eq("id", playerId).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  const { data: matchStats } = await db
    .from("match_player_stats")
    .select("*, match:matches(id, match_date, opponent_name, is_home, juve_score, opponent_score)")
    .eq("player_id", playerId)
    .order("match_id", { ascending: false });

  const { data: ratings } = await db.from("ratings").select("match_id, rating, note").eq("player_id", playerId);
  const ratingByMatch = new Map((ratings || []).map((r) => [r.match_id, r]));
  const history = (matchStats || [])
    .filter((m: any) => inSeason(m.match?.match_date))
    .map((m: any) => ({ ...m, my_rating: ratingByMatch.get(m.match_id)?.rating ?? null }));

  const ratedInSeason = history.filter((h: any) => h.my_rating != null);
  const avgRating =
    ratedInSeason.length > 0
      ? ratedInSeason.reduce((a: number, h: any) => a + Number(h.my_rating), 0) / ratedInSeason.length
      : null;

  // Allenatore: niente statistiche da giocatore, ma risultati e voti di tutte le partite giocate
  let coach: any = null;
  if (player.position === "CO") {
    const { data: ms } = await db
      .from("matches")
      .select("id, match_date, opponent_name, is_home, juve_score, opponent_score, competition:competitions(short_name)")
      .eq("status", "FINISHED")
      .eq("coach_id", playerId)
      .order("match_date", { ascending: false });
    const list = (ms || []).filter((m: any) => inSeason(m.match_date)).map((m: any) => ({ ...m, my_rating: ratingByMatch.get(m.id)?.rating ?? null }));
    let won = 0, drawn = 0, lost = 0, gf = 0, ga = 0;
    for (const m of list) {
      const a = m.juve_score ?? 0, b = m.opponent_score ?? 0;
      gf += a; ga += b;
      if (a > b) won++; else if (a === b) drawn++; else lost++;
    }
    coach = { played: list.length, won, drawn, lost, goals_for: gf, goals_against: ga, matches: list };
  }

  // MVP / peggiore in campo nelle partite di questo giocatore
  let awards = { mvp: 0, worst: 0, mvp_site: 0, worst_site: 0 };
  const matchIds = history.map((h: any) => h.match_id);
  if (matchIds.length > 0 && player.position !== "CO") {
    const [{ data: allMine }, { data: allSite }, { data: coachRows }] = await Promise.all([
      db.from("ratings").select("match_id, player_id, rating").in("match_id", matchIds),
      db.from("match_player_stats").select("match_id, player_id, site_rating").in("match_id", matchIds).not("site_rating", "is", null),
      db.from("players").select("id").eq("position", "CO"),
    ]);
    const counts = countAwards((allMine || []) as any[], (allSite || []) as any[], new Set((coachRows || []).map((c: any) => c.id)));
    awards = counts.get(playerId) || awards;
  }

  return NextResponse.json({ player, history, avgRating, coach, awards });
}

// Modifica dati anagrafici del giocatore
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const db = supabaseServer();
  const body = await req.json();
  const allowed = ["name", "position", "shirt_number", "photo_url", "photo_focus_y", "photo_focus_x", "nationality", "active"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) if (key in body) update[key] = body[key];

  const { error } = await db.from("players").update(update).eq("id", Number(params.id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Rimuovi giocatore dalla rosa
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = supabaseServer();
  const { error } = await db.from("players").delete().eq("id", Number(params.id));
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
