import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// body: { starters: number[], substitutes: number[] }  (id giocatori dalla rosa)
// Crea le righe base in match_player_stats (tutto a 0, minutes_played=0) per i
// giocatori convocati, così compaiono subito nella partita e sono pronti per
// ricevere una valutazione o un'importazione statistiche successiva. Non
// sovrascrive righe già esistenti (es. se hai già importato delle statistiche).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const db = supabaseServer();
  const matchId = Number(params.id);
  const body = await req.json();

  const starters: number[] = body.starters || [];
  const substitutes: number[] = body.substitutes || [];

  const rows = [
    ...starters.map((player_id) => ({ match_id: matchId, player_id, is_starter: true, minutes_played: 90 })),
    ...substitutes.map((player_id) => ({ match_id: matchId, player_id, is_starter: false, minutes_played: 0 })),
  ];

  if (rows.length === 0) return NextResponse.json({ ok: true });

  const { error } = await db
    .from("match_player_stats")
    .upsert(rows, { onConflict: "match_id,player_id", ignoreDuplicates: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
