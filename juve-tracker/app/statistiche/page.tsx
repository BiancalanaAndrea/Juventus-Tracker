"use client";

import { useCallback, useEffect, useState } from "react";
import PlayersStatsTable from "@/components/PlayersStatsTable";
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
      const qs = active ? `?competition=${active}` : "";
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
    [active]
  );

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    const onFocus = () => load(true);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") load(true);
    });
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div className="min-h-screen transition-colors duration-300" style={getPageBackground(theme)}>
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="scoreboard text-3xl" style={{ color: theme.text }}>
            Statistiche
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
            <section className="rounded-lg p-6 mb-8" style={{ background: theme.surface, border: `1px solid ${theme.accent}33` }}>
              <p className="text-sm uppercase tracking-wide mb-4 font-medium" style={{ color: theme.textMuted }}>
                Squadra — riepilogo {activeTab.label !== "Tutte" ? `(${activeTab.label})` : ""}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center mb-4">
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
                {active === "europa_league" && (
                  <Stat label="Punti (fase campionato)" value={leaguePhasePoints(matches)} theme={theme} />
                )}
                {(active === "europa_league" || active === "coppa_italia") && (
                  <Stat label="Turno raggiunto" value={highestRound(matches) ?? "-"} theme={theme} />
                )}
              </div>
              {active === "" && (
                <div
                  className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-4 pt-4"
                  style={{ borderTop: `1px solid ${theme.accent}33` }}
                >
                  <Stat
                    label="Punti Serie A"
                    value={pointsOf(matches.filter((m) => m.competition?.short_name === "serie_a"))}
                    theme={theme}
                  />
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
                </div>
              )}
              <div
                className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center pt-4"
                style={{ borderTop: `1px solid ${theme.accent}33` }}
              >
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
                  label="Media gol fatti"
                  value={seasonStats.played > 0 ? (seasonStats.goals_for / seasonStats.played).toFixed(1) : "0.0"}
                  theme={theme}
                />
                <Stat
                  label="Media gol subiti"
                  value={seasonStats.played > 0 ? (seasonStats.goals_against / seasonStats.played).toFixed(1) : "0.0"}
                  theme={theme}
                />
              </div>
              {teamStats && teamStats.matchesWithStats > 0 && (
                <>
                  <p
                    className="text-xs uppercase tracking-wide mb-3 mt-4 pt-4"
                    style={{ color: theme.textMuted, borderTop: `1px solid ${theme.accent}33` }}
                  >
                    Avanzate (da {teamStats.matchesWithStats} partite con statistiche importate)
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 text-center">
                    <Stat
                      label="Possesso medio"
                      value={teamStats.possession_avg != null ? `${teamStats.possession_avg.toFixed(0)}%` : "-"}
                      theme={theme}
                    />
                    <Stat label="Tiri totali" value={teamStats.shots_total} theme={theme} />
                    <Stat label="Tiri in porta" value={teamStats.shots_on_target} theme={theme} />
                    <Stat
                      label="% Tiri in porta"
                      value={teamStats.shot_accuracy_avg != null ? `${teamStats.shot_accuracy_avg.toFixed(0)}%` : "-"}
                      theme={theme}
                    />
                    <Stat label="Passaggi totali" value={teamStats.passes_total} theme={theme} />
                    <Stat
                      label="Precisione passaggi"
                      value={teamStats.passes_accuracy_avg != null ? `${teamStats.passes_accuracy_avg.toFixed(0)}%` : "-"}
                      theme={theme}
                    />
                    <Stat label="Angoli" value={teamStats.corners} theme={theme} />
                    <Stat label="Fuorigioco" value={teamStats.offsides} theme={theme} />
                    <Stat label="Falli" value={teamStats.fouls} theme={theme} />
                    <Stat
                      label="Falli a partita"
                      value={teamStats.fouls_per_match != null ? teamStats.fouls_per_match.toFixed(1) : "-"}
                      theme={theme}
                    />
                    <Stat label="Gialli" value={teamStats.yellow_cards} theme={theme} />
                    <Stat label="Rossi" value={teamStats.red_cards} theme={theme} />
                    {teamStats.xg > 0 && <Stat label="xG totale" value={Number(teamStats.xg).toFixed(2)} theme={theme} />}
                    {teamStats.xg_avg != null && teamStats.xg > 0 && (
                      <Stat label="xG a partita" value={Number(teamStats.xg_avg).toFixed(2)} theme={theme} />
                    )}
                    {[
                      ["Grandi occasioni", "big_chances"],
                      ["Tocchi", "touches"],
                      ["Lanci", "long_balls"],
                      ["Cross", "crosses"],
                      ["Dribbling riusciti", "dribbles_won"],
                      ["Duelli vinti", "duels_won"],
                      ["Duelli aerei vinti", "aerial_won"],
                      ["Contrasti", "tackles"],
                      ["Intercetti", "interceptions"],
                      ["Liberate", "clearances"],
                      ["Parate", "saves"],
                      ["Pali/traverse", "hit_woodwork"],
                      ["Tiri bloccati", "shots_blocked"],
                      ["Tiri in area", "shots_inside_box"],
                      ["Tiri da fuori area", "shots_outside_box"],
                      ["Tiri di testa", "headed_shots"],
                      ["Azioni da tiro create", "shot_creating"],
                      ["Rinvii dal fondo", "goal_kicks"],
                      ["Rimesse laterali", "throw_ins"],
                    ]
                      .filter(([, k]) => teamStats[k] > 0)
                      .map(([label, k]) => (
                        <Stat key={k} label={label} value={teamStats[k]} theme={theme} />
                      ))}
                  </div>
                </>
              )}
            </section>

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
