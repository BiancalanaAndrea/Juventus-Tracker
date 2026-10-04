export type MatchStatus = "SCHEDULED" | "FINISHED" | "POSTPONED";
export type Position = "GK" | "DF" | "MF" | "FW";

export interface Competition {
  id: number;
  name: string;
  short_name: string;
}

export interface Match {
  id: number;
  competition: Competition | null;
  matchday: string | null;
  match_date: string;
  venue: string | null;
  opponent_name: string;
  opponent_logo_url: string | null;
  is_home: boolean;
  juve_score: number | null;
  opponent_score: number | null;
  status: MatchStatus;
  notes: string | null;
}

export interface Player {
  id: number;
  name: string;
  position: Position;
  shirt_number: number | null;
  photo_url: string | null;
  nationality: string | null;
}

// Colore-esito dal punto di vista della Juventus
export function matchOutcome(m: Pick<Match, "juve_score" | "opponent_score" | "status">) {
  if (m.status !== "FINISHED" || m.juve_score === null || m.opponent_score === null) return "upcoming";
  if (m.juve_score > m.opponent_score) return "win";
  if (m.juve_score === m.opponent_score) return "draw";
  return "loss";
}

export const OUTCOME_STYLES: Record<string, string> = {
  win: "bg-win/10 border-2 border-win text-win",
  draw: "bg-draw/10 border-2 border-draw text-draw",
  loss: "bg-loss/10 border-2 border-loss text-loss",
  upcoming: "bg-ink/5 border-2 border-line text-steel",
};

export const POSITION_ORDER: Position[] = ["GK", "DF", "MF", "FW"];
export const POSITION_LABELS: Record<Position, string> = {
  GK: "Portieri",
  DF: "Difensori",
  MF: "Centrocampisti",
  FW: "Attaccanti",
};

// Valutazione 0-10 a step di 0.25
export const RATING_STEPS = Array.from({ length: 41 }, (_, i) => i * 0.25);

export function computeSeasonStats(matches: Match[]) {
  const finished = matches.filter((m) => m.status === "FINISHED");
  return finished.reduce(
    (acc, m) => {
      const outcome = matchOutcome(m);
      acc.played += 1;
      acc.goals_for += m.juve_score || 0;
      acc.goals_against += m.opponent_score || 0;
      if (outcome === "win") acc.won += 1;
      else if (outcome === "draw") acc.drawn += 1;
      else if (outcome === "loss") acc.lost += 1;
      return acc;
    },
    { played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0 }
  );
}
