"use client";

import PlayerPhoto from "./PlayerPhoto";
import { shortName } from "@/lib/names";
import { ratingColors } from "@/lib/ratingColor";
import type { CompetitionTheme } from "@/lib/competitionThemes";

// Classifiche "top 3" della partita: una piccola scheda per ogni statistica.
// Compaiono solo le statistiche per cui c'è almeno un dato.

interface Cat {
  title: string;
  value: (ps: any, ratings: Record<number, number>) => number | null;
  decimals?: number;
  colored?: boolean; // colore del voto
  worst?: boolean; // classifica dei peggiori (ordine crescente)
}

const n = (v: any) => (v == null || v === "" ? 0 : Number(v));

const CATS: Cat[] = [
  { title: "Il mio voto", value: (ps, r) => r[ps.player.id] ?? null, decimals: 2, colored: true },
  { title: "Voto dei siti", value: (ps) => (ps.site_rating != null ? Number(ps.site_rating) : null), decimals: 1, colored: true },
  { title: "I peggiori: il mio voto", value: (ps, r) => r[ps.player.id] ?? null, decimals: 2, colored: true, worst: true },
  { title: "I peggiori: voto dei siti", value: (ps) => (ps.site_rating != null ? Number(ps.site_rating) : null), decimals: 1, colored: true, worst: true },
  { title: "Gol", value: (ps) => n(ps.goals) },
  { title: "Assist", value: (ps) => n(ps.assists) },
  { title: "Tiri", value: (ps) => n(ps.shots_total) },
  { title: "Tiri in porta", value: (ps) => n(ps.shots_on_target) },
  { title: "xG (gol attesi)", value: (ps) => n(ps.xg), decimals: 2 },
  { title: "Azioni da tiro create", value: (ps) => n(ps.shot_creating) },
  { title: "Passaggi", value: (ps) => n(ps.passes_total) },
  { title: "Passaggi riusciti", value: (ps) => n(ps.passes_accurate) },
  { title: "Cross", value: (ps) => n(ps.crosses) },
  { title: "Contrasti", value: (ps) => n(ps.tackles) },
  { title: "Intercetti", value: (ps) => n(ps.interceptions) },
  { title: "Falli subiti", value: (ps) => n(ps.fouls_suffered) },
  { title: "Falli commessi", value: (ps) => n(ps.fouls_committed) },
  { title: "Parate", value: (ps) => n(ps.saves) },
];

function fmt(v: number, decimals = 0) {
  return decimals > 0 ? String(parseFloat(v.toFixed(decimals))) : String(Math.round(v));
}

export default function MatchTop3({
  playerStats,
  ratings,
  theme,
}: {
  playerStats: any[];
  ratings: Record<number, number>;
  theme: CompetitionTheme;
}) {
  // solo i giocatori (l'allenatore non ha statistiche)
  const players = playerStats.filter((ps) => ps.player && ps.player.position !== "CO");

  const cards = CATS.map((cat) => {
    const rows = players
      .map((ps) => ({ ps, v: cat.value(ps, ratings) }))
      .filter((x): x is { ps: any; v: number } => x.v != null && x.v > 0)
      .sort((a, b) => (cat.worst ? a.v - b.v : b.v - a.v) || String(a.ps.player.name).localeCompare(String(b.ps.player.name)))
      .slice(0, 3);
    return { cat, rows };
  }).filter((c) => c.rows.length > 0);

  if (cards.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: theme.accent }}>
        I migliori della partita
      </p>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {cards.map(({ cat, rows }) => (
          <div key={cat.title} className="card min-w-0 px-3 py-2.5">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-steel">{cat.title}</p>
            <ol className="space-y-1.5">
              {rows.map(({ ps, v }, i) => {
                const p = ps.player;
                const col = cat.colored ? ratingColors(v) : null;
                return (
                  <li key={p.id} className="flex items-center gap-2">
                    <span className="w-3 text-center text-[11px] font-semibold text-steel">{i + 1}</span>
                    <div className="h-6 w-6 shrink-0 overflow-hidden rounded-full bg-ink/10">
                      <PlayerPhoto url={p.photo_url} name={p.name} focusY={p.photo_focus_y} focusX={p.photo_focus_x} fallback={p.shirt_number ?? "?"} fallbackClassName="text-[9px]" />
                    </div>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">{shortName(p.name)}</span>
                    <span
                      className={`shrink-0 text-xs font-bold tabular-nums ${col ? "rounded px-1.5 py-0.5" : ""}`}
                      style={col ? { background: col.bg, color: col.text } : undefined}
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
    </div>
  );
}
