"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const POSITIONS = [
  { value: "GK", label: "Portiere" },
  { value: "DF", label: "Difensore" },
  { value: "MF", label: "Centrocampista" },
  { value: "FW", label: "Attaccante" },
];

export default function NewPlayerForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    position: "MF",
    shirt_number: "",
    nationality: "",
    photo_url: "",
  });

  const submit = async () => {
    if (!form.name) {
      setError("Il nome è obbligatorio");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        shirt_number: form.shirt_number === "" ? null : Number(form.shirt_number),
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
      <p className="text-sm font-medium">Nuovo giocatore</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Nome e cognome">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
          />
        </Field>
        <Field label="Ruolo">
          <select
            value={form.position}
            onChange={(e) => setForm({ ...form, position: e.target.value })}
            className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
          >
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Numero maglia">
          <input
            type="number"
            value={form.shirt_number}
            onChange={(e) => setForm({ ...form, shirt_number: e.target.value })}
            className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
          />
        </Field>
        <Field label="Nazionalità">
          <input
            value={form.nationality}
            onChange={(e) => setForm({ ...form, nationality: e.target.value })}
            className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
          />
        </Field>
        <Field label="URL foto (facoltativo)">
          <input
            value={form.photo_url}
            onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
            placeholder="https://..."
            className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
          />
        </Field>
      </div>
      {error && <p className="text-xs text-loss">{error}</p>}
      <div className="flex gap-2">
        <button onClick={submit} disabled={saving} className="rounded-md bg-ink px-4 py-2 text-sm text-chalk disabled:opacity-50">
          {saving ? "Salvo…" : "Salva giocatore"}
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
