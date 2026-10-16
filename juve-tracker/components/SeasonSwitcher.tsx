"use client";

import { useSeason } from "./SeasonProvider";
import { seasonLabel } from "@/lib/season";

const NEW = "__new__";

export default function SeasonSwitcher({ className = "" }: { className?: string }) {
  const { season, seasons, setSeason, addNextSeason } = useSeason();
  const next = Math.max(...seasons) + 1;

  return (
    <label className={`flex items-center gap-2 text-xs ${className}`}>
      <span className="hidden uppercase tracking-wide opacity-60 md:inline">Stagione</span>
      <select
        value={season}
        onChange={(e) => {
          if (e.target.value === NEW) {
            if (window.confirm(`Vuoi iniziare la stagione ${seasonLabel(next)}? Le partite di ${seasonLabel(season)} restano salvate e le ritrovi da qui.`)) {
              addNextSeason();
            }
          } else setSeason(Number(e.target.value));
        }}
        className="w-auto max-w-[9rem] rounded-md border border-line bg-surface px-2 py-1 text-sm font-medium"
        aria-label="Cambia stagione"
      >
        {seasons.map((s) => (
          <option key={s} value={s}>
            {seasonLabel(s)}
          </option>
        ))}
        <option value={NEW}>+ Nuova</option>
      </select>
    </label>
  );
}
