"use client";

import { POSITION_ORDER, POSITION_LABELS } from "@/lib/types";

export default function RosterPicker({
  roster,
  selected,
  disabledIds,
  onToggle,
  activeColor,
  activeTextColor,
}: {
  roster: any[];
  selected: Set<number>;
  disabledIds: Set<number>;
  onToggle: (id: number) => void;
  activeColor?: string;
  activeTextColor?: string;
}) {
  return (
    <div className="space-y-2">
      {POSITION_ORDER.filter((pos) => pos !== "CO").map((pos) => {
        const group = roster.filter((p) => p.position === pos);
        if (group.length === 0) return null;
        return (
          <div key={pos}>
            <p className="text-[10px] uppercase text-steel mb-1">{POSITION_LABELS[pos]}</p>
            <div className="flex flex-wrap gap-1.5">
              {group.map((p) => {
                const isSelected = selected.has(p.id);
                const isDisabled = disabledIds.has(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => onToggle(p.id)}
                    className={`rounded-full border px-2.5 py-1 text-xs ${
                      isSelected
                        ? "border-transparent"
                        : isDisabled
                        ? "opacity-30 border-line cursor-not-allowed"
                        : "border-line hover:bg-ink/5"
                    }`}
                    style={isSelected ? { background: activeColor ?? "#0A0A0A", color: activeTextColor ?? "#F7F7F5" } : undefined}
                  >
                    #{p.shirt_number ?? "-"} {p.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
