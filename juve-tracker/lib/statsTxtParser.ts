// Legge un blocco di testo con questo formato (righe indipendenti dall'ordine):
//
// SQUADRA: possesso=58 tiri=14 tiri_porta=6 angoli=5 falli=10 gialli=2 rossi=0 fuorigioco=3 passaggi=480 precisione=87
// AVVERSARIO: possesso=42 tiri=8 tiri_porta=3 angoli=2 falli=14 gialli=3 rossi=1 fuorigioco=1 passaggi=320 precisione=79
// GIOCATORI:
// numero=7 minuti=90 gol=1 assist=0 tiri=3 tiri_porta=2 passaggi=20 falli_fatti=1 falli_subiti=3 gialli=0 rossi=0 titolare=si
// numero=1 minuti=90 parate=4 gol_subiti=1 titolare=si
//
// Ogni riga è una serie di coppie chiave=valore separate da spazi. Le righe vuote
// o che iniziano con "//" vengono ignorate. Non serve indicare tutti i campi:
// quelli omessi restano a 0 / vuoto.

export interface ParsedTeamStats {
  possession?: number;
  shots_total?: number;
  shots_on_target?: number;
  corners?: number;
  fouls?: number;
  yellow_cards?: number;
  red_cards?: number;
  offsides?: number;
  passes_total?: number;
  passes_accuracy?: number;
}

export interface ParsedPlayerStats {
  numero: number;
  minutes_played: number;
  goals: number;
  assists: number;
  shots_total: number;
  shots_on_target: number;
  passes_total: number;
  passes_key: number;
  fouls_committed: number;
  fouls_suffered: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  goals_conceded: number;
  is_starter: boolean;
}

const TEAM_KEY_MAP: Record<string, keyof ParsedTeamStats> = {
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
};

const PLAYER_KEY_MAP: Record<string, keyof ParsedPlayerStats> = {
  minuti: "minutes_played",
  gol: "goals",
  assist: "assists",
  tiri: "shots_total",
  tiri_porta: "shots_on_target",
  passaggi: "passes_total",
  passaggi_chiave: "passes_key",
  falli_fatti: "fouls_committed",
  falli_subiti: "fouls_suffered",
  gialli: "yellow_cards",
  rossi: "red_cards",
  parate: "saves",
  gol_subiti: "goals_conceded",
};

function parsePairs(line: string): Record<string, string> {
  const pairs: Record<string, string> = {};
  const tokens = line.trim().split(/\s+/);
  for (const t of tokens) {
    const [k, v] = t.split("=");
    if (k && v !== undefined) pairs[k.toLowerCase()] = v;
  }
  return pairs;
}

export function parseStatsTxt(raw: string): {
  juve: ParsedTeamStats;
  opponent: ParsedTeamStats;
  players: ParsedPlayerStats[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const juve: ParsedTeamStats = {};
  const opponent: ParsedTeamStats = {};
  const players: ParsedPlayerStats[] = [];

  const lines = raw.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("//"));
  let inPlayersSection = false;

  for (const line of lines) {
    if (/^giocatori:?$/i.test(line)) {
      inPlayersSection = true;
      continue;
    }
    if (/^squadra:/i.test(line)) {
      const pairs = parsePairs(line.replace(/^squadra:/i, ""));
      for (const [k, v] of Object.entries(pairs)) {
        const mapped = TEAM_KEY_MAP[k];
        if (mapped) (juve as any)[mapped] = Number(v);
        else warnings.push(`Chiave squadra sconosciuta: "${k}"`);
      }
      continue;
    }
    if (/^avversario:/i.test(line)) {
      const pairs = parsePairs(line.replace(/^avversario:/i, ""));
      for (const [k, v] of Object.entries(pairs)) {
        const mapped = TEAM_KEY_MAP[k];
        if (mapped) (opponent as any)[mapped] = Number(v);
        else warnings.push(`Chiave avversario sconosciuta: "${k}"`);
      }
      continue;
    }
    if (inPlayersSection) {
      const pairs = parsePairs(line);
      if (!pairs.numero) {
        warnings.push(`Riga giocatore senza "numero=": "${line}"`);
        continue;
      }
      const p: ParsedPlayerStats = {
        numero: Number(pairs.numero),
        minutes_played: 0,
        goals: 0,
        assists: 0,
        shots_total: 0,
        shots_on_target: 0,
        passes_total: 0,
        passes_key: 0,
        fouls_committed: 0,
        fouls_suffered: 0,
        yellow_cards: 0,
        red_cards: 0,
        saves: 0,
        goals_conceded: 0,
        is_starter: pairs.titolare === "si" || pairs.titolare === "true",
      };
      for (const [k, v] of Object.entries(pairs)) {
        if (k === "numero" || k === "titolare") continue;
        const mapped = PLAYER_KEY_MAP[k];
        if (mapped) (p as any)[mapped] = Number(v);
        else warnings.push(`Chiave giocatore sconosciuta: "${k}" (numero=${pairs.numero})`);
      }
      players.push(p);
    }
  }

  return { juve, opponent, players, warnings };
}
