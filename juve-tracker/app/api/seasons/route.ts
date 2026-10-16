export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { currentSeason, seasonOfDate } from "@/lib/season";

// Elenco delle stagioni che hanno almeno una partita (+ quella in corso)
export async function GET() {
  const db = supabaseServer();
  const { data, error } = await db.from("matches").select("match_date");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const set = new Set<number>([currentSeason()]);
  for (const m of data || []) if (m.match_date) set.add(seasonOfDate(m.match_date));
  return NextResponse.json({ seasons: [...set].sort((a, b) => b - a), current: currentSeason() });
}
