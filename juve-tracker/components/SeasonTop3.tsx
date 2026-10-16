"use client";

import PlayerPhoto from "./PlayerPhoto";
import { shortName } from "@/lib/names";
import { ratingColors } from "@/lib/ratingColor";
import type { CompetitionTheme } from "@/lib/competitionThemes";

// Classifiche "top 3" dei giocatori per la stagione / il campionato selezionato.
// Ogni scheda compare solo se c'è almeno un dato.

interface Cat {
  title: string;
  key: string;
  decimals?: number;
  colored?: boolean; // colore del voto
  worst?: boolean; // ordine crescente (i peggiori)
  minGames?: number; // presenze minime per comparire (per le medie voto)
}

const CATS: Cat[] = [
  { title: "Voto medio (miei voti)", key: "avg_rating", decimals: 2, colored: true, minGames: 2 },
  { title: "Voto medio (siti)", key: "avg_site_rating", decimals: 2, colored: true, minGames: 2 },
  { title: "I peggiori: voto medio (miei)", key: "avg_rating", decimals: 2, colored: true, worst: true, minGames: 2 },
  { title: "I peggiori: voto medio (siti)", key: "avg_site_rating", decimals: 2, colored: true, worst: true, minGames: 2 },
  { title: "🏆 MVP (miei voti)", key: "mvp_count" },
  { title: "🏆 MVP (voti siti)", key: "mvp_site_count" },
  { title: "👎 Peggiore (miei voti)", key: "worst_count" },
  { title: "👎 Peggiore (voti siti)", key: "worst_site_count" },
  { title: "Gol", key: "goals" },
  { title: "Assist", key: "assists" },
  { title: "Gol + assist", key: "goal_contributions" },
  { title: "Minuti giocati", key: "minutes" },
  { title: "Tiri", key: "shots_total" },
  { title: "Tiri in porta", key: "shots_on_target" },
  { title: "xG (gol attesi)", key: "xg", decimals: 2 },
  { title: "Passaggi chiave", key: "passes_key" },
  { title: "Azioni da tiro create", key: "shot_creating" },
  { title: "Passaggi", key: "passes_total" },
  { title: "Cross", key: "crosses" },
  { title: "Dribbling riusciti", key: "dribbles_won" },
  { title: "Contrasti", key: "tackles" },
  { title: "Intercetti", key: "interceptions" },
  { title: "Falli subiti", key: "fouls_suffered" },
  { title: "Falli commessi", key: "fouls_committed" },
  { title: "Gialli", key: "yellow_cards" },
  { title: "Parate", key: "saves" },
];

function fmt(v: number, decimals = 0) {
  return decimals > 0 ? String(parseFloat(v.toFixed(decimals))) : String(Math.round(v));
}

export default function SeasonTop3({ players, theme, title }: { players: any[]; theme: CompetitionTheme; title: string }) {
  const list = players.filter((p) => p.position !== "CO");

  const cards = CATS.map((cat) => {
    const rows = list
      .map((p) => ({ p, v: p.season_stats?.[cat.key] as number | null | undefined }))
      .filter((x): x is { p: any; v: number } => x.v != null && Number.isFinite(Number(x.v)) && Number(x.v) > 0)
      .filter((x) => !cat.minGames || (x.p.season_stats?.matches_played ?? 0) >= cat.minGames)
      .sort((a, b) => (cat.worst ? a.v - b.v : b.v - a.v) || String(a.p.name).localeCompare(String(b.p.name)))
      .slice(0, 3);
    return { cat, rows };
  }).filter((c) => c.rows.length > 0);

  if (cards.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-medium uppercase tracking-wide" style={{ color: theme.textMuted }}>
        I migliori — {title}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {cards.map(({ cat, rows }) => (
          <div
            key={cat.title}
            className="min-w-0 rounded-lg px-3 py-2.5"
            style={{ background: theme.surface, border: `1px solid ${theme.accent}33` }}
          >
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: theme.textMuted }}>
              {cat.title}
            </p>
            <ol className="space-y-1.5">
              {rows.map(({ p, v }, i) => {
                const col = cat.colored ? ratingColors(v) : null;
                return (
                  <li key={p.id} className="flex items-center gap-2">
                    <span className="w-3 text-center text-[11px] font-semibold" style={{ color: theme.textMuted }}>
                      {i + 1}
                    </span>
                    <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-neutral-700">
                      <PlayerPhoto url={p.photo_url} name={p.name} focusY={p.photo_focus_y} focusX={p.photo_focus_x} fallback={p.shirt_number ?? "?"} fallbackClassName="text-[9px]" />
                    </div>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium" style={{ color: theme.text }}>
                      {shortName(p.name)}
                    </span>
                    <span
                      className={`shrink-0 text-xs font-bold tabular-nums ${col ? "rounded px-1.5 py-0.5" : ""}`}
                      style={col ? { background: col.bg, color: col.text } : { color: theme.accent }}
                    >
                      {fmt(v, cat.decimals)}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </section>
  );
}
