import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = supabaseServer();
  const playerId = Number(params.id);

  const { data: player, error } = await db.from("players").select("*").eq("id", playerId).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  const { data: matchStats } = await db
    .from("match_player_stats")
    .select("*, match:matches(id, match_date, opponent_name, is_home, juve_score, opponent_score)")
    .eq("player_id", playerId)
    .order("match_id", { ascending: false });

  const { data: ratings } = await db.from("ratings").select("match_id, rating, note").eq("player_id", playerId);
  const ratingByMatch = new Map((ratings || []).map((r) => [r.match_id, r]));
  const history = (matchStats || []).map((m: any) => ({ ...m, my_rating: ratingByMatch.get(m.match_id)?.rating ?? null }));

  const avgRating =
    (ratings || []).length > 0
      ? (ratings || []).reduce((a, r) => a + Number(r.rating), 0) / (ratings || []).length
      : null;

  return NextResponse.json({ player, history, avgRating });
}

// Modifica dati anagrafici del giocatore
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const db = supabaseServer();
  const body = await req.json();
  const allowed = ["name", "position", "shirt_number", "photo_url", "nationality", "active"];
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
