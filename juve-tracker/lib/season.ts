// Stagioni: dal 1° luglio al 30 giugno dell'anno dopo.
// Una stagione è identificata dall'anno di inizio: 2026 = stagione 2026/27.
// Non serve salvare nulla nel database: la stagione di una partita si ricava dalla sua data.

export const SEASON_START_MONTH = 6; // luglio (0 = gennaio)

export function seasonOfDate(d: Date | string): number {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.getMonth() >= SEASON_START_MONTH ? date.getFullYear() : date.getFullYear() - 1;
}

export function currentSeason(): number {
  return seasonOfDate(new Date());
}

export function seasonLabel(season: number): string {
  return `${season}/${String((season + 1) % 100).padStart(2, "0")}`;
}

// estremi della stagione, in formato ISO (da incluso, a escluso)
export function seasonBounds(season: number): { from: string; to: string } {
  return {
    from: new Date(Date.UTC(season, SEASON_START_MONTH, 1)).toISOString(),
    to: new Date(Date.UTC(season + 1, SEASON_START_MONTH, 1)).toISOString(),
  };
}

export function parseSeasonParam(v: string | null | undefined): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isInteger(n) && n > 1990 && n < 2200 ? n : null;
}
