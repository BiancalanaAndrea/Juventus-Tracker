export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// Salva la posizione (ordine sul campo) dei titolari: [{ player_id, slot }]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const db = supabaseServer();
  const matchId = Number(params.id);
  const body = await req.json();
  const slots: { player_id: number; slot: number }[] = body.slots || [];
  for (const s of slots) {
    const { error } = await db
      .from("match_player_stats")
      .update({ slot: s.slot })
      .eq("match_id", matchId)
      .eq("player_id", s.player_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
