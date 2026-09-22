"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const COMPETITIONS = [
  { value: "serie_a", label: "Serie A" },
  { value: "coppa_italia", label: "Coppa Italia" },
  { value: "europa_league", label: "Europa League" },
];

export default function NewMatchForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    competition_short_name: "serie_a",
    matchday: "",
    match_date: "",
    venue: "",
    opponent_name: "",
    is_home: "true",
    status: "SCHEDULED",
    juve_score: "",
    opponent_score: "",
  });

  const submit = async () => {
    if (!form.opponent_name || !form.match_date) {
      setError("Avversario e data sono obbligatori");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        is_home: form.is_home === "true",
        juve_score: form.juve_score === "" ? null : Number(form.juve_score),
        opponent_score: form.opponent_score === "" ? null : Number(form.opponent_score),
      }),
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
      <p className="text-sm font-medium">Nuova partita</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Competizione">
          <select
            value={form.competition_short_name}
            onChange={(e) => setForm({ ...form, competition_short_name: e.target.value })}
            className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
          >
            {COMPETITIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Giornata / turno">
          <input
            value={form.matchday}
            onChange={(e) => setForm({ ...form, matchday: e.target.value })}
            placeholder="es. Giornata 5, Ottavi"
            className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
          />
        </Field>
        <Field label="Avversario">
          <input
            value={form.opponent_name}
            onChange={(e) => setForm({ ...form, opponent_name: e.target.value })}
            className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
          />
        </Field>
        <Field label="Casa / trasferta">
          <select
            value={form.is_home}
            onChange={(e) => setForm({ ...form, is_home: e.target.value })}
            className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
          >
            <option value="true">Casa</option>
            <option value="false">Trasferta</option>
          </select>
        </Field>
        <Field label="Data e ora">
          <input
            type="datetime-local"
            value={form.match_date}
            onChange={(e) => setForm({ ...form, match_date: e.target.value })}
            className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
          />
        </Field>
        <Field label="Stadio">
          <input
            value={form.venue}
            onChange={(e) => setForm({ ...form, venue: e.target.value })}
            className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
          />
        </Field>
        <Field label="Stato">
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
          >
            <option value="SCHEDULED">Da giocare</option>
            <option value="FINISHED">Giocata</option>
            <option value="POSTPONED">Rinviata</option>
          </select>
        </Field>
        {form.status === "FINISHED" && (
          <div className="flex gap-3">
            <Field label="Gol Juve">
              <input
                type="number"
                value={form.juve_score}
                onChange={(e) => setForm({ ...form, juve_score: e.target.value })}
                className="w-20 rounded-md border border-line px-3 py-1.5 text-sm"
              />
            </Field>
            <Field label="Gol avversario">
              <input
                type="number"
                value={form.opponent_score}
                onChange={(e) => setForm({ ...form, opponent_score: e.target.value })}
                className="w-20 rounded-md border border-line px-3 py-1.5 text-sm"
              />
            </Field>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-loss">{error}</p>}
      <div className="flex gap-2">
        <button onClick={submit} disabled={saving} className="rounded-md bg-ink px-4 py-2 text-sm text-chalk disabled:opacity-50">
          {saving ? "Salvo…" : "Salva partita"}
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
