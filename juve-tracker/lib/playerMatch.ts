// Riconoscimento dei giocatori tramite il NOME scritto nel file .txt.
// Funziona anche se in rosa i giocatori sono scritti "Nome COGNOME" e nel file
// (o nello screenshot del sito) compaiono in modo diverso: maiuscole/minuscole,
// accenti, "COGNOME Nome", solo il cognome, iniziale del nome ("K. Thuram")...

export function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // toglie gli accenti
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/ø/g, "o")
    .replace(/ł/g, "l")
    .replace(/đ/g, "d")
    .replace(/ß/g, "ss")
    .replace(/['’`´]/g, "") // d'Ambrosio -> dambrosio
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): string[] {
  return normalizeName(s).split(" ").filter(Boolean);
}

// "k" combacia con "kenan" (iniziale)
function tokenMatch(a: string, b: string): "full" | "initial" | null {
  if (a === b) return "full";
  if (a.length <= 2 && b.length > a.length && b.startsWith(a)) return "initial";
  if (b.length <= 2 && a.length > b.length && a.startsWith(b)) return "initial";
  return null;
}

export interface RosterPlayer {
  id: number;
  name: string;
  shirt_number?: number | null;
}

export type NameMatchResult =
  | { ok: true; player: RosterPlayer }
  | { ok: false; reason: "not_found" }
  | { ok: false; reason: "ambiguous"; candidates: RosterPlayer[] };

export function matchPlayerByName(input: string, roster: RosterPlayer[]): NameMatchResult {
  const inTokens = tokens(input);
  if (inTokens.length === 0) return { ok: false, reason: "not_found" };

  const scored: { p: RosterPlayer; score: number }[] = [];

  for (const p of roster) {
    const rTokens = tokens(p.name);
    if (rTokens.length === 0) continue;

    // quanti token del nome nel file trovano un token in rosa
    let fullHits = 0;
    let initialHits = 0;
    const used = new Set<number>();
    for (const t of inTokens) {
      let found = false;
      for (let i = 0; i < rTokens.length; i++) {
        if (used.has(i)) continue;
        const m = tokenMatch(t, rTokens[i]);
        if (m === "full") {
          fullHits++;
          used.add(i);
          found = true;
          break;
        }
      }
      if (!found) {
        for (let i = 0; i < rTokens.length; i++) {
          if (used.has(i)) continue;
          if (tokenMatch(t, rTokens[i]) === "initial") {
            initialHits++;
            used.add(i);
            break;
          }
        }
      }
    }
    if (fullHits === 0) continue; // serve almeno una parola intera in comune (es. il cognome)

    const inCovered = (fullHits + initialHits) / inTokens.length;
    const rosterCovered = fullHits / rTokens.length;
    // nome identico (in qualsiasi ordine) = punteggio massimo
    const exact = inTokens.length === rTokens.length && fullHits === rTokens.length ? 10 : 0;
    const score = exact + fullHits * 2 + initialHits * 0.5 + inCovered + rosterCovered;
    scored.push({ p, score });
  }

  if (scored.length === 0) return { ok: false, reason: "not_found" };
  scored.sort((a, b) => b.score - a.score);
  const best = scored[0];
  const tied = scored.filter((s) => Math.abs(s.score - best.score) < 0.001);
  if (tied.length > 1) return { ok: false, reason: "ambiguous", candidates: tied.map((t) => t.p) };
  return { ok: true, player: best.p };
}
