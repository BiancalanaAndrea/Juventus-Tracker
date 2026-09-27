import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// body atteso: { player_id: number, rating: number (0-10, step 0.25), note?: string }
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const db = supabaseServer();
  const matchId = Number(params.id);
  const body = await req.json();

  const rating = Number(body.rating);
  if (isNaN(rating) || rating < 0 || rating > 10 || Math.round(rating * 4) !== rating * 4) {
    return NextResponse.json(
      { error: "Il voto deve essere tra 0 e 10, con incrementi di 0.25" },
      { status: 400 }
    );
  }

  const { error } = await db.from("ratings").upsert(
    {
      match_id: matchId,
      player_id: body.player_id,
      rating,
      note: body.note ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "match_id,player_id" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
