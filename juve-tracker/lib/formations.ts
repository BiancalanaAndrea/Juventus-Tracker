import { POSITION_ORDER } from "@/lib/types";

// Moduli di gioco più usati. Ogni numero è una linea di giocatori, dalla difesa
// all'attacco (il portiere è sempre uno e non si scrive).
export const FORMATIONS = [
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
  "3-5-2",
  "3-4-3",
  "3-4-2-1",
  "3-4-1-2",
  "3-1-4-2",
  "3-3-3-1",
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

export interface PlacedPlayer {
  ps: any;
  slot: number;
  line: number;
  x: number; // % da sinistra
  y: number; // % dall'alto (il portiere è in basso)
}

// Dispone i titolari sul campo. Se il modulo è noto e i titolari sono 11 (con un
// solo portiere) si usa quello; altrimenti il modulo viene ricavato dai ruoli.
// L'ordine dentro ogni linea (sinistra → destra) è quello salvato in "slot",
// oppure, se non c'è, ruolo e numero di maglia.
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

  const byRole = [...starters].sort(
    (a, b) =>
      POSITION_ORDER.indexOf(a.player.position) - POSITION_ORDER.indexOf(b.player.position) ||
      (a.player.shirt_number ?? 99) - (b.player.shirt_number ?? 99)
  );
  const total = starters.length;
  const savedOk =
    starters.every((ps) => Number.isInteger(ps.slot) && ps.slot >= 0 && ps.slot < total) &&
    new Set(starters.map((ps) => ps.slot)).size === total;
  const slotOf = (ps: any) => (savedOk ? (ps.slot as number) : byRole.indexOf(ps));

  const ordered = [...starters].sort((a, b) => slotOf(a) - slotOf(b));
  const placed: PlacedPlayer[] = [];
  const L = lineSizes.length;
  let cursor = 0;
  lineSizes.forEach((n, li) => {
    for (let i = 0; i < n && cursor < ordered.length; i++) {
      const x = n === 1 ? 50 : 14 + (i * 72) / (n - 1);
      const y = L === 1 ? 50 : 86 - (li * 72) / (L - 1);
      placed.push({ ps: ordered[cursor], slot: cursor, line: li, x, y });
      cursor++;
    }
  });
  return { placed, formationLabel };
}
