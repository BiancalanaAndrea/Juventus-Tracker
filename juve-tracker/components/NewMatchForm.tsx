"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { POSITION_ORDER, POSITION_LABELS } from "@/lib/types";

const COMPETITIONS = [
  { value: "serie_a", label: "Serie A" },
  { value: "coppa_italia", label: "Coppa Italia" },
  { value: "europa_league", label: "Europa League" },
];

const MAX_STARTERS = 11;
const MAX_SUBS = 7;

export default function NewMatchForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roster, setRoster] = useState<any[]>([]);
  const [starters, setStarters] = useState<Set<number>>(new Set());
  const [substitutes, setSubstitutes] = useState<Set<number>>(new Set());
  const [form, setForm] = useState({
    competition_short_name: "serie_a",
    matchday: "",
    match_date: "",
    venue: "",
    opponent_name: "",
    is_home: "true",
    status: "SCHEDULED",
    juve_score: "0",
    opponent_score: "0",
  });

  useEffect(() => {
    if (form.status === "FINISHED" && roster.length === 0) {
      fetch("/api/players", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setRoster(d.players || []));
    }
  }, [form.status]);

  const toggle = (set: Set<number>, setter: (s: Set<number>) => void, id: number, max: number) => {
    const next = new Set(set);
    if (next.has(id)) {
      next.delete(id);
    } else {
      if (next.size >= max) return; // limite raggiunto
      next.add(id);
    }
    setter(next);
  };

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
    if (!res.ok) {
      setSaving(false);
      const data = await res.json();
      setError(data.error || "Errore nel salvataggio");
      return;
    }
    const { match } = await res.json();

    if (form.status === "FINISHED" && (starters.size > 0 || substitutes.size > 0)) {
      await fetch(`/api/matches/${match.id}/lineup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starters: [...starters], substitutes: [...substitutes] }),
      });
    }

    setSaving(false);
    onClose();
    router.refresh();
  };

  return (
    <div className="card p-4 mb-6 space-y-3">
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
                min={0}
                value={form.juve_score}
                onChange={(e) => setForm({ ...form, juve_score: String(Math.max(0, Number(e.target.value) || 0)) })}
                className="w-20 rounded-md border border-line px-3 py-1.5 text-sm"
              />
            </Field>
            <Field label="Gol avversario">
              <input
                type="number"
                min={0}
                value={form.opponent_score}
                onChange={(e) => setForm({ ...form, opponent_score: String(Math.max(0, Number(e.target.value) || 0)) })}
                className="w-20 rounded-md border border-line px-3 py-1.5 text-sm"
              />
            </Field>
          </div>
        )}
      </div>

      {form.status === "FINISHED" && (
        <div className="border-t border-line pt-3 space-y-4">
          {roster.length === 0 ? (
            <p className="text-xs text-steel">Caricamento rosa…</p>
          ) : (
            <>
              <div>
                <p className="text-xs font-medium mb-2">
                  Titolari ({starters.size}/{MAX_STARTERS})
                </p>
                <RosterPicker
                  roster={roster}
                  selected={starters}
                  disabledIds={substitutes}
                  onToggle={(id) => toggle(starters, setStarters, id, MAX_STARTERS)}
                />
              </div>
              <div>
                <p className="text-xs font-medium mb-2">
                  Panchina ({substitutes.size}/{MAX_SUBS})
                </p>
                <RosterPicker
                  roster={roster}
                  selected={substitutes}
                  disabledIds={starters}
                  onToggle={(id) => toggle(substitutes, setSubstitutes, id, MAX_SUBS)}
                />
              </div>
            </>
          )}
        </div>
      )}

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

function RosterPicker({
  roster,
  selected,
  disabledIds,
  onToggle,
}: {
  roster: any[];
  selected: Set<number>;
  disabledIds: Set<number>;
  onToggle: (id: number) => void;
}) {
  return (
    <div className="space-y-2">
      {POSITION_ORDER.map((pos) => {
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
                        ? "bg-ink text-chalk border-ink"
                        : isDisabled
                        ? "opacity-30 border-line cursor-not-allowed"
                        : "border-line hover:bg-ink/5"
                    }`}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-steel">{label}</span>
      {children}
    </label>
  );
}
