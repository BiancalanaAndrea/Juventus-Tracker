"use client";

import { useEffect, useState } from "react";
import StandingsForm from "@/components/StandingsForm";
import PlayersStatsTable from "@/components/PlayersStatsTable";

export default function StatistichePage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [seasonStats, setSeasonStats] = useState<any>({ played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0 });
  const [teamStats, setTeamStats] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const [p, s, d, t] = await Promise.all([
      fetch("/api/players", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/standings", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/dashboard", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/team-stats", { cache: "no-store" }).then((r) => r.json()),
    ]);
    setPlayers(p.players || []);
    setStandings(s.standings || []);
    setSeasonStats(d.seasonStats);
    setTeamStats(t);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <h1 className="scoreboard text-3xl mb-6">Statistiche</h1>

      <section className="mb-8 rounded-lg border border-line bg-white p-4">
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

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-steel">Classifica</h2>
          <button onClick={() => setShowForm((s) => !s)} className="text-xs underline">
            {showForm ? "Chiudi" : "+ Aggiorna riga"}
          </button>
        </div>
        {showForm && (
          <StandingsForm
            onClose={() => {
              setShowForm(false);
              load();
            }}
          />
        )}
        <div className="overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase text-steel">
                <th className="px-3 py-2">#</th>
                <th className="px-3 py-2">Squadra</th>
                <th className="px-3 py-2">PG</th>
                <th className="px-3 py-2">V</th>
                <th className="px-3 py-2">N</th>
                <th className="px-3 py-2">P</th>
                <th className="px-3 py-2">GF</th>
                <th className="px-3 py-2">GS</th>
                <th className="px-3 py-2">Pt</th>
              </tr>
            </thead>
            <tbody>
              {standings.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-4 text-center text-steel">
                    Nessuna riga inserita ancora.
                  </td>
                </tr>
              )}
              {standings.map((s: any) => (
                <tr key={s.id} className={`border-b border-line last:border-0 ${s.is_juve ? "bg-ink/5 font-medium" : ""}`}>
                  <td className="px-3 py-2">{s.position ?? "-"}</td>
                  <td className="px-3 py-2">{s.team_name}</td>
                  <td className="px-3 py-2">{s.played}</td>
                  <td className="px-3 py-2">{s.won}</td>
                  <td className="px-3 py-2">{s.drawn}</td>
                  <td className="px-3 py-2">{s.lost}</td>
                  <td className="px-3 py-2">{s.goals_for}</td>
                  <td className="px-3 py-2">{s.goals_against}</td>
                  <td className="px-3 py-2">{s.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
