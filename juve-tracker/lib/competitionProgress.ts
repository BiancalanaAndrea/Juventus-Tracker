import { matchOutcome } from "@/lib/types";

// Turni a eliminazione diretta, dal più basso al più alto. Si riconoscono dal
// testo scritto nel campo "Giornata / turno" (andata/ritorno vengono ignorati).
const ROUNDS: { rank: number; label: string; test: (t: string) => boolean }[] = [
  { rank: 1, label: "Trentaduesimi", test: (t) => t.includes("trentaduesimi") },
  { rank: 2, label: "Sedicesimi", test: (t) => t.includes("sedicesimi") },
  { rank: 3, label: "Playoff", test: (t) => t.includes("playoff") || t.includes("play-off") || t.includes("play off") },
  { rank: 4, label: "Ottavi", test: (t) => t.includes("ottav") },
  { rank: 5, label: "Quarti di finale", test: (t) => t.includes("quart") },
  { rank: 6, label: "Semifinale", test: (t) => t.includes("semifinal") },
  { rank: 7, label: "Finale", test: (t) => /\bfinale\b/.test(t) },
];

function norm(text?: string | null) {
  return (text || "").toLowerCase();
}

// Il turno di una partita, oppure null se non è a eliminazione diretta
// (es. "Giornata 5" o "Fase campionato 3").
export function knockoutRound(matchday?: string | null) {
  const t = norm(matchday);
  if (!t) return null;
  // "semifinale" contiene "finale": si controlla dal turno più alto al più basso,
  // ma la Semifinale ha la precedenza sulla Finale
  if (t.includes("semifinal")) return ROUNDS[5];
  for (let i = ROUNDS.length - 1; i >= 0; i--) if (ROUNDS[i].test(t)) return ROUNDS[i];
  return null;
}

// Il turno più alto raggiunto tra le partite inserite (null se non ce ne sono)
export function highestRound(matches: any[]): string | null {
  let best: { rank: number; label: string } | null = null;
  for (const m of matches) {
    const r = knockoutRound(m.matchday);
    if (r && (!best || r.rank > best.rank)) best = r;
  }
  return best ? best.label : null;
}

export function pointsOf(matches: any[]): number {
  return matches
    .filter((m) => m.status === "FINISHED")
    .reduce((acc, m) => {
      const o = matchOutcome(m);
      return acc + (o === "win" ? 3 : o === "draw" ? 1 : 0);
    }, 0);
}

// Europa League: i punti valgono solo nella fase campionato (prime 8 partite
// non a eliminazione diretta, in ordine di data).
export function leaguePhasePoints(matches: any[]): number {
  const league = matches
    .filter((m) => !knockoutRound(m.matchday))
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
    .slice(0, 8);
  return pointsOf(league);
}
