export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// Restituisce la formazione attuale (titolari/panchina) di una partita
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = supabaseServer();
  const matchId = Number(params.id);
  const { data, error } = await db
    .from("match_player_stats")
    .select("player_id, is_starter")
    .eq("match_id", matchId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const starters = (data || []).filter((r) => r.is_starter).map((r) => r.player_id);
  const substitutes = (data || []).filter((r) => !r.is_starter).map((r) => r.player_id);
  return NextResponse.json({ starters, substitutes });
}

// Imposta la formazione: aggiunge i nuovi giocatori, aggiorna titolare/panchina
// per quelli già presenti (senza perdere le statistiche già importate) e
// rimuove chi è stato tolto dalla selezione.
async function setLineup(req: NextRequest, { params }: { params: { id: string } }) {
  const db = supabaseServer();
  const matchId = Number(params.id);
  const body = await req.json();
  const starters: number[] = body.starters || [];
  const substitutes: number[] = body.substitutes || [];

  const targetStarters = new Set(starters);
  const targetSubs = new Set(substitutes);
  const targetAll = new Set<number>([...starters, ...substitutes]);

  const { data: existing, error: existingError } = await db
    .from("match_player_stats")
    .select("player_id, is_starter")
    .eq("match_id", matchId);
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });

  const existingIds = new Set((existing || []).map((r) => r.player_id));

  // Rimuovi chi non è più nella formazione
  const toRemove = (existing || []).filter((r) => !targetAll.has(r.player_id)).map((r) => r.player_id);
  if (toRemove.length > 0) {
    const { error: delError } = await db
      .from("match_player_stats")
      .delete()
      .eq("match_id", matchId)
      .in("player_id", toRemove);
    if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });
  }

  // Aggiorna titolare/panchina per chi è già presente (senza toccare le altre statistiche)
  for (const row of existing || []) {
    if (!targetAll.has(row.player_id)) continue;
    const shouldBeStarter = targetStarters.has(row.player_id);
    if (row.is_starter !== shouldBeStarter) {
      const { error: updError } = await db
        .from("match_player_stats")
        .update({ is_starter: shouldBeStarter })
        .eq("match_id", matchId)
        .eq("player_id", row.player_id);
      if (updError) return NextResponse.json({ error: updError.message }, { status: 500 });
    }
  }

  // Inserisci i nuovi giocatori
  const newRows = [
    ...starters.filter((id) => !existingIds.has(id)).map((player_id) => ({
      match_id: matchId,
      player_id,
      is_starter: true,
      minutes_played: 90,
    })),
    ...substitutes.filter((id) => !existingIds.has(id)).map((player_id) => ({
      match_id: matchId,
      player_id,
      is_starter: false,
      minutes_played: 0,
    })),
  ];
  if (newRows.length > 0) {
    const { error: insError } = await db.from("match_player_stats").insert(newRows);
    if (insError) return NextResponse.json({ error: insError.message }, { status: 500 });
  }

  // L'ordine in cui arrivano i titolari è l'ordine di click: diventa la posizione
  // sul campo (ignora l'errore se la colonna "slot" non è ancora stata creata).
  for (let i = 0; i < starters.length; i++) {
    await db.from("match_player_stats").update({ slot: i }).eq("match_id", matchId).eq("player_id", starters[i]);
  }

  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  return setLineup(req, ctx);
}

export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
  return setLineup(req, ctx);
}
