"use client";

import { useState } from "react";
import { matchOutcome, OUTCOME_STYLES, POSITION_ORDER, POSITION_LABELS } from "@/lib/types";
import RatingPicker from "./RatingPicker";

const FORMAT_EXAMPLE = `SQUADRA: possesso=58 tiri=14 tiri_porta=6 angoli=5 falli=10 gialli=2 rossi=0 fuorigioco=3 passaggi=480 precisione=87
AVVERSARIO: possesso=42 tiri=8 tiri_porta=3 angoli=2 falli=14 gialli=3 rossi=1 fuorigioco=1 passaggi=320 precisione=79
GIOCATORI:
numero=7 minuti=90 gol=1 assist=0 tiri=3 tiri_porta=2 passaggi=20 falli_fatti=1 falli_subiti=3 gialli=0 rossi=0 titolare=si
numero=1 minuti=90 parate=4 gol_subiti=1 titolare=si`;

export default function MatchDetailClient({ initial }: { initial: any }) {
  const [match, setMatch] = useState(initial.match);
  const [teamStats, setTeamStats] = useState(initial.teamStats || []);
  const [playerStats, setPlayerStats] = useState(initial.playerStats || []);
  const [editing, setEditing] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showFormat, setShowFormat] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importLog, setImportLog] = useState<string[] | null>(null);

  const [form, setForm] = useState({
    match_date: match.match_date?.slice(0, 16) ?? "",
    venue: match.venue ?? "",
    notes: match.notes ?? "",
    opponent_name: match.opponent_name ?? "",
    juve_score: match.juve_score ?? "",
    opponent_score: match.opponent_score ?? "",
    status: match.status,
  });
  const [ratings, setRatings] = useState<Record<number, number>>(
    Object.fromEntries((initial.ratings || []).map((r: any) => [r.player_id, Number(r.rating)]))
  );

  const outcome = matchOutcome(match);
  const juveStats = teamStats.find((t: any) => t.side === "juve");
  const oppStats = teamStats.find((t: any) => t.side === "opponent");
  const playersByPosition = POSITION_ORDER.map((pos) => ({
    pos,
    players: playerStats.filter((ps: any) => ps.player.position === pos),
  })).filter((g) => g.players.length > 0);

  const saveEdit = async () => {
    const res = await fetch(`/api/matches/${match.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        match_date: new Date(form.match_date).toISOString(),
        venue: form.venue,
        notes: form.notes,
        opponent_name: form.opponent_name,
        status: form.status,
        juve_score: form.juve_score === "" ? null : Number(form.juve_score),
        opponent_score: form.opponent_score === "" ? null : Number(form.opponent_score),
      }),
    });
    if (res.ok) {
      setMatch({
        ...match,
        match_date: new Date(form.match_date).toISOString(),
        venue: form.venue,
        notes: form.notes,
        opponent_name: form.opponent_name,
        status: form.status,
        juve_score: form.juve_score === "" ? null : Number(form.juve_score),
        opponent_score: form.opponent_score === "" ? null : Number(form.opponent_score),
      });
      setEditing(false);
    }
  };

  const importStats = async () => {
    if (!importText.trim()) return;
    setImporting(true);
    setImportLog(null);
    const res = await fetch(`/api/matches/${match.id}/import-stats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: importText }),
    });
    const data = await res.json();
    setImporting(false);
    setImportLog(data.log || [data.error]);
    if (data.ok) {
      const fresh = await fetch(`/api/matches/${match.id}`, { cache: "no-store" }).then((r) => r.json());
      setTeamStats(fresh.teamStats || []);
      setPlayerStats(fresh.playerStats || []);
    }
  };

  const onFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImportText(String(reader.result || ""));
    reader.readAsText(file);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <div className={`rounded-lg border p-5 mb-6 ${OUTCOME_STYLES[outcome]}`}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wide opacity-70">
            {match.competition?.name} {match.matchday ? `· ${match.matchday}` : ""}
          </p>
          <button onClick={() => setEditing((e) => !e)} className="text-xs underline">
            {editing ? "Annulla" : "Modifica"}
          </button>
        </div>
        <h1 className="scoreboard text-2xl text-ink">
          {match.is_home ? "Juventus" : match.opponent_name} vs {match.is_home ? match.opponent_name : "Juventus"}
        </h1>
        {match.status === "FINISHED" && (
          <p className="scoreboard text-4xl mt-1">
            {match.juve_score} - {match.opponent_score}
          </p>
        )}
        <p className="text-sm text-steel mt-2">
          {new Date(match.match_date).toLocaleString("it-IT", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {" · "}
          {match.is_home ? "Casa" : "Trasferta"}
          {match.venue ? ` · ${match.venue}` : ""}
        </p>
        {match.notes && <p className="text-sm mt-2 italic text-steel">{match.notes}</p>}
      </div>

      {editing && (
        <div className="rounded-lg border border-line bg-white p-4 mb-6 space-y-3">
          <Field label="Avversario">
            <input
              value={form.opponent_name}
              onChange={(e) => setForm({ ...form, opponent_name: e.target.value })}
              className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
            />
          </Field>
          <Field label="Data e ora">
            <input
              type="datetime-local"
              value={form.match_date}
              onChange={(e) => setForm({ ...form, match_date: e.target.value })}
              className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
            />
          </Field>
          <Field label="Stadio / luogo">
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
          <Field label="Note">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
              rows={2}
            />
          </Field>
          <button onClick={saveEdit} className="rounded-md bg-ink px-4 py-2 text-sm text-chalk">
            Salva modifiche
          </button>
        </div>
      )}

      <section className="rounded-lg border border-line bg-white p-4 mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wide text-steel">Importa statistiche (file .txt)</h2>
          <button onClick={() => setShowImport((s) => !s)} className="text-xs underline">
            {showImport ? "Chiudi" : "Apri"}
          </button>
        </div>
        {showImport && (
          <div className="mt-3 space-y-3">
            <button onClick={() => setShowFormat((s) => !s)} className="text-xs underline text-steel">
              {showFormat ? "Nascondi formato" : "Vedi il formato da usare"}
            </button>
            {showFormat && (
              <pre className="whitespace-pre-wrap rounded-md bg-ink/5 p-3 text-[11px] text-steel overflow-x-auto">
                {FORMAT_EXAMPLE}
              </pre>
            )}
            <input type="file" accept=".txt" onChange={onFileUpload} className="text-sm" />
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="…oppure incolla qui il testo"
              rows={6}
              className="w-full rounded-md border border-line px-3 py-2 text-xs font-mono"
            />
            <button
              onClick={importStats}
              disabled={importing}
              className="rounded-md bg-ink px-4 py-2 text-sm text-chalk disabled:opacity-50"
            >
              {importing ? "Importo…" : "Importa statistiche"}
            </button>
            {importLog && (
              <ul className="space-y-1 text-xs text-steel">
                {importLog.map((line, i) => (
                  <li key={i}>• {line}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {(juveStats || oppStats) && (
        <section className="mb-8">
          <h2 className="text-sm font-medium uppercase tracking-wide text-steel mb-3">Statistiche squadra</h2>
          <div className="overflow-x-auto rounded-lg border border-line bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase text-steel">
                  <th className="px-3 py-2">Statistica</th>
                  <th className="px-3 py-2">Juventus</th>
                  <th className="px-3 py-2">{match.opponent_name}</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Possesso palla", "possession", "%"],
                  ["Tiri totali", "shots_total", ""],
                  ["Tiri in porta", "shots_on_target", ""],
                  ["Calci d'angolo", "corners", ""],
                  ["Falli", "fouls", ""],
                  ["Cartellini gialli", "yellow_cards", ""],
                  ["Cartellini rossi", "red_cards", ""],
                  ["Fuorigioco", "offsides", ""],
                ].map(([label, key, suffix]) => (
                  <tr key={key as string} className="border-b border-line last:border-0">
                    <td className="px-3 py-2 text-steel">{label}</td>
                    <td className="px-3 py-2 font-medium">
                      {juveStats?.[key as string] ?? "-"}
                      {juveStats?.[key as string] != null ? suffix : ""}
                    </td>
                    <td className="px-3 py-2 font-medium">
                      {oppStats?.[key as string] ?? "-"}
                      {oppStats?.[key as string] != null ? suffix : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide text-steel mb-3">Giocatori e valutazioni</h2>
        {playersByPosition.length === 0 && (
          <p className="text-sm text-steel">
            Nessuna statistica giocatore ancora importata per questa partita. Usa "Importa statistiche" qui sopra.
          </p>
        )}
        <div className="space-y-6">
          {playersByPosition.map(({ pos, players }) => (
            <div key={pos}>
              <p className="text-xs font-semibold text-steel mb-2">{POSITION_LABELS[pos]}</p>
              <div className="space-y-3">
                {players.map((ps: any) => (
                  <div key={ps.id} className="rounded-lg border border-line bg-white p-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          #{ps.player.shirt_number} {ps.player.name}
                        </span>
                        <span className="text-xs text-steel">{ps.minutes_played}′</span>
                      </div>
                      <RatingPicker
                        matchId={match.id}
                        playerId={ps.player.id}
                        initialRating={ratings[ps.player.id] ?? null}
                        onSaved={(r) => setRatings((prev) => ({ ...prev, [ps.player.id]: r }))}
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-steel">
                      {pos === "GK" ? (
                        <>
                          <span>Parate: {ps.saves}</span>
                          <span>Gol subiti: {ps.goals_conceded}</span>
                        </>
                      ) : (
                        <>
                          <span>Gol: {ps.goals}</span>
                          <span>Assist: {ps.assists}</span>
                          <span>Tiri: {ps.shots_total}</span>
                          <span>Passaggi: {ps.passes_total}</span>
                        </>
                      )}
                      <span>Falli fatti: {ps.fouls_committed}</span>
                      <span>Falli subiti: {ps.fouls_suffered}</span>
                      {ps.yellow_cards > 0 && <span>🟨 {ps.yellow_cards}</span>}
                      {ps.red_cards > 0 && <span>🟥 {ps.red_cards}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
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
