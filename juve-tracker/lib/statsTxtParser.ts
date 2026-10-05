// FORMATO DEL FILE .txt
// ---------------------------------------------------------------
// // le righe che iniziano con // sono commenti
// SQUADRA: possesso=58 tiri=14 tiri_porta=6 angoli=5 xg=1.85 ...
// AVVERSARIO: possesso=42 tiri=8 ...
// GIOCATORI:
// Federico CHIESA | titolare=si minuti=90 gol=1 assist=0 tiri=3 tiri_porta=2 passaggi=20/25 voto_sito=7.4
// Michele DI GREGORIO | titolare=si minuti=90 parate=4 gol_subiti=1 voto_sito=6.8
//
// - Il giocatore si riconosce dal NOME scritto prima del simbolo "|"
//   (maiuscole, accenti, ordine nome/cognome e solo cognome vanno bene).
//   In alternativa si può usare "numero=7" (numero di maglia) al posto del nome.
// - Dopo il "|" ci sono coppie chiave=valore separate da spazi.
// - Le chiavi omesse NON vengono toccate (si possono importare più file
//   sulla stessa partita senza perdere i dati).
// - Valori accettati: 3 | 0,85 | 85% | 3/5 (riusciti/totali, dove previsto).

export type StatsMap = Record<string, number>;

export interface ParsedPlayerStats {
  name?: string;
  numero?: number;
  is_starter?: boolean;
  stats: StatsMap;
}

// chiave nel file -> colonna del database
export const TEAM_KEY_MAP: Record<string, string> = {
  possesso: "possession",
  tiri: "shots_total",
  tiri_porta: "shots_on_target",
  angoli: "corners",
  falli: "fouls",
  gialli: "yellow_cards",
  rossi: "red_cards",
  fuorigioco: "offsides",
  passaggi: "passes_total",
  precisione: "passes_accuracy",
  xg: "xg",
  grandi_occasioni: "big_chances",
  tiri_bloccati: "shots_blocked",
  contrasti: "tackles",
  intercetti: "interceptions",
  liberate: "clearances",
  duelli_vinti: "duels_won",
  duelli_aerei_vinti: "aerial_won",
  dribbling_riusciti: "dribbles_won",
  lanci: "long_balls",
  cross: "crosses",
  parate: "saves",
  tocchi: "touches",
  tiri_area: "shots_inside_box",
  tiri_fuori_area: "shots_outside_box",
  colpi_testa: "headed_shots",
  rinvii: "goal_kicks",
  rimesse: "throw_ins",
  azioni_tiro: "shot_creating",
};

export const PLAYER_KEY_MAP: Record<string, string> = {
  minuti: "minutes_played",
  gol: "goals",
  assist: "assists",
  tiri: "shots_total",
  tiri_porta: "shots_on_target",
  tiri_fuori: "shots_off_target",
  tiri_bloccati: "shots_blocked",
  passaggi: "passes_total",
  passaggi_totali: "passes_total",
  passaggi_riusciti: "passes_accurate",
  passaggi_chiave: "passes_key",
  falli_fatti: "fouls_committed",
  falli_subiti: "fouls_suffered",
  gialli: "yellow_cards",
  rossi: "red_cards",
  parate: "saves",
  gol_subiti: "goals_conceded",
  // nuove
  xg: "xg",
  xa: "xa",
  tocchi: "touches",
  grandi_occasioni_create: "big_chances_created",
  grandi_occasioni_sbagliate: "big_chances_missed",
  dribbling_riusciti: "dribbles_won",
  dribbling_tentati: "dribbles_attempted",
  duelli_vinti: "duels_won",
  duelli_totali: "duels_total",
  duelli_aerei_vinti: "aerial_won",
  duelli_aerei_totali: "aerial_total",
  contrasti: "tackles",
  intercetti: "interceptions",
  liberate: "clearances",
  recuperi: "recoveries",
  palle_perse: "possession_lost",
  tiri_respinti: "blocks",
  lanci_riusciti: "long_balls_accurate",
  lanci_totali: "long_balls",
  cross_riusciti: "crosses_accurate",
  cross_totali: "crosses",
  fuorigioco: "offsides",
  autogol: "own_goals",
  rigori_segnati: "penalties_scored",
  rigori_sbagliati: "penalties_missed",
  uscite: "high_claims",
  voto_sito: "site_rating",
  angoli: "corners_won",
  angoli_guadagnati: "corners_won",
  cross: "crosses",
  tiri_area: "shots_inside_box",
  tiri_fuori_area: "shots_outside_box",
  colpi_testa: "headed_shots",
  pali: "hit_woodwork",
  rinvii: "goal_kicks",
  rimesse: "throw_ins",
  gol_fuori_area: "goals_outside_box",
  gol_destro: "goals_right_foot",
  gol_sinistro: "goals_left_foot",
  gol_testa: "goals_head",
  gol_punizione: "goals_free_kick",
  assist_fantasy: "fantasy_assists",
  azioni_tiro: "shot_creating",
  rigori_tentati: "penalties_attempted",
  rigori_guadagnati: "penalties_won",
  rigori_causati: "penalties_conceded",
  contrasti_vinti: "tackles_won",
  tiri_porta_subiti: "shots_on_target_against",
};

