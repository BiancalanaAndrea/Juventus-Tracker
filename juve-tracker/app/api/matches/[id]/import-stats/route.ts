import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { parseStatsTxt } from "@/lib/statsTxtParser";

// body: { text: string }
// Legge il blocco di testo, lo interpreta e salva statistiche di squadra
// (Juve + avversario) e statistiche dei singoli giocatori (trovati in rosa
// tramite il numero di maglia).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const db = supabaseServer();
  const matchId = Number(params.id);
  const body = await req.json();

  if (!body.text || typeof body.text !== "string") {
    return NextResponse.json({ error: "Testo mancante" }, { status: 400 });
  }

  const { juve, opponent, players, warnings } = parseStatsTxt(body.text);
  const log: string[] = [...warnings.map((w) => `⚠️ ${w}`)];

  // Statistiche di squadra
  if (Object.keys(juve).length > 0) {
    await db.from("match_team_stats").upsert({ match_id: matchId, side: "juve", ...juve }, { onConflict: "match_id,side" });
    log.push("Statistiche squadra Juventus salvate");
  }
  if (Object.keys(opponent).length > 0) {
    await db
      .from("match_team_stats")
      .upsert({ match_id: matchId, side: "opponent", ...opponent }, { onConflict: "match_id,side" });
    log.push("Statistiche squadra avversaria salvate");
  }

  // Statistiche giocatori: associate tramite il numero di maglia
  const { data: roster } = await db.from("players").select("id, name, shirt_number").eq("active", true);
  const rosterByNumber = new Map((roster || []).map((p) => [p.shirt_number, p]));

  for (const p of players) {
    const player = rosterByNumber.get(p.numero);
    if (!player) {
      log.push(`⚠️ Nessun giocatore in rosa con la maglia numero ${p.numero} — riga ignorata`);
      continue;
    }
    const { numero, is_starter, ...stats } = p;
    await db
      .from("match_player_stats")
      .upsert({ match_id: matchId, player_id: player.id, is_starter, ...stats }, { onConflict: "match_id,player_id" });
    log.push(`Statistiche salvate per #${p.numero} ${player.name}`);
  }

  return NextResponse.json({ ok: true, log });
}
