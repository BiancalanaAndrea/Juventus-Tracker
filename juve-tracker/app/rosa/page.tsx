"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { POSITION_ORDER, POSITION_LABELS } from "@/lib/types";
import NewPlayerForm from "@/components/NewPlayerForm";

export default function RosaPage() {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/players", { cache: "no-store" });
    const data = await res.json();
    setPlayers(data.players || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="scoreboard text-3xl">Rosa</h1>
        <button onClick={() => setShowForm((s) => !s)} className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-chalk">
          {showForm ? "Chiudi" : "+ Nuovo giocatore"}
        </button>
      </div>

      {showForm && (
        <NewPlayerForm
          onClose={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {!loading && players.length === 0 && (
        <p className="text-sm text-steel">Rosa vuota. Aggiungi il primo giocatore con il pulsante qui sopra.</p>
      )}

      <div className="space-y-8">
        {POSITION_ORDER.map((pos) => {
          const group = players.filter((p: any) => p.position === pos);
          if (group.length === 0) return null;
          return (
            <section key={pos}>
              <h2 className="text-sm font-medium uppercase tracking-wide text-steel mb-3">{POSITION_LABELS[pos]}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {group.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/rosa/${p.id}`}
                    className="rounded-lg border border-line bg-white p-3 hover:shadow-sm transition-shadow"
                  >
                    <div className="relative h-20 w-20 mx-auto mb-2 overflow-hidden rounded-full bg-ink/5">
                      {p.photo_url && p.photo_url.trim() !== "" && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.photo_url} alt={p.name} className="h-full w-full object-cover" />
                      )}
                    </div>
                    <p className="text-center text-sm font-medium truncate">{p.name}</p>
                    <p className="text-center text-xs text-steel mb-2">#{p.shirt_number ?? "-"}</p>
                    <div className="flex flex-wrap justify-center gap-x-2 gap-y-0.5 text-[11px] text-steel">
                      {pos === "GK" ? (
                        <>
                          <span>{p.season_stats.matches_played} PG</span>
                          <span>{p.season_stats.minutes} MIN</span>
                          <span>{p.season_stats.goals_conceded} GS</span>
                          <span>{p.season_stats.goals} GF</span>
                          <span>{p.season_stats.assists} A</span>
                        </>
                      ) : (
                        <>
                          <span>{p.season_stats.matches_played} PG</span>
                          <span>{p.season_stats.minutes} MIN</span>
                          <span>{p.season_stats.goals} GF</span>
                          <span>{p.season_stats.assists} A</span>
                          <span>{p.season_stats.goals_conceded} GS</span>
                        </>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
