"use client";

import { useState } from "react";

export default function ImpostazioniPage() {
  const [syncing, setSyncing] = useState(false);
  const [log, setLog] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const syncNow = async () => {
    setSyncing(true);
    setError(null);
    setLog(null);
    try {
      const res = await fetch("/api/sync-now", { method: "POST" });
      const data = await res.json();
      if (data.ok) setLog(data.log);
      else setError(data.error || "Errore sconosciuto");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-8">
      <h1 className="scoreboard text-3xl mb-6">Impostazioni</h1>

      <section className="rounded-lg border border-line bg-white p-4 mb-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-steel mb-2">Sincronizzazione dati</h2>
        <p className="text-sm text-steel mb-3">
          Le partite, la rosa, le statistiche e la classifica si aggiornano automaticamente ogni giorno.
          Puoi anche forzare un aggiornamento immediato.
        </p>
        <button
          onClick={syncNow}
          disabled={syncing}
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-chalk disabled:opacity-50"
        >
          {syncing ? "Sincronizzazione in corso…" : "Sincronizza ora"}
        </button>
        {log && (
          <ul className="mt-3 space-y-1 text-xs text-steel">
            {log.map((line, i) => (
              <li key={i}>• {line}</li>
            ))}
          </ul>
        )}
        {error && <p className="mt-3 text-xs text-loss">Errore: {error}</p>}
      </section>

      <section className="rounded-lg border border-line bg-white p-4 mb-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-steel mb-2">Informazioni</h2>
        <p className="text-sm text-steel">
          Juve Tracker — dati forniti da API-Football. Le partite modificate manualmente non vengono
          sovrascritte automaticamente dalla sincronizzazione.
        </p>
      </section>

      <section className="rounded-lg border border-line bg-white p-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-steel mb-2">Installa l'app</h2>
        <p className="text-sm text-steel">
          Da PC: apri il sito in Chrome/Edge e clicca l'icona "Installa app" nella barra degli indirizzi.
          <br />
          Da telefono: apri il sito, poi "Aggiungi a schermata Home" (Safari) o "Installa app" (Chrome Android).
        </p>
      </section>
    </div>
  );
}
