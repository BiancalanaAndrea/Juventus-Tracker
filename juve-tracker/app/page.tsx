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
    // Ricarica i dati ogni volta che l'utente torna su questa scheda/finestra,
    // così una partita appena creata altrove compare senza dover fare nulla.
    const onFocus = () => load(true);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") load(true);
    });
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <h1 className="scoreboard text-3xl mb-6 page-header">Dashboard</h1>
        <p className="text-sm text-steel">Caricamento…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
        <h1 className="scoreboard text-3xl mb-6 page-header">Dashboard</h1>
        <div className="rounded-lg border border-loss/40 bg-loss/5 p-4 text-sm text-loss">
          Errore nel caricamento dei dati: {error}
        </div>
        <button onClick={() => load()} className="mt-3 rounded-md bg-ink px-4 py-2 text-sm text-chalk">
          Riprova
        </button>
      </div>
    );
  }

  const { lastMatch, nextMatch, lastFive, seasonStats } = data;
  const form = (lastFive || []).map((m: any) => matchOutcome(m));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="scoreboard text-3xl page-header">Dashboard</h1>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="rounded-md border border-line bg-white px-3 py-1.5 text-xs font-medium hover:bg-ink/5 disabled:opacity-50"
        >
          {refreshing ? "Aggiorno…" : "↻ Aggiorna"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <section className="card p-4">
          <p className="text-xs uppercase tracking-wide text-steel mb-2">Ultima partita</p>
          {lastMatch ? <MatchCard match={lastMatch} /> : <EmptyState label="Nessuna partita giocata ancora" />}
        </section>
        <section className="card p-4">
          <p className="text-xs uppercase tracking-wide text-steel mb-2">Prossima partita</p>
          {nextMatch ? <MatchCard match={nextMatch} /> : <EmptyState label="Nessuna partita in programma" />}
        </section>
      </div>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-steel">Ultime 5 partite</h2>
          <div className="flex gap-1.5">
            {form.map((o: string, i: number) => (
              <span
                key={i}
                className={`h-6 w-6 rounded-full text-[10px] font-bold flex items-center justify-center text-white ${
                  o === "win" ? "bg-win" : o === "draw" ? "bg-draw" : "bg-loss"
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
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lastFive.map((m: any) => (
              <MatchCard key={m.id} match={m} />
            ))}
          </div>
        )}
      </section>

      <section className="card p-4">
        <p className="text-xs uppercase tracking-wide text-steel mb-3">Statistiche stagione (Serie A + coppe)</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center">
          <Stat label="Giocate" value={seasonStats.played} />
          <Stat label="Vittorie" value={seasonStats.won} />
          <Stat label="Pareggi" value={seasonStats.drawn} />
          <Stat label="Sconfitte" value={seasonStats.lost} />
          <Stat label="Gol fatti" value={seasonStats.goals_for} />
          <Stat label="Gol subiti" value={seasonStats.goals_against} />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="scoreboard text-2xl text-gold">{value}</p>
      <p className="text-[11px] text-steel">{label}</p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="text-sm text-steel py-4">{label}</p>;
}
