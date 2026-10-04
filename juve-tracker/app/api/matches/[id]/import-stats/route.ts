export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase";
import { parseStatsTxt } from "@/lib/statsTxtParser";
import { matchPlayerByName } from "@/lib/playerMatch";

// body: { text: string }
// Legge il blocco di testo, lo interpreta e salva statistiche di squadra
// (Juve + avversario) e dei singoli giocatori, riconosciuti dal NOME
// (oppure dal numero di maglia se manca il nome).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const db = supabaseServer();
  const matchId = Number(params.id);
  const body = await req.json();

  if (!body.text || typeof body.text !== "string") {
    return NextResponse.json({ error: "Testo mancante" }, { status: 400 });
  }

  const { juve, opponent, players, warnings } = parseStatsTxt(body.text);
  const log: string[] = [...warnings.map((w) => `⚠️ ${w}`)];

  const fail = (what: string, message: string) => {
    log.push(`❌ ${what}: ${message}`);
  };

  // Statistiche di squadra
  if (Object.keys(juve).length > 0) {
    const { error } = await db
      .from("match_team_stats")
      .upsert({ match_id: matchId, side: "juve", ...juve }, { onConflict: "match_id,side" });
    if (error) fail("Squadra Juventus", error.message);
    else log.push("✅ Statistiche squadra Juventus salvate");
  }
  if (Object.keys(opponent).length > 0) {
    const { error } = await db
      .from("match_team_stats")
      .upsert({ match_id: matchId, side: "opponent", ...opponent }, { onConflict: "match_id,side" });
    if (error) fail("Squadra avversaria", error.message);
    else log.push("✅ Statistiche squadra avversaria salvate");
  }

  // Statistiche giocatori
  const { data: roster } = await db.from("players").select("id, name, shirt_number").eq("active", true);
  const rosterList = roster || [];
  const byNumber = new Map(rosterList.map((p) => [p.shirt_number, p]));

  for (const p of players) {
    let player: { id: number; name: string } | undefined;
    const label = p.name || `#${p.numero}`;

    if (p.name) {
      const m = matchPlayerByName(p.name, rosterList);
      if (m.ok) player = m.player;
      else if (m.reason === "ambiguous") {
        log.push(`⚠️ "${p.name}" è ambiguo (${m.candidates.map((c) => c.name).join(", ")}) — scrivi nome e cognome completi. Riga ignorata`);
        continue;
      }
    }
    if (!player && p.numero !== undefined) player = byNumber.get(p.numero);
    if (!player) {
      log.push(`⚠️ Nessun giocatore in rosa corrisponde a "${label}" — riga ignorata`);
      continue;
    }

    const row: Record<string, any> = { match_id: matchId, player_id: player.id, ...p.stats };
    if (p.is_starter !== undefined) row.is_starter = p.is_starter;
    const { error } = await db.from("match_player_stats").upsert(row, { onConflict: "match_id,player_id" });
    if (error) fail(player.name, error.message);
    else log.push(`✅ ${player.name}${p.name && p.name !== player.name ? ` (letto come "${p.name}")` : ""}`);
  }

  return NextResponse.json({ ok: true, log });
}
