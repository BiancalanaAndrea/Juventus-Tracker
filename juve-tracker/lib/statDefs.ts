// Elenco centrale delle statistiche "extra" (oltre a gol/assist/tiri...).
// Usato da pagina giocatore, dettaglio partita e tabelle, così basta
// aggiungere una riga qui per vederla ovunque.

export interface StatDef {
  key: string; // colonna in match_player_stats
  label: string;
  decimals?: number;
  gkOnly?: boolean;
}

export const PLAYER_EXTRA_GROUPS: { title: string; stats: StatDef[] }[] = [
  {
    title: "Attacco",
    stats: [
      { key: "xg", label: "xG", decimals: 2 },
      { key: "xa", label: "xA", decimals: 2 },
      { key: "big_chances_created", label: "Grandi occasioni create" },
      { key: "big_chances_missed", label: "Grandi occasioni sbagliate" },
      { key: "shots_off_target", label: "Tiri fuori" },
      { key: "shots_blocked", label: "Tiri bloccati" },
      { key: "shots_inside_box", label: "Tiri in area" },
      { key: "shots_outside_box", label: "Tiri da fuori area" },
      { key: "headed_shots", label: "Tiri di testa" },
      { key: "hit_woodwork", label: "Pali/traverse" },
      { key: "shot_creating", label: "Azioni da tiro create" },
      { key: "fantasy_assists", label: "Assist fantasy" },
      { key: "corners_won", label: "Angoli guadagnati" },
      { key: "goals_right_foot", label: "Gol di destro" },
      { key: "goals_left_foot", label: "Gol di sinistro" },
      { key: "goals_head", label: "Gol di testa" },
      { key: "goals_outside_box", label: "Gol da fuori area" },
      { key: "goals_free_kick", label: "Gol su punizione" },
      { key: "dribbles_won", label: "Dribbling riusciti" },
      { key: "dribbles_attempted", label: "Dribbling tentati" },
      { key: "offsides", label: "Fuorigioco" },
      { key: "penalties_scored", label: "Rigori segnati" },
      { key: "penalties_missed", label: "Rigori sbagliati" },
    ],
  },
  {
    title: "Possesso e passaggi",
    stats: [
      { key: "touches", label: "Tocchi" },
      { key: "passes_accurate", label: "Passaggi riusciti" },
      { key: "long_balls_accurate", label: "Lanci riusciti" },
      { key: "long_balls", label: "Lanci totali" },
      { key: "crosses_accurate", label: "Cross riusciti" },
      { key: "crosses", label: "Cross totali" },
      { key: "possession_lost", label: "Palle perse" },
      { key: "throw_ins", label: "Rimesse laterali" },
    ],
  },
  {
    title: "Difesa e duelli",
    stats: [
      { key: "tackles", label: "Contrasti" },
      { key: "interceptions", label: "Intercetti" },
      { key: "clearances", label: "Liberate" },
      { key: "blocks", label: "Tiri respinti" },
      { key: "recoveries", label: "Recuperi" },
      { key: "duels_won", label: "Duelli vinti" },
      { key: "duels_total", label: "Duelli totali" },
      { key: "aerial_won", label: "Duelli aerei vinti" },
      { key: "aerial_total", label: "Duelli aerei totali" },
      { key: "own_goals", label: "Autogol" },
    ],
  },
  {
    title: "Portiere",
    stats: [
      { key: "high_claims", label: "Uscite", gkOnly: true },
      { key: "goal_kicks", label: "Rinvii dal fondo", gkOnly: true },
    ],
  },
];

export const ALL_EXTRA_KEYS: string[] = PLAYER_EXTRA_GROUPS.flatMap((g) => g.stats.map((s) => s.key));
export const DECIMAL_KEYS = new Set(["xg", "xa"]);

export function fmtStat(v: any, decimals = 0): string {
  if (v == null || v === "") return "-";
  const n = Number(v);
  if (!Number.isFinite(n)) return "-";
  return decimals > 0 ? n.toFixed(decimals) : String(Math.round(n));
}

// Statistiche di squadra extra (riga: etichetta, colonna, decimali)
export const TEAM_EXTRA_ROWS: { label: string; key: string; decimals?: number }[] = [
  { label: "xG (gol attesi)", key: "xg", decimals: 2 },
  { label: "Grandi occasioni", key: "big_chances" },
  { label: "Tiri bloccati", key: "shots_blocked" },
  { label: "Tiri in area", key: "shots_inside_box" },
  { label: "Tiri da fuori area", key: "shots_outside_box" },
  { label: "Tiri di testa", key: "headed_shots" },
  { label: "Azioni da tiro create", key: "shot_creating" },
  { label: "Rinvii dal fondo", key: "goal_kicks" },
  { label: "Rimesse laterali", key: "throw_ins" },
  { label: "Tocchi", key: "touches" },
  { label: "Lanci", key: "long_balls" },
  { label: "Cross", key: "crosses" },
  { label: "Dribbling riusciti", key: "dribbles_won" },
  { label: "Duelli vinti", key: "duels_won" },
  { label: "Duelli aerei vinti", key: "aerial_won" },
  { label: "Contrasti", key: "tackles" },
  { label: "Intercetti", key: "interceptions" },
  { label: "Liberate", key: "clearances" },
  { label: "Parate", key: "saves" },
];
