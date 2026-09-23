import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET() {
  const db = supabaseServer();
  const { data, error } = await db.from("standings").select("*").order("position", { ascending: true, nullsFirst: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ standings: data });
}

// Crea o aggiorna la riga di una squadra in classifica (a mano)
export async function PUT(req: NextRequest) {
  const db = supabaseServer();
  const body = await req.json();
  if (!body.team_name) return NextResponse.json({ error: "team_name obbligatorio" }, { status: 400 });

  const { error } = await db.from("standings").upsert(
    {
      team_name: body.team_name,
      is_juve: !!body.is_juve,
      position: body.position ?? null,
      played: body.played ?? 0,
      won: body.won ?? 0,
      drawn: body.drawn ?? 0,
      lost: body.lost ?? 0,
      goals_for: body.goals_for ?? 0,
      goals_against: body.goals_against ?? 0,
      points: body.points ?? 0,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "team_name" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