// chiavi "X/Y" -> [colonna riusciti, colonna totali]
export const PLAYER_PAIR_MAP: Record<string, [string, string]> = {
  passaggi: ["passes_accurate", "passes_total"],
  dribbling: ["dribbles_won", "dribbles_attempted"],
  duelli: ["duels_won", "duels_total"],
  duelli_aerei: ["aerial_won", "aerial_total"],
  lanci: ["long_balls_accurate", "long_balls"],
  cross: ["crosses_accurate", "crosses"],
};

function parsePairs(line: string): Record<string, string> {
  const pairs: Record<string, string> = {};
  for (const t of line.trim().split(/\s+/)) {
    const i = t.indexOf("=");
    if (i <= 0) continue;
    pairs[t.slice(0, i).toLowerCase()] = t.slice(i + 1);
  }
  return pairs;
}

function num(v: string): number | null {
  const n = Number(v.replace("%", "").replace(",", ".").trim());
  return Number.isFinite(n) ? n : null;
}

function isTrue(v: string | undefined) {
  return !!v && ["si", "sì", "true", "1", "yes"].includes(v.toLowerCase());
}

export function parseStatsTxt(raw: string): {
  juve: StatsMap;
  opponent: StatsMap;
  players: ParsedPlayerStats[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const juve: StatsMap = {};
  const opponent: StatsMap = {};
  const players: ParsedPlayerStats[] = [];

  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//") && !l.startsWith("#"));
  let inPlayers = false;

  const readTeam = (text: string, target: StatsMap, label: string) => {
    for (const [k, v] of Object.entries(parsePairs(text))) {
      const col = TEAM_KEY_MAP[k];
      const n = num(v);
      if (!col) warnings.push(`Chiave ${label} sconosciuta: "${k}"`);
      else if (n === null) warnings.push(`Valore non valido per ${label} "${k}=${v}"`);
      else target[col] = n;
    }
  };

  for (const line of lines) {
    if (/^giocatori:?$/i.test(line)) {
      inPlayers = true;
      continue;
    }
    if (/^squadra:/i.test(line)) {
      readTeam(line.replace(/^squadra:/i, ""), juve, "squadra");
      continue;
    }
    if (/^avversario:/i.test(line)) {
      readTeam(line.replace(/^avversario:/i, ""), opponent, "avversario");
      continue;
    }
    if (!inPlayers) continue;

    // "Nome COGNOME | chiave=valore ..."  oppure  "numero=7 chiave=valore ..."
    let name: string | undefined;
    let rest = line;
    const bar = line.indexOf("|");
    if (bar >= 0) {
      name = line.slice(0, bar).trim();
      rest = line.slice(bar + 1);
    }
    const pairs = parsePairs(rest);
    if (!name && !pairs.numero) {
      warnings.push(`Riga senza nome né numero: "${line}"`);
      continue;
    }

    const p: ParsedPlayerStats = { name: name || undefined, stats: {} };
    const label = name || `#${pairs.numero}`;
    if (pairs.numero) p.numero = Number(pairs.numero);
    if (pairs.titolare !== undefined) p.is_starter = isTrue(pairs.titolare);

    for (const [k, v] of Object.entries(pairs)) {
      if (k === "numero" || k === "titolare") continue;
      if (v.includes("/") && PLAYER_PAIR_MAP[k]) {
        const [a, b] = v.split("/").map((x) => num(x));
        if (a === null || b === null || a === undefined || b === undefined) {
          warnings.push(`Valore non valido "${k}=${v}" (${label})`);
          continue;
        }
        const [okCol, totCol] = PLAYER_PAIR_MAP[k];
        p.stats[okCol] = a;
        p.stats[totCol] = b;
        continue;
      }
      const col = PLAYER_KEY_MAP[k];
      const n = num(v);
      if (!col) warnings.push(`Chiave sconosciuta: "${k}" (${label})`);
      else if (n === null) warnings.push(`Valore non valido "${k}=${v}" (${label})`);
      else p.stats[col] = n;
    }
    players.push(p);
  }

  return { juve, opponent, players, warnings };
}
