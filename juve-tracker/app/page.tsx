"use client";

import { useCallback, useEffect, useState } from "react";
import MatchCard from "@/components/MatchCard";
import { matchOutcome } from "@/lib/types";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) setError(json.error || "Errore sconosciuto");
      else setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const onFocus = () => load(true);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") load(true);
    });
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <h1 className="scoreboard text-3xl mb-6 page-header">Dashboard</h1>
        <p className="text-sm text-steel">Caricamento…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <h1 className="scoreboard text-3xl mb-6 page-header">Dashboard</h1>
        <div className="rounded-lg border border-loss/40 bg-loss/5 p-4 text-sm text-loss">
          Errore nel caricamento dei dati: {error ?? "nessun dato ricevuto"}
        </div>
        <button onClick={() => load()} className="mt-3 rounded-md bg-ink px-4 py-2 text-sm text-chalk">
          Riprova
        </button>
      </div>
    );
  }

  const { lastMatch, nextMatch, lastFive, seasonStats, allMatches } = data;
  const form = (lastFive || []).map((m: any) => matchOutcome(m));

  const finished = (allMatches || []).filter((m: any) => m.status === "FINISHED");
  const cleanSheets = finished.filter((m: any) => (m.opponent_score ?? 1) === 0).length;
  const goalDiff = seasonStats.goals_for - seasonStats.goals_against;
  const winPct = seasonStats.played > 0 ? Math.round((seasonStats.won / seasonStats.played) * 100) : 0;
  const avgGoalsFor = seasonStats.played > 0 ? (seasonStats.goals_for / seasonStats.played).toFixed(1) : "0.0";
  const avgGoalsAgainst = seasonStats.played > 0 ? (seasonStats.goals_against / seasonStats.played).toFixed(1) : "0.0";
  const points = seasonStats.won * 3 + seasonStats.drawn;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="scoreboard text-4xl page-header">Dashboard</h1>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="rounded-md border border-line bg-surface px-4 py-2 text-sm font-medium hover:bg-ink/5 disabled:opacity-50"
        >
          {refreshing ? "Aggiorno…" : "↻ Aggiorna"}
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 mb-10">
        <section className="card p-5">
          <p className="text-sm uppercase tracking-wide text-steel mb-3 font-medium">Ultima partita</p>
          {lastMatch ? <MatchCard match={lastMatch} large /> : <EmptyState label="Nessuna partita giocata ancora" />}
        </section>
        <section className="card p-5">
          <p className="text-sm uppercase tracking-wide text-steel mb-3 font-medium">Prossima partita</p>
          {nextMatch ? <MatchCard match={nextMatch} large /> : <EmptyState label="Nessuna partita in programma" />}
        </section>
      </div>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold uppercase tracking-wide text-steel">Ultime 5 partite</h2>
          <div className="flex gap-2">
            {form.map((o: string, i: number) => (
              <span
                key={i}
                className={`h-8 w-8 rounded-full text-xs font-bold flex items-center justify-center text-white shadow-lg ${
                  o === "win"
                    ? "bg-win shadow-win/40"
                    : o === "draw"
                    ? "bg-draw shadow-draw/40"
                    : "bg-loss shadow-loss/40"
                }`}
              >
                {o === "win" ? "V" : o === "draw" ? "N" : "P"}
              </span>
            ))}
          </div>
        </div>
        {lastFive.length === 0 ? (
          <EmptyState label="Nessuna partita giocata ancora" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lastFive.map((m: any) => (
              <MatchCard key={m.id} match={m} large />
            ))}
          </div>
        )}
      </section>

      <section className="card p-6">
        <p className="text-base uppercase tracking-wide text-steel mb-4 font-medium">
          Statistiche stagione (Serie A + coppe)
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-center mb-6">
          <Stat label="Giocate" value={seasonStats.played} />
          <Stat label="Vittorie" value={seasonStats.won} />
          <Stat label="Pareggi" value={seasonStats.drawn} />
          <Stat label="Sconfitte" value={seasonStats.lost} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-center border-t border-line pt-6">
          <Stat label="Gol fatti" value={seasonStats.goals_for} />
          <Stat label="Gol subiti" value={seasonStats.goals_against} />
          <Stat label="Differenza reti" value={goalDiff > 0 ? `+${goalDiff}` : goalDiff} />
          <Stat label="% Vittorie" value={`${winPct}%`} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-center border-t border-line pt-6 mt-6">
          <Stat label="Media gol fatti" value={avgGoalsFor} />
          <Stat label="Media gol subiti" value={avgGoalsAgainst} />
          <Stat label="Clean sheet" value={cleanSheets} />
          <Stat label="Punti" value={points} />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="scoreboard text-3xl text-gold">{value}</p>
      <p className="text-xs text-steel mt-1">{label}</p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="text-sm text-steel py-4">{label}</p>;
}
