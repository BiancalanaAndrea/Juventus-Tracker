import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { matchOutcome } from "@/lib/types";

export async function GET() {
  const db = supabaseServer();

  const { data: matches } = await db
    .from("matches")
    .select(
      "id, match_date, home_score, away_score, status, is_home, matchday, competition:competitions(name,short_name), home_team:teams!matches_home_team_id_fkey(name,logo_url), away_team:teams!matches_away_team_id_fkey(name,logo_url)"
    )
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
      const juveGoals = m.is_home ? m.home_score : m.away_score;
      const oppGoals = m.is_home ? m.away_score : m.home_score;
      acc.played += 1;
      acc.goals_for += juveGoals || 0;
      acc.goals_against += oppGoals || 0;
      if (outcome === "win") acc.won += 1;
      else if (outcome === "draw") acc.drawn += 1;
      else if (outcome === "loss") acc.lost += 1;
      return acc;
    },
    { played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0 }
  );

  return NextResponse.json({ lastMatch, nextMatch, lastFive, seasonStats, allMatches: all });
}
