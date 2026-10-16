// Premi della partita: MVP = voto più alto, "peggiore" = voto più basso.
// Si usa il MIO voto; se per quella partita non ho dato nessun voto, il voto dei siti.
// Se tutti hanno lo stesso voto (o c'è un solo voto) nessuno riceve il premio.
// Possono essere più giocatori a pari merito.

export interface RatedEntry {
  id: number;
  mine?: number | null;
  site?: number | null;
}

export interface MatchAwards {
  mvp: Set<number>;
  worst: Set<number>;
  basis: "mine" | "site" | null;
}

export function matchAwards(entries: RatedEntry[]): MatchAwards {
  const none: MatchAwards = { mvp: new Set(), worst: new Set(), basis: null };
  const num = (v: any) => (v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));

  const hasMine = entries.some((e) => num(e.mine) !== null);
  const basis: "mine" | "site" = hasMine ? "mine" : "site";
  const rated = entries
    .map((e) => ({ id: e.id, v: num(basis === "mine" ? e.mine : e.site) }))
    .filter((e): e is { id: number; v: number } => e.v !== null);

  if (rated.length < 2) return none;
  const max = Math.max(...rated.map((r) => r.v));
  const min = Math.min(...rated.map((r) => r.v));
  if (max === min) return none;

  return {
    mvp: new Set(rated.filter((r) => r.v === max).map((r) => r.id)),
    worst: new Set(rated.filter((r) => r.v === min).map((r) => r.id)),
    basis,
  };
}

// MVP / peggiore calcolati su una sola fonte di voti ("mine" = i miei voti, "site" = voti dei siti).
export function awardsBySource(entries: RatedEntry[], source: "mine" | "site") {
  const num = (v: any) => (v == null || v === "" || !Number.isFinite(Number(v)) ? null : Number(v));
  const rated = entries
    .map((e) => ({ id: e.id, v: num(source === "mine" ? e.mine : e.site) }))
    .filter((e): e is { id: number; v: number } => e.v !== null);
  const mvp = new Set<number>();
  const worst = new Set<number>();
  if (rated.length >= 2) {
    const max = Math.max(...rated.map((r) => r.v));
    const min = Math.min(...rated.map((r) => r.v));
    if (max !== min) {
      rated.filter((r) => r.v === max).forEach((r) => mvp.add(r.id));
      rated.filter((r) => r.v === min).forEach((r) => worst.add(r.id));
    }
  }
  return { mvp, worst };
}

// Conteggi per giocatore su più partite.
// rows: voti per partita. coachIds: da escludere.
export interface AwardCount {
  mvp: number; // MVP con i miei voti
  worst: number; // peggiore con i miei voti
  mvp_site: number; // MVP con i voti dei siti
  worst_site: number; // peggiore con i voti dei siti
}

export function countAwards(
  mine: { match_id: number; player_id: number; rating: any }[],
  site: { match_id: number; player_id: number; site_rating: any }[],
  excludeIds: Set<number>
): Map<number, AwardCount> {
  const byMatch = new Map<number, Map<number, RatedEntry>>();
  const entry = (m: number, p: number) => {
    if (!byMatch.has(m)) byMatch.set(m, new Map());
    const mm = byMatch.get(m)!;
    if (!mm.has(p)) mm.set(p, { id: p });
    return mm.get(p)!;
  };
  for (const r of mine) if (!excludeIds.has(r.player_id)) entry(r.match_id, r.player_id).mine = r.rating;
  for (const r of site) if (!excludeIds.has(r.player_id)) entry(r.match_id, r.player_id).site = r.site_rating;

  const out = new Map<number, AwardCount>();
  const bump = (id: number, k: keyof AwardCount) => {
    const cur = out.get(id) || { mvp: 0, worst: 0, mvp_site: 0, worst_site: 0 };
    cur[k]++;
    out.set(id, cur);
  };
  for (const entries of byMatch.values()) {
    const list = [...entries.values()];
    const m = awardsBySource(list, "mine");
    const st = awardsBySource(list, "site");
    m.mvp.forEach((id) => bump(id, "mvp"));
    m.worst.forEach((id) => bump(id, "worst"));
    st.mvp.forEach((id) => bump(id, "mvp_site"));
    st.worst.forEach((id) => bump(id, "worst_site"));
  }
  return out;
}
