import { POSITION_ORDER } from "@/lib/types";

// Moduli di gioco più usati. Ogni numero è una linea di giocatori, dalla difesa
// all'attacco (il portiere è sempre uno e non si scrive).
export const FORMATIONS = [
  // difesa a 3
  "3-5-2",
  "3-4-3",
  "3-4-2-1",
  "3-4-1-2",
  "3-1-4-2",
  "3-3-3-1",
  // difesa a 4
  "4-4-2",
  "4-3-3",
  "4-2-3-1",
  "4-1-4-1",
  "4-3-1-2",
  "4-4-1-1",
  "4-1-3-2",
  "4-3-2-1",
  "4-5-1",
  "4-2-4",
  "4-1-2-3",
  // difesa a 5
  "5-3-2",
  "5-4-1",
  "5-2-3",
];

export function parseFormation(f?: string | null): number[] | null {
  if (!f) return null;
  const parts = f.split("-").map((n) => Number(n));
  if (parts.length < 2 || parts.some((n) => !Number.isInteger(n) || n < 1)) return null;
  if (parts.reduce((a, b) => a + b, 0) !== 10) return null;
  return parts;
}

// Panchina nell'ordine in cui è stata scelta (se salvato), altrimenti da chi ha
// giocato più minuti a chi meno.
export function sortBench(bench: any[]): any[] {
  const hasOrder = bench.length > 0 && bench.every((ps) => Number.isInteger(ps.slot));
  return [...bench].sort((a, b) =>
    hasOrder
      ? a.slot - b.slot
      : (b.minutes_played || 0) - (a.minutes_played || 0) || (a.player.shirt_number ?? 99) - (b.player.shirt_number ?? 99)
  );
}

export interface PlacedPlayer {
  ps: any;
  slot: number; // posizione nell'ordine di lettura (portiere = 0, poi le linee)
  line: number;
  x: number; // % da sinistra
  y: number; // % dall'alto (il portiere è in basso)
}

// Posizioni orizzontali (da sinistra a destra) per una linea di n giocatori.
// Con 2 giocatori restano vicini al centro, non sulle fasce.
function lineXs(n: number): number[] {
  if (n === 1) return [50];
  if (n === 2) return [36, 64];
  return Array.from({ length: n }, (_, i) => 14 + (i * 72) / (n - 1));
}

// Dispone i titolari sul campo. L'ordine in cui li hai cliccati decide la
// posizione: il portiere sta a parte, poi i giocatori riempiono le linee dalla
// difesa all'attacco e, dentro ogni linea, da destra a sinistra (il primo
// cliccato è il più a destra). Se il modulo è noto e i titolari sono 11 (con un
// solo portiere) si usa quello; altrimenti il modulo viene ricavato dai ruoli.
export function layoutLineup(starters: any[], formation?: string | null) {
  const gks = starters.filter((ps) => ps.player.position === "GK");
  const outfield = starters.filter((ps) => ps.player.position !== "GK");
  const parsed = parseFormation(formation);
  const usable = !!parsed && starters.length === 11 && gks.length === 1;

  let lineSizes: number[];
  let formationLabel: string;
  if (usable) {
    lineSizes = [1, ...(parsed as number[])];
    formationLabel = formation as string;
  } else {
    const count = (pos: string) => outfield.filter((ps) => ps.player.position === pos).length;
    const roles = [count("DF"), count("MF"), count("FW")].filter((n) => n > 0);
    lineSizes = [gks.length, ...roles].filter((n) => n > 0);
    formationLabel = roles.join("-");
  }

  const byRole = (list: any[]) =>
    [...list].sort(
      (a, b) =>
        POSITION_ORDER.indexOf(a.player.position) - POSITION_ORDER.indexOf(b.player.position) ||
        (a.player.shirt_number ?? 99) - (b.player.shirt_number ?? 99)
    );
  const total = starters.length;
  const savedOk =
    starters.every((ps) => Number.isInteger(ps.slot) && ps.slot >= 0 && ps.slot < total) &&
    new Set(starters.map((ps) => ps.slot)).size === total;
  const orderedOutfield = savedOk ? [...outfield].sort((a, b) => a.slot - b.slot) : byRole(outfield);
  const ordered = [...gks, ...orderedOutfield];

  const placed: PlacedPlayer[] = [];
  const L = lineSizes.length;
  let cursor = 0;
  lineSizes.forEach((n, li) => {
    const count = Math.min(n, ordered.length - cursor);
    const xs = lineXs(count);
    const y = L === 1 ? 50 : 86 - (li * 72) / (L - 1);
    for (let i = 0; i < count; i++) {
      // il primo giocatore della linea è il più a destra
      placed.push({ ps: ordered[cursor], slot: cursor, line: li, x: xs[count - 1 - i], y });
      cursor++;
    }
  });
  return { placed, formationLabel };
}
