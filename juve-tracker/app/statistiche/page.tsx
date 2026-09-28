"use client";

import { useCallback, useEffect, useState } from "react";
import PlayersStatsTable from "@/components/PlayersStatsTable";

export default function StatistichePage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [seasonStats, setSeasonStats] = useState<any>({ played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0 });
  const [teamStats, setTeamStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    const [p, d, t] = await Promise.all([
      fetch("/api/players", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/dashboard", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/team-stats", { cache: "no-store" }).then((r) => r.json()),
    ]);
    setPlayers(p.players || []);
    setSeasonStats(d.seasonStats || seasonStats);
    setTeamStats(t);
    setRefreshing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
    const onFocus = () => load(true);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") load(true);
    });
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="scoreboard text-3xl page-header">Statistiche</h1>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium hover:bg-ink/5 disabled:opacity-50"
        >
          {refreshing ? "Aggiorno…" : "↻ Aggiorna"}
        </button>
      </div>

      <section className="mb-8 card p-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-steel mb-3">Squadra — riepilogo</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center mb-4">
          <Stat label="Giocate" value={seasonStats.played} />
          <Stat label="Vittorie" value={seasonStats.won} />
          <Stat label="Pareggi" value={seasonStats.drawn} />
          <Stat label="Sconfitte" value={seasonStats.lost} />
          <Stat label="Gol fatti" value={seasonStats.goals_for} />
          <Stat label="Gol subiti" value={seasonStats.goals_against} />
        </div>
        {teamStats && teamStats.matchesWithStats > 0 && (
          <>
            <p className="text-xs uppercase tracking-wide text-steel mb-3 mt-4 border-t border-line pt-4">
              Avanzate (da {teamStats.matchesWithStats} partite con statistiche importate)
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 text-center">
              <Stat label="Possesso medio" value={teamStats.possession_avg != null ? `${teamStats.possession_avg.toFixed(0)}%` : "-"} />
              <Stat label="Tiri totali" value={teamStats.shots_total} />
              <Stat label="Tiri in porta" value={teamStats.shots_on_target} />
              <Stat label="Angoli" value={teamStats.corners} />
              <Stat label="Fuorigioco" value={teamStats.offsides} />
              <Stat label="Falli" value={teamStats.fouls} />
              <Stat label="Gialli" value={teamStats.yellow_cards} />
              <Stat label="Rossi" value={teamStats.red_cards} />
              <Stat label="Passaggi totali" value={teamStats.passes_total} />
              <Stat
                label="Precisione passaggi"
                value={teamStats.passes_accuracy_avg != null ? `${teamStats.passes_accuracy_avg.toFixed(0)}%` : "-"}
              />
            </div>
          </>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-steel">Giocatori — stagione</h2>
          <p className="text-xs text-steel">Clicca una colonna per ordinare</p>
        </div>
        {players.length === 0 ? (
          <p className="text-sm text-steel">Nessun giocatore in rosa ancora.</p>
        ) : (
          <PlayersStatsTable players={players} />
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="scoreboard text-2xl">{value}</p>
      <p className="text-[11px] text-steel">{label}</p>
    </div>
  );
}
