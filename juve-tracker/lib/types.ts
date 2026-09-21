export type MatchStatus = "SCHEDULED" | "LIVE" | "FINISHED" | "POSTPONED";
export type Position = "GK" | "DF" | "MF" | "FW";

export interface Team {
  id: number;
  api_id: number;
  name: string;
  logo_url: string | null;
}

export interface Competition {
  id: number;
  api_id: number;
  name: string;
  short_name: string;
  logo_url: string | null;
}

export interface Match {
  id: number;
  api_id: number;
  competition: Competition | null;
  matchday: string | null;
  match_date: string;
  venue: string | null;
  home_team: Team | null;
  away_team: Team | null;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
  is_home: boolean;
  notes: string | null;
}

export interface Player {
  id: number;
  api_id: number;
  name: string;
  position: Position;
  shirt_number: number | null;
  photo_url: string | null;
  nationality: string | null;
}

// Colore-esito dal punto di vista della Juventus
export function matchOutcome(m: Pick<Match, "home_score" | "away_score" | "is_home" | "status">) {
  if (m.status !== "FINISHED" || m.home_score === null || m.away_score === null) return "upcoming";
  const juveScore = m.is_home ? m.home_score : m.away_score;
  const oppScore = m.is_home ? m.away_score : m.home_score;
  if (juveScore > oppScore) return "win";
  if (juveScore === oppScore) return "draw";
  return "loss";
}

export const OUTCOME_STYLES: Record<string, string> = {
  win: "bg-win/10 border-win text-win",
  draw: "bg-draw/10 border-draw text-draw",
  loss: "bg-loss/10 border-loss text-loss",
  upcoming: "bg-ink/5 border-line text-steel",
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
