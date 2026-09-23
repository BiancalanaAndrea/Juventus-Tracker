"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StandingsForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    team_name: "Juventus",
    is_juve: true,
    position: "",
    played: "",
    won: "",
    drawn: "",
    lost: "",
    goals_for: "",
    goals_against: "",
    points: "",
  });

  const submit = async () => {
    if (!form.team_name) {
      setError("Il nome della squadra è obbligatorio");
      return;
    }
    setSaving(true);
    setError(null);
    const numFields = ["position", "played", "won", "drawn", "lost", "goals_for", "goals_against", "points"];
    const body: Record<string, unknown> = { team_name: form.team_name, is_juve: form.is_juve };
    for (const f of numFields) (body as any)[f] = (form as any)[f] === "" ? null : Number((form as any)[f]);

    const res = await fetch("/api/standings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (res.ok) {
      onClose();
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error || "Errore nel salvataggio");
    }
  };

  return (
    <div className="rounded-lg border border-line bg-white p-4 mb-6 space-y-3">
      <p className="text-sm font-medium">Aggiorna riga classifica</p>
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Squadra">
          <input
            value={form.team_name}
            onChange={(e) => setForm({ ...form, team_name: e.target.value })}
            className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
          />
        </Field>
        <Field label="Posizione">
          <input
            type="number"
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
          />
        </Field>
        <Field label="Punti">
          <input
            type="number"
            value={form.points}
            onChange={(e) => setForm({ ...form, points: e.target.value })}
            className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
          />
        </Field>
        <Field label="Giocate">
          <input
            type="number"
            value={form.played}
            onChange={(e) => setForm({ ...form, played: e.target.value })}
            className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
          />
        </Field>
        <Field label="Vittorie">
          <input
            type="number"
            value={form.won}
            onChange={(e) => setForm({ ...form, won: e.target.value })}
            className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
          />
        </Field>
        <Field label="Pareggi">
          <input
            type="number"
            value={form.drawn}
            onChange={(e) => setForm({ ...form, drawn: e.target.value })}
            className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
          />
        </Field>
        <Field label="Sconfitte">
          <input
            type="number"
            value={form.lost}
            onChange={(e) => setForm({ ...form, lost: e.target.value })}
            className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
          />
        </Field>
        <Field label="Gol fatti">
          <input
            type="number"
            value={form.goals_for}
            onChange={(e) => setForm({ ...form, goals_for: e.target.value })}
            className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
          />
        </Field>
        <Field label="Gol subiti">
          <input
            type="number"
            value={form.goals_against}
            onChange={(e) => setForm({ ...form, goals_against: e.target.value })}
            className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-xs text-steel">
        <input type="checkbox" checked={form.is_juve} onChange={(e) => setForm({ ...form, is_juve: e.target.checked })} />
        Questa riga è la Juventus (evidenziata in Dashboard)
      </label>
      {error && <p className="text-xs text-loss">{error}</p>}
      <div className="flex gap-2">
        <button onClick={submit} disabled={saving} className="rounded-md bg-ink px-4 py-2 text-sm text-chalk disabled:opacity-50">
          {saving ? "Salvo…" : "Salva"}
        </button>
        <button onClick={onClose} className="rounded-md border border-line px-4 py-2 text-sm">
          Annulla
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-steel">{label}</span>
      {children}
    </label>
  );
}
