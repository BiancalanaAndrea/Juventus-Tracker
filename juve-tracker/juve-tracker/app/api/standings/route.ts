import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";

export async function GET() {
  const db = supabaseServer();
  const { data, error } = await db
    .from("standings")
    .select("position, played, won, drawn, lost, goals_for, goals_against, points, team:teams(id,name,logo_url)")
    .order("position", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ standings: data });
}
