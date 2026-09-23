import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

// GET: lista partite, filtrabile per competizione (?competition=serie_a)
export async function GET(req: NextRequest) {
  const db = supabaseServer();
  const competition = req.nextUrl.searchParams.get("competition");

  let query = db
    .from("matches")
    .select("*, competition:competitions(id,name,short_name)")
    .order("match_date", { ascending: true });

  if (competition) {
    const { data: comp } = await db.from("competitions").select("id").eq("short_name", competition).single();
    if (comp) query = query.eq("competition_id", comp.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ matches: data });
}

// POST: crea una nuova partita a mano
export async function POST(req: NextRequest) {
  const db = supabaseServer();
  const body = await req.json();

  const { data: comp } = await db
    .from("competitions")
    .select("id")
    .eq("short_name", body.competition_short_name)
    .single();
  if (!comp) return NextResponse.json({ error: "Competizione non valida" }, { status: 400 });

  const { data, error } = await db
    .from("matches")
    .insert({
      competition_id: comp.id,
      matchday: body.matchday || null,
      match_date: body.match_date,
      venue: body.venue || null,
      opponent_name: body.opponent_name,
      opponent_logo_url: body.opponent_logo_url || null,
      is_home: body.is_home,
      juve_score: body.juve_score ?? null,
      opponent_score: body.opponent_score ?? null,
      status: body.status || "SCHEDULED",
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ match: data });
}
