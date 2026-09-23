"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { POSITION_ORDER, POSITION_LABELS, type Position } from "@/lib/types";

type SortKey =
  | "matches_played"
  | "minutes"
  | "goals"
  | "assists"
  | "shots_total"
  | "shots_on_target"
  | "passes_total"
  | "fouls_committed"
  | "fouls_suffered"
  | "yellow_cards"
  | "red_cards"
  | "saves"
  | "goals_conceded";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "matches_played", label: "PG" },
  { key: "minutes", label: "Min" },
  { key: "goals", label: "Gol" },
  { key: "assists", label: "Assist" },
  { key: "shots_total", label: "Tiri" },
  { key: "shots_on_target", label: "Tiri porta" },
  { key: "passes_total", label: "Passaggi" },
  { key: "fouls_committed", label: "Falli fatti" },
  { key: "fouls_suffered", label: "Falli subiti" },
  { key: "yellow_cards", label: "🟨" },
  { key: "red_cards", label: "🟥" },
  { key: "saves", label: "Parate" },
  { key: "goals_conceded", label: "Gol subiti" },
];

export default function PlayersStatsTable({ players }: { players: any[] }) {
  const [sort, setSort] = useState<{ key: SortKey | null; dir: "asc" | "desc" }>({ key: null, dir: "desc" });

  const sorted = useMemo(() => {
    const list = [...players];
    if (!sort.key) {
      list.sort(
        (a, b) =>
          POSITION_ORDER.indexOf(a.position as Position) - POSITION_ORDER.indexOf(b.position as Position) ||
          (a.shirt_number || 99) - (b.shirt_number || 99)
      );
    } else {
      list.sort((a, b) => {
        const va = a.season_stats[sort.key as SortKey] || 0;
        const vb = b.season_stats[sort.key as SortKey] || 0;
        return sort.dir === "desc" ? vb - va : va - vb;
      });
    }
    return list;
  }, [players, sort]);

  const toggleSort = (key: SortKey) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: "desc" };
      if (prev.dir === "desc") return { key, dir: "asc" };
      return { key: null, dir: "desc" }; // terzo click: torna all'ordine standard
    });
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-line bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line text-left text-xs uppercase text-steel">
            <th className="px-3 py-2 sticky left-0 bg-white">Giocatore</th>
            <th className="px-3 py-2">Ruolo</th>
            {COLUMNS.map((c) => (
              <th key={c.key} className="px-3 py-2">
                <button onClick={() => toggleSort(c.key)} className="flex items-center gap-1 hover:text-ink whitespace-nowrap">
                  {c.label}
                  {sort.key === c.key && <span>{sort.dir === "desc" ? "▼" : "▲"}</span>}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr key={p.id} className="border-b border-line last:border-0">
              <td className="px-3 py-2 sticky left-0 bg-white whitespace-nowrap">
                <Link href={`/rosa/${p.id}`} className="hover:underline">
                  #{p.shirt_number ?? "-"} {p.name}
                </Link>
              </td>
              <td className="px-3 py-2 text-steel">{POSITION_LABELS[p.position as Position]}</td>
              {COLUMNS.map((c) => (
                <td key={c.key} className="px-3 py-2">
                  {p.season_stats[c.key] ?? 0}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
