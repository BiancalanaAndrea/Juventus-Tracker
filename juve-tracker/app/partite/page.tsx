"use client";

import { useEffect, useState } from "react";
import MatchCard from "@/components/MatchCard";
import NewMatchForm from "@/components/NewMatchForm";
import { getTheme } from "@/lib/competitionThemes";

const TABS = [
  { key: "", themeKey: "all", label: "Tutte" },
  { key: "serie_a", themeKey: "serie_a", label: "Serie A" },
  { key: "europa_league", themeKey: "europa_league", label: "Europa League" },
  { key: "coppa_italia", themeKey: "coppa_italia", label: "Coppa Italia" },
];

export default function PartitePage() {
  const [active, setActive] = useState("");
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const activeTab = TABS.find((t) => t.key === active) || TABS[0];
  const theme = getTheme(activeTab.themeKey === "all" ? null : activeTab.themeKey);

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
    <div className="min-h-screen transition-colors duration-300" style={{ background: theme.bg }}>
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="scoreboard text-3xl" style={{ color: theme.text }}>
            Partite
          </h1>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="rounded-md px-4 py-2 text-sm font-medium"
            style={{ background: theme.accent, color: theme.accentText }}
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

        <div className="space-y-3">
          {loading && <p className="text-sm" style={{ color: theme.text, opacity: 0.6 }}>Caricamento…</p>}
          {!loading && matches.length === 0 && (
            <p className="text-sm" style={{ color: theme.text, opacity: 0.6 }}>
              Nessuna partita trovata. Aggiungine una con il pulsante qui sopra.
            </p>
          )}
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      </div>
    </div>
  );
}
