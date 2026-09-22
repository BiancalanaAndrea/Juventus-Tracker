"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { POSITION_ORDER, POSITION_LABELS } from "@/lib/types";
import StandingsForm from "@/components/StandingsForm";

export default function StatistichePage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [seasonStats, setSeasonStats] = useState<any>({ played: 0, won: 0, drawn: 0, lost: 0, goals_for: 0, goals_against: 0 });
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const [p, s, d] = await Promise.all([
      fetch("/api/players", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/standings", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/dashboard", { cache: "no-store" }).then((r) => r.json()),
    ]);
    setPlayers(p.players || []);
    setStandings(s.standings || []);
    setSeasonStats(d.seasonStats);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <h1 className="scoreboard text-3xl mb-6">Statistiche</h1>

      <section className="mb-8 rounded-lg border border-line bg-white p-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-steel mb-3">Squadra — stagione</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
          <Stat label="Giocate" value={seasonStats.played} />
          <Stat label="Vittorie" value={seasonStats.won} />
          <Stat label="Pareggi" value={seasonStats.drawn} />
          <Stat label="Sconfitte" value={seasonStats.lost} />
          <Stat label="Gol fatti" value={seasonStats.goals_for} />
          <Stat label="Gol subiti" value={seasonStats.goals_against} />
        </div>
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
        <h2 className="text-sm font-medium uppercase tracking-wide text-steel mb-3">Giocatori — stagione</h2>
        <div className="space-y-6">
          {POSITION_ORDER.map((pos) => {
            const group = players.filter((p: any) => p.position === pos);
            if (group.length === 0) return null;
            return (
              <div key={pos}>
                <p className="text-xs font-semibold text-steel mb-2">{POSITION_LABELS[pos]}</p>
                <div className="overflow-x-auto rounded-lg border border-line bg-white">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-line text-left text-xs uppercase text-steel">
                        <th className="px-3 py-2">Giocatore</th>
                        <th className="px-3 py-2">PG</th>
                        <th className="px-3 py-2">Min</th>
                        {pos === "GK" ? (
                          <>
                            <th className="px-3 py-2">Parate</th>
                            <th className="px-3 py-2">Gol subiti</th>
                          </>
                        ) : (
                          <>
                            <th className="px-3 py-2">Gol</th>
                            <th className="px-3 py-2">Assist</th>
                          </>
                        )}
                        <th className="px-3 py-2">🟨</th>
                        <th className="px-3 py-2">🟥</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.map((p: any) => (
                        <tr key={p.id} className="border-b border-line last:border-0">
                          <td className="px-3 py-2">
                            <Link href={`/rosa/${p.id}`} className="hover:underline">
                              #{p.shirt_number} {p.name}
                            </Link>
                          </td>
                          <td className="px-3 py-2">{p.season_stats.matches_played}</td>
                          <td className="px-3 py-2">{p.season_stats.minutes}</td>
                          {pos === "GK" ? (
                            <>
                              <td className="px-3 py-2">{p.season_stats.saves}</td>
                              <td className="px-3 py-2">{p.season_stats.goals_conceded}</td>
                            </>
                          ) : (
                            <>
                              <td className="px-3 py-2">{p.season_stats.goals}</td>
                              <td className="px-3 py-2">{p.season_stats.assists}</td>
                            </>
                          )}
                          <td className="px-3 py-2">{p.season_stats.yellow_cards}</td>
                          <td className="px-3 py-2">{p.season_stats.red_cards}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="scoreboard text-2xl">{value}</p>
      <p className="text-[11px] text-steel">{label}</p>
    </div>
  );
}
