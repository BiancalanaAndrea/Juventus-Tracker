"use client";

import { useState } from "react";

export default function RatingPicker({
  matchId,
  playerId,
  initialRating,
  onSaved,
}: {
  matchId: number;
  playerId: number;
  initialRating: number | null;
  onSaved?: (rating: number) => void;
}) {
  const [rating, setRating] = useState<number>(initialRating ?? 6);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const adjust = (delta: number) => {
    setSaved(false);
    setRating((r) => Math.min(10, Math.max(0, Math.round((r + delta) * 4) / 4)));
  };

  const save = async () => {
    setSaving(true);
    const res = await fetch(`/api/matches/${matchId}/ratings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_id: playerId, rating }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      onSaved?.(rating);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => adjust(-0.25)}
        className="h-7 w-7 rounded-full border border-line text-sm hover:bg-ink/5"
        aria-label="Diminuisci voto"
      >
        −
      </button>
      <span className="scoreboard w-12 text-center text-lg">{rating.toFixed(2)}</span>
      <button
        onClick={() => adjust(0.25)}
        className="h-7 w-7 rounded-full border border-line text-sm hover:bg-ink/5"
        aria-label="Aumenta voto"
      >
        +
      </button>
      <button
        onClick={save}
        disabled={saving}
        className="ml-2 rounded-md bg-ink px-3 py-1.5 text-xs font-medium text-chalk disabled:opacity-50"
      >
        {saving ? "Salvo…" : saved ? "Salvato ✓" : "Salva voto"}
      </button>
    </div>
  );
}
