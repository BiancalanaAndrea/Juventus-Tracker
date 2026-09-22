"use client";

import { useEffect, useState } from "react";
import MatchCard from "@/components/MatchCard";
import NewMatchForm from "@/components/NewMatchForm";

const TABS = [
  { key: "", label: "Tutte" },
  { key: "serie_a", label: "Serie A" },
  { key: "europa_league", label: "Europa League" },
  { key: "coppa_italia", label: "Coppa Italia" },
];

export default function PartitePage() {
  const [active, setActive] = useState("");
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    const qs = active ? `?competition=${active}` : "";
    const res = await fetch(`/api/matches${qs}`, { cache: "no-store" });
    const data = await res.json();
    setMatches(data.matches || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="scoreboard text-3xl">Partite</h1>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-chalk"
        >
          {showForm ? "Chiudi" : "+ Nuova partita"}
        </button>
      </div>

      {showForm && (
        <NewMatchForm
          onClose={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActive(tab.key)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium border ${
              active === tab.key ? "bg-ink text-chalk border-ink" : "border-line text-steel hover:bg-ink/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {loading && <p className="text-sm text-steel">Caricamento…</p>}
        {!loading && matches.length === 0 && (
          <p className="text-sm text-steel">Nessuna partita trovata. Aggiungine una con il pulsante qui sopra.</p>
        )}
        {matches.map((m) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}
