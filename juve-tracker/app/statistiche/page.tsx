"use client";

import { useCallback, useEffect, useState } from "react";
import PlayersStatsTable from "@/components/PlayersStatsTable";
import SeasonTop3 from "@/components/SeasonTop3";
import { useSeason } from "@/components/SeasonProvider";
import { getTheme, getPageBackground } from "@/lib/competitionThemes";
import { computeSeasonStats } from "@/lib/types";
import { highestRound, leaguePhasePoints, pointsOf } from "@/lib/competitionProgress";

const TABS = [
  { key: "", themeKey: "all", label: "Tutte" },
  { key: "serie_a", themeKey: "serie_a", label: "Serie A" },
  { key: "europa_league", themeKey: "europa_league", label: "Europa League" },
  { key: "coppa_italia", themeKey: "coppa_italia", label: "Coppa Italia" },
];

export default function StatistichePage() {
  const { season, ready, label } = useSeason();
  const [active, setActive] = useState("");
  const [players, setPlayers] = useState<any[]>([]);
  const [seasonStats, setSeasonStats] = useState<any>({ played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0 });
  const [teamStats, setTeamStats] = useState<any>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const activeTab = TABS.find((t) => t.key === active) || TABS[0];
  const theme = getTheme(activeTab.themeKey === "all" ? null : activeTab.themeKey);

  const load = useCallback(
    async (silent = false) => {
      if (silent) setRefreshing(true);
      else setLoading(true);
      const qs = `?season=${season}${active ? `&competition=${active}` : ""}`;
      const [p, m, t] = await Promise.all([
        fetch(`/api/players${qs}`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/matches${qs}`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/team-stats${qs}`, { cache: "no-store" }).then((r) => r.json()),
      ]);
      setPlayers(p.players || []);
      setMatches(m.matches || []);
      setSeasonStats(computeSeasonStats(m.matches || []));
      setTeamStats(t);
      setLoading(false);
      setRefreshing(false);
    },
    [active, season]
  );

  useEffect(() => {
    if (!ready) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, season, ready]);

  useEffect(() => {
    const onFocus = () => load(true);
    window.addEventListener("focus", onFocus);
    const onVisible = () => {
      if (document.visibilityState === "visible") load(true);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  return (
    <div className="min-h-screen transition-colors duration-300" style={getPageBackground(theme)}>
      <div className="mx-auto max-w-[110rem] px-4 py-8 md:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="scoreboard text-3xl" style={{ color: theme.text }}>
            Statistiche <span className="text-xl" style={{ color: theme.accent }}>{label}</span>
          </h1>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="rounded-md px-3 py-1.5 text-xs font-medium"
            style={{ background: theme.accent, color: theme.accentText }}
          >
            {refreshing ? "Aggiorno…" : "↻ Aggiorna"}
          </button>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {TABS.map((tab) => {
            const isActive = active === tab.key;
            const tabTheme = getTheme(tab.themeKey === "all" ? null : tab.themeKey);
            return (
              <button
                key={tab.key}
                onClick={() => setActive(tab.key)}
                className="whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium border transition-colors"
                style={
                  isActive
                    ? { background: tabTheme.accent, color: tabTheme.accentText, borderColor: tabTheme.accent }
                    : { borderColor: theme.text + "33", color: theme.text, opacity: 0.7 }
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <p className="text-sm" style={{ color: theme.textMuted }}>
            Caricamento…
          </p>
        ) : (
          <>
            <div className="mb-8 grid gap-4 xl:grid-cols-3">
              <Block title="Risultati" theme={theme}>
                <Tiles>
                  <Stat label="Giocate" value={seasonStats.played} theme={theme} />
                  <Stat label="Vittorie" value={seasonStats.won} theme={theme} />
                  <Stat label="Pareggi" value={seasonStats.drawn} theme={theme} />
                  <Stat label="Sconfitte" value={seasonStats.lost} theme={theme} />
                  <Stat
                    label="% Vittorie"
                    value={seasonStats.played > 0 ? `${Math.round((seasonStats.won / seasonStats.played) * 100)}%` : "-"}
                    theme={theme}
                  />
                  {active === "serie_a" && <Stat label="Punti" value={pointsOf(matches)} theme={theme} />}
                  {active === "europa_league" && <Stat label="Punti (fase camp.)" value={leaguePhasePoints(matches)} theme={theme} />}
                  {(active === "europa_league" || active === "coppa_italia") && (
                    <Stat label="Turno raggiunto" value={highestRound(matches) ?? "-"} theme={theme} />
                  )}
                </Tiles>
              </Block>

              <Block title="Gol" theme={theme}>
                <Tiles>
                  <Stat label="Gol fatti" value={seasonStats.goals_for} theme={theme} />
                  <Stat label="Gol subiti" value={seasonStats.goals_against} theme={theme} />
                  <Stat
                    label="Differenza reti"
                    value={(() => {
                      const d = seasonStats.goals_for - seasonStats.goals_against;
                      return d > 0 ? `+${d}` : d;
                    })()}
                    theme={theme}
                  />
                  <Stat
                    label="Media fatti"
                    value={seasonStats.played > 0 ? (seasonStats.goals_for / seasonStats.played).toFixed(1) : "0.0"}
                    theme={theme}
                  />
                  <Stat
                    label="Media subiti"
                    value={seasonStats.played > 0 ? (seasonStats.goals_against / seasonStats.played).toFixed(1) : "0.0"}
                    theme={theme}
                  />
                </Tiles>
              </Block>

              {active === "" ? (
                <Block title="Classifiche e turni" theme={theme}>
                  <Tiles>
                    <Stat label="Punti Serie A" value={pointsOf(matches.filter((m) => m.competition?.short_name === "serie_a"))} theme={theme} />
                    <Stat
                      label="Punti Europa League"
                      value={leaguePhasePoints(matches.filter((m) => m.competition?.short_name === "europa_league"))}
                      theme={theme}
                    />
                    <Stat
                      label="Europa League · turno"
                      value={highestRound(matches.filter((m) => m.competition?.short_name === "europa_league")) ?? "-"}
                      theme={theme}
                    />
                    <Stat
                      label="Coppa Italia · turno"
                      value={highestRound(matches.filter((m) => m.competition?.short_name === "coppa_italia")) ?? "-"}
                      theme={theme}
                    />
                  </Tiles>
                </Block>
              ) : (
                <div className="hidden xl:block" />
              )}
            </div>

            {teamStats && teamStats.matchesWithStats > 0 && (
              <section className="mb-8">
                <h2 className="mb-3 text-sm font-medium uppercase tracking-wide" style={{ color: theme.textMuted }}>
                  Statistiche avanzate — da {teamStats.matchesWithStats} partite con statistiche importate
                </h2>
                <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
                  {ADV_GROUPS.map((g) => {
                    const items = g.items
                      .map((it) => ({ ...it, v: it.get(teamStats) }))
                      .filter((it) => it.v != null && it.v !== "-" && (typeof it.v !== "number" || it.v > 0 || it.keepZero));
                    if (items.length === 0) return null;
                    return (
                      <Block key={g.title} title={g.title} theme={theme}>
                        <Tiles>
                          {items.map((it) => (
                            <Stat key={it.label} label={it.label} value={it.v as any} theme={theme} />
                          ))}
                        </Tiles>
                      </Block>
                    );
                  })}
                </div>
              </section>
            )}

            {players.filter((p) => p.position === "CO").map((c) => {
              const cm = computeSeasonStats(matches.filter((m: any) => m.coach_id === c.id));
              if (cm.played === 0 && !c.season_stats.rated_matches) return null;
              return (
              <section key={c.id} className="mb-8">
                <h2 className="text-sm font-medium uppercase tracking-wide mb-3" style={{ color: theme.textMuted }}>
                  Allenatore — {c.name}
                </h2>
                <div
                  className="grid grid-cols-3 sm:grid-cols-5 gap-3 text-center rounded-lg p-4"
                  style={{ background: theme.surface, border: `1px solid ${theme.accent}33` }}
                >
                  <Stat label="Partite" value={cm.played} theme={theme} />
                  <Stat label="V-N-P" value={`${cm.won}-${cm.drawn}-${cm.lost}`} theme={theme} />
                  <Stat
                    label="% Vittorie"
                    value={cm.played > 0 ? `${Math.round((cm.won / cm.played) * 100)}%` : "-"}
                    theme={theme}
                  />
                  
                  <Stat
                    label="Voto medio"
                    value={c.season_stats.avg_rating != null ? c.season_stats.avg_rating.toFixed(2) : "-"}
                    theme={theme}
                  />
                  <Stat label="Voti dati" value={c.season_stats.rated_matches} theme={theme} />
                </div>
              </section>
              );
            })}

            <SeasonTop3 players={players} theme={theme} title={activeTab.label === "Tutte" ? "tutte le competizioni" : activeTab.label} />

            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium uppercase tracking-wide" style={{ color: theme.textMuted }}>
                  Giocatori {activeTab.label !== "Tutte" ? `— ${activeTab.label}` : "— stagione"}
                </h2>
                <p className="text-xs" style={{ color: theme.textMuted }}>
                  Clicca una colonna per ordinare
                </p>
              </div>
              {players.length === 0 ? (
                <p className="text-sm" style={{ color: theme.textMuted }}>
                  Nessun giocatore in rosa ancora.
                </p>
              ) : (
                <PlayersStatsTable players={players} theme={theme} />
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

type TS = Record<string, any>;
const pct = (v: any) => (v != null ? `${Number(v).toFixed(0)}%` : null);
const ADV_GROUPS: { title: string; items: { label: string; get: (t: TS) => any; keepZero?: boolean }[] }[] = [
  {
    title: "Attacco",
    items: [
      { label: "Tiri totali", get: (t) => t.shots_total },
      { label: "Tiri in porta", get: (t) => t.shots_on_target },
      { label: "% Tiri in porta", get: (t) => pct(t.shot_accuracy_avg) },
      { label: "xG totale", get: (t) => (t.xg > 0 ? Number(t.xg).toFixed(2) : null) },
      { label: "xG a partita", get: (t) => (t.xg > 0 && t.xg_avg != null ? Number(t.xg_avg).toFixed(2) : null) },
      { label: "Grandi occasioni", get: (t) => t.big_chances },
      { label: "Tiri in area", get: (t) => t.shots_inside_box },
      { label: "Tiri da fuori area", get: (t) => t.shots_outside_box },
      { label: "Tiri di testa", get: (t) => t.headed_shots },
      { label: "Tiri bloccati", get: (t) => t.shots_blocked },
      { label: "Pali/traverse", get: (t) => t.hit_woodwork },
      { label: "Azioni da tiro create", get: (t) => t.shot_creating },
      { label: "Dribbling riusciti", get: (t) => t.dribbles_won },
    ],
  },
  {
    title: "Possesso e passaggi",
    items: [
      { label: "Possesso medio", get: (t) => pct(t.possession_avg) },
      { label: "Passaggi totali", get: (t) => t.passes_total },
      { label: "Precisione passaggi", get: (t) => pct(t.passes_accuracy_avg) },
      { label: "Tocchi", get: (t) => t.touches },
      { label: "Lanci", get: (t) => t.long_balls },
      { label: "Cross", get: (t) => t.crosses },
      { label: "Angoli", get: (t) => t.corners },
      { label: "Rimesse laterali", get: (t) => t.throw_ins },
      { label: "Rinvii dal fondo", get: (t) => t.goal_kicks },
    ],
  },
  {
    title: "Difesa",
    items: [
      { label: "Contrasti", get: (t) => t.tackles },
      { label: "Intercetti", get: (t) => t.interceptions },
      { label: "Liberate", get: (t) => t.clearances },
      { label: "Duelli vinti", get: (t) => t.duels_won },
      { label: "Duelli aerei vinti", get: (t) => t.aerial_won },
      { label: "Parate", get: (t) => t.saves },
    ],
  },
  {
    title: "Disciplina",
    items: [
      { label: "Falli", get: (t) => t.fouls },
      { label: "Falli a partita", get: (t) => (t.fouls_per_match != null ? Number(t.fouls_per_match).toFixed(1) : null) },
      { label: "Gialli", get: (t) => t.yellow_cards, keepZero: true },
      { label: "Rossi", get: (t) => t.red_cards, keepZero: true },
      { label: "Fuorigioco", get: (t) => t.offsides },
    ],
  },
];

function Block({ title, theme, children }: { title: string; theme: ReturnType<typeof getTheme>; children: React.ReactNode }) {
  return (
    <section className="rounded-lg p-4" style={{ background: theme.surface, border: `1px solid ${theme.accent}33` }}>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide" style={{ color: theme.textMuted }}>
        {title}
      </p>
      {children}
    </section>
  );
}

function Tiles({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-x-3 gap-y-4 text-center">{children}</div>;
}

function Stat({ label, value, theme }: { label: string; value: number | string; theme: ReturnType<typeof getTheme> }) {
  return (
    <div>
      <p
        className={`scoreboard ${String(value).length > 7 ? "text-lg leading-8" : "text-2xl"}`}
        style={{ color: theme.accent }}
      >
        {value}
      </p>
      <p className="text-[11px]" style={{ color: theme.textMuted }}>
        {label}
      </p>
    </div>
  );
}
