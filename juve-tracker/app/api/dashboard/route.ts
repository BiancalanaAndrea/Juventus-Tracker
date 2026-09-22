import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { matchOutcome } from "@/lib/types";

export async function GET() {
  const db = supabaseServer();

  const { data: matches } = await db
    .from("matches")
    .select("*, competition:competitions(name,short_name)")
    .order("match_date", { ascending: true });

  const all = matches || [];
  const finished = all.filter((m) => m.status === "FINISHED");
  const upcoming = all.filter((m) => m.status !== "FINISHED");

  const lastMatch = finished[finished.length - 1] || null;
  const nextMatch = upcoming[0] || null;
  const lastFive = finished.slice(-5).reverse();

  const seasonStats = finished.reduce(
    (acc, m: any) => {
      const outcome = matchOutcome(m);
      acc.played += 1;
      acc.goals_for += m.juve_score || 0;
      acc.goals_against += m.opponent_score || 0;
      if (outcome === "win") acc.won += 1;
      else if (outcome === "draw") acc.drawn += 1;
      else if (outcome === "loss") acc.lost += 1;
      return acc;
    },
    { played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0 }
  );

  return NextResponse.json({ lastMatch, nextMatch, lastFive, seasonStats, allMatches: all });
}
