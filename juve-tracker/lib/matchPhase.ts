// Fase di compilazione di una partita:
//  1 = partita creata
//  2 = inseriti giocatori (formazione) e/o voti
//  3 = importate le statistiche (file .txt o inserimento delle statistiche)
// Usato dalla lista partite e dalla dashboard per mostrare l'icona grigia/gialla/verde.

async function fetchAllIds(build: () => any): Promise<Set<number>> {
  const ids = new Set<number>();
  const page = 1000;
  for (let from = 0; from < 50000; from += page) {
    const { data, error } = await build().range(from, from + page - 1);
    if (error || !data) break;
    for (const r of data) ids.add(r.match_id);
    if (data.length < page) break;
  }
  return ids;
}

export async function attachPhases<T extends { id: number }>(db: any, matches: T[]): Promise<(T & { phase: 1 | 2 | 3 })[]> {
  if (matches.length === 0) return [];

  const [teamStats, playerStats, anyPlayers, anyRatings] = await Promise.all([
    fetchAllIds(() =>
      db.from("match_team_stats").select("match_id").eq("side", "juve").or("possession.not.is.null,shots_total.not.is.null")
    ),
    fetchAllIds(() =>
      db.from("match_player_stats").select("match_id").or("minutes_played.gt.0,passes_total.gt.0,shots_total.gt.0")
    ),
    fetchAllIds(() => db.from("match_player_stats").select("match_id")),
    fetchAllIds(() => db.from("ratings").select("match_id")),
  ]);

  return matches.map((m) => {
    let phase: 1 | 2 | 3 = 1;
    if (anyPlayers.has(m.id) || anyRatings.has(m.id)) phase = 2;
    if (teamStats.has(m.id) || playerStats.has(m.id)) phase = 3;
    return { ...m, phase };
  });
}
