"use client";

import { useEffect, useState } from "react";
import { matchOutcome, POSITION_ORDER, POSITION_LABELS } from "@/lib/types";
import { getTheme, getPageBackground } from "@/lib/competitionThemes";
import RatingPicker from "./RatingPicker";
import BackButton from "./BackButton";
import RosterPicker from "./RosterPicker";
import LineupPitch from "./LineupPitch";
import { layoutLineup, sortBench } from "@/lib/formations";
import { PLAYER_EXTRA_GROUPS, TEAM_EXTRA_ROWS, fmtStat } from "@/lib/statDefs";

const MAX_STARTERS = 11;
const MAX_SUBS = 7;

const OUTCOME_COLOR: Record<string, string> = {
  win: "#2FBE72",
  draw: "#E0A61A",
  loss: "#E14B4B",
  upcoming: "#8A8A87",
};

const FORMAT_EXAMPLE = `SQUADRA: possesso=58 tiri=14 tiri_porta=6 angoli=5 falli=10 gialli=2 rossi=0 fuorigioco=3 passaggi=480 precisione=87 xg=1.85
AVVERSARIO: possesso=42 tiri=8 tiri_porta=3 angoli=2 falli=14 gialli=3 rossi=1 fuorigioco=1 passaggi=320 precisione=79 xg=0.9
GIOCATORI:
Kenan YILDIZ | titolare=si minuti=90 gol=1 assist=0 tiri=3 tiri_porta=2 passaggi=32/38 dribbling=3/5 duelli=7/12 contrasti=2 xg=0.45 voto_sito=7.8
Michele DI GREGORIO | titolare=si minuti=90 parate=4 gol_subiti=1 voto_sito=6.9
(il nome basta scriverlo come compare sul sito; in alternativa: numero=7 minuti=90 ...)`;

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
    matchday: match.matchday ?? "",
    coach_id: match.coach_id ? String(match.coach_id) : "",
    juve_score: match.juve_score ?? "",
    opponent_score: match.opponent_score ?? "",
    status: match.status,
  });
  const [ratings, setRatings] = useState<Record<number, number>>(
    Object.fromEntries((initial.ratings || []).map((r: any) => [r.player_id, Number(r.rating)]))
  );

  const matchCoach = (initial.coaches || []).find((c: any) => c.id === match.coach_id) || null;
  const [showLineup, setShowLineup] = useState(false);
  const [fullRoster, setFullRoster] = useState<any[]>([]);
  // Titolari nell'ordine di click (portiere, poi da destra a sinistra linea per linea).
  // Un giocatore tolto lascia un "buco" (null) che viene riempito dal prossimo cliccato,
  // così chi sostituisce un errore prende esattamente il suo posto.
  const [lineupOrder, setLineupOrder] = useState<(number | null)[]>(() =>
    layoutLineup(
      (initial.playerStats || []).filter((ps: any) => ps.is_starter),
      initial.match.formation
    ).placed.map((pl) => pl.ps.player.id)
  );
  const lineupStarters = new Set<number>(lineupOrder.filter((id): id is number => id != null));
  const [lineupSubs, setLineupSubs] = useState<Set<number>>(
    new Set<number>(
      sortBench((initial.playerStats || []).filter((ps: any) => !ps.is_starter)).map((ps: any) => ps.player.id)
    )
  );
  const [lineupSaving, setLineupSaving] = useState(false);
  const [lineupMsg, setLineupMsg] = useState<string | null>(null);

  useEffect(() => {
    if (showLineup && fullRoster.length === 0) {
      fetch("/api/players", { cache: "no-store" })
        .then((r) => r.json())
        .then((d) => setFullRoster(d.players || []));
    }
  }, [showLineup, fullRoster.length]);

  const toggleLineup = (set: Set<number>, setter: (s: Set<number>) => void, id: number, max: number) => {
    const next = new Set(set);
    if (next.has(id)) {
      next.delete(id);
    } else {
      if (next.size >= max) return;
      next.add(id);
    }
    setter(next);
  };

  const toggleStarter = (id: number) => {
    setLineupOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = null;
        while (next.length > 0 && next[next.length - 1] == null) next.pop();
        return next;
      }
      if (prev.filter((x) => x != null).length >= MAX_STARTERS) return prev;
      const hole = prev.indexOf(null);
      if (hole >= 0) {
        const next = [...prev];
        next[hole] = id;
        return next;
      }
      return [...prev, id];
    });
  };

  const setCoach = async (coachId: number | null) => {
    const res = await fetch(`/api/matches/${match.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coach_id: coachId }),
    });
    if (res.ok) {
      setMatch({ ...match, coach_id: coachId });
      setForm((f: any) => ({ ...f, coach_id: coachId ? String(coachId) : "" }));
    } else {
      setLineupMsg("Impossibile salvare l'allenatore (hai eseguito aggiornamento_stats_4.sql?)");
    }
  };

  const saveLineup = async () => {
    setLineupSaving(true);
    setLineupMsg(null);
    const res = await fetch(`/api/matches/${match.id}/lineup`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        starters: lineupOrder.filter((id): id is number => id != null),
        substitutes: [...lineupSubs],
      }),
    });
    setLineupSaving(false);
    if (!res.ok) {
      setLineupMsg("Errore nel salvataggio della formazione");
      return;
    }
    setLineupMsg("Formazione salvata");
    const fresh = await fetch(`/api/matches/${match.id}`, { cache: "no-store" }).then((r) => r.json());
    setTeamStats(fresh.teamStats || []);
    setPlayerStats(fresh.playerStats || []);
    setRatings(Object.fromEntries((fresh.ratings || []).map((r: any) => [r.player_id, Number(r.rating)])));
  };

  const outcome = matchOutcome(match);
  const theme = getTheme(match.competition?.short_name);
  const juveStats = teamStats.find((t: any) => t.side === "juve");
  const oppStats = teamStats.find((t: any) => t.side === "opponent");
  // Titolari e panchina nell'ordine in cui li hai scelti (come sul campo)
  const starterStats = layoutLineup(
    playerStats.filter((ps: any) => ps.is_starter),
    match.formation
  ).placed.map((pl) => pl.ps);
  const benchStats = sortBench(playerStats.filter((ps: any) => !ps.is_starter));
  const playerGroups = [
    { key: "starters", title: `Titolari (${starterStats.length})`, players: starterStats },
    { key: "bench", title: `Panchina e subentrati (${benchStats.length})`, players: benchStats },
  ].filter((g) => g.players.length > 0);

  const saveEdit = async () => {
    const res = await fetch(`/api/matches/${match.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        match_date: new Date(form.match_date).toISOString(),
        venue: form.venue,
        notes: form.notes,
        opponent_name: form.opponent_name,
        matchday: form.matchday.trim() === "" ? null : form.matchday.trim(),
        coach_id: form.coach_id ? Number(form.coach_id) : null,
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
        matchday: form.matchday.trim() === "" ? null : form.matchday.trim(),
        coach_id: form.coach_id ? Number(form.coach_id) : null,
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
    <div className="min-h-screen transition-colors duration-300" style={getPageBackground(theme)}>
      <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <BackButton color={theme.textMuted} />
      <div
        className="rounded-lg p-5 mb-6"
        style={{ background: theme.surface, border: `2px solid ${OUTCOME_COLOR[outcome]}` }}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wide" style={{ color: theme.textMuted }}>
            {match.competition?.name} {match.matchday ? `· ${match.matchday}` : ""}
          </p>
          <button onClick={() => setEditing((e) => !e)} className="text-xs underline" style={{ color: theme.text }}>
            {editing ? "Annulla" : "Modifica"}
          </button>
        </div>
        <h1 className="scoreboard text-2xl" style={{ color: theme.text }}>
          {match.is_home ? "Juventus" : match.opponent_name} vs {match.is_home ? match.opponent_name : "Juventus"}
        </h1>
        {match.status === "FINISHED" && (
          <p className="scoreboard text-4xl mt-1" style={{ color: OUTCOME_COLOR[outcome] }}>
            {match.juve_score} - {match.opponent_score}
          </p>
        )}
        <p className="text-sm mt-2" style={{ color: theme.textMuted }}>
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
        {match.notes && (
          <p className="text-sm mt-2 italic" style={{ color: theme.textMuted }}>
            {match.notes}
          </p>
        )}
      </div>

      {editing && (
        <div className="card p-4 mb-6 space-y-3">
          <Field label="Giornata / turno">
            <input
              value={form.matchday}
              onChange={(e) => setForm({ ...form, matchday: e.target.value })}
              placeholder="es. Giornata 5, Ottavi andata"
              className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
            />
          </Field>
          <Field label="Allenatore">
            <select
              value={form.coach_id}
              onChange={(e) => setForm({ ...form, coach_id: e.target.value })}
              className="w-full rounded-md border border-line px-3 py-1.5 text-sm"
            >
              <option value="">— nessuno —</option>
              {(initial.coaches || []).map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
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

      <section className="card p-4 mb-8">
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

      {match.status === "FINISHED" && (
        <section className="card p-4 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium uppercase tracking-wide text-steel">Formazione</h2>
            <button onClick={() => setShowLineup((s) => !s)} className="text-xs underline">
              {showLineup ? "Chiudi" : "Modifica"}
            </button>
          </div>
          {!showLineup && (
            <p className="text-xs text-steel mt-2">
              {lineupStarters.size + lineupSubs.size > 0
                ? `Titolari (${starterStats.length}): ${starterStats.map((ps: any) => ps.player.name).join(", ") || "-"}. Panchina (${benchStats.length}): ${benchStats.map((ps: any) => ps.player.name).join(", ") || "-"}.`
                : "Nessun giocatore selezionato ancora."}
            </p>
          )}
          {showLineup && (
            <div className="mt-3 space-y-4">
              {fullRoster.length === 0 ? (
                <p className="text-xs text-steel">Caricamento rosa…</p>
              ) : (
                <>
                  <p className="text-xs text-steel">
                    Clicca i titolari in ordine: prima il portiere, poi per ogni linea da destra a sinistra (come nel modulo scelto). Se hai sbagliato, clicca di nuovo il nome per toglierlo: il prossimo che clicchi prende il suo posto.
                  </p>
                  {(initial.coaches || []).length > 0 && (
                    <div>
                      <p className="text-xs font-medium mb-2">Allenatore</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(initial.coaches || []).map((c: any) => {
                          const on = match.coach_id === c.id;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setCoach(on ? null : c.id)}
                              className={`rounded-full border px-2.5 py-1 text-xs ${on ? "border-transparent" : "border-line text-steel"}`}
                              style={on ? { background: theme.accent, color: theme.accentText } : undefined}
                            >
                              {c.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium mb-2">
                      Titolari ({lineupStarters.size}/{MAX_STARTERS})
                    </p>
                    <RosterPicker
                      roster={fullRoster}
                      selected={lineupStarters}
                      disabledIds={lineupSubs}
                      onToggle={toggleStarter}
                      activeColor={theme.accent}
                      activeTextColor={theme.accentText}
                    />
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-2">
                      Panchina ({lineupSubs.size}/{MAX_SUBS})
                    </p>
                    <RosterPicker
                      roster={fullRoster}
                      selected={lineupSubs}
                      disabledIds={lineupStarters}
                      onToggle={(id) => toggleLineup(lineupSubs, setLineupSubs, id, MAX_SUBS)}
                      activeColor={theme.accent}
                      activeTextColor={theme.accentText}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={saveLineup}
                      disabled={lineupSaving}
                      className="rounded-md bg-ink px-4 py-2 text-sm text-chalk disabled:opacity-50"
                    >
                      {lineupSaving ? "Salvo…" : "Salva formazione"}
                    </button>
                    {lineupMsg && <span className="text-xs text-steel">{lineupMsg}</span>}
                  </div>
                  <p className="text-[11px] text-steel">
                    Nota: rimuovere un giocatore dalla formazione cancella anche le sue eventuali statistiche importate per questa partita.
                  </p>
                </>
              )}
            </div>
          )}
        </section>
      )}

      {match.status === "FINISHED" && (
        <section className="mb-8">
          <h2 className="text-sm font-medium uppercase tracking-wide mb-3" style={{ color: theme.text, opacity: 0.7 }}>
            Formazione in campo
          </h2>
          <LineupPitch
            matchId={match.id}
            formation={match.formation ?? null}
            playerStats={playerStats}
            ratings={ratings}
            coach={matchCoach}
            theme={theme}
            onFormationSaved={(f) => {
              setMatch({ ...match, formation: f });
            }}
            onSlotsSaved={(slots) =>
              setPlayerStats(
                playerStats.map((ps: any) =>
                  slots[ps.player.id] != null ? { ...ps, slot: slots[ps.player.id] } : ps
                )
              )
            }
          />
        </section>
      )}

      {(juveStats || oppStats) && (
        <section className="mb-8">
          <h2 className="text-sm font-medium uppercase tracking-wide mb-3" style={{ color: theme.text, opacity: 0.7 }}>Statistiche squadra</h2>
          <div className="overflow-x-auto card">
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
                  ...TEAM_EXTRA_ROWS.filter((r) => juveStats?.[r.key] != null || oppStats?.[r.key] != null).map(
                    (r) => [r.label, r.key, ""]
                  ),
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

      {match.status === "FINISHED" && matchCoach && (
        <section className="mb-8">
          <h2 className="text-sm font-medium uppercase tracking-wide mb-3" style={{ color: theme.text, opacity: 0.7 }}>
            Allenatore
          </h2>
          <div className="space-y-3">
            {[matchCoach].map((c: any) => (
              <div key={c.id} className="card p-3 flex items-center justify-between flex-wrap gap-2">
                <span className="text-sm font-medium">{c.name}</span>
                <RatingPicker
                  matchId={match.id}
                  playerId={c.id}
                  initialRating={ratings[c.id] ?? null}
                  onSaved={(r) => setRatings((prev) => ({ ...prev, [c.id]: r }))}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-medium uppercase tracking-wide mb-3" style={{ color: theme.text, opacity: 0.7 }}>Giocatori e valutazioni</h2>
        {playerGroups.length === 0 && (
          <p className="text-sm" style={{ color: theme.text, opacity: 0.6 }}>
            Nessuna statistica giocatore ancora importata per questa partita. Usa "Importa statistiche" qui sopra.
          </p>
        )}
        <div className="space-y-6">
          {playerGroups.map(({ key, title, players }) => (
            <div key={key}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: theme.accent }}>{title}</p>
              <div className="space-y-3">
                {players.map((ps: any) => (
                  <div key={ps.id} className="card p-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          #{ps.player.shirt_number} {ps.player.name}
                        </span>
                        <span className="text-[10px] uppercase text-steel">
                          {POSITION_LABELS[ps.player.position as keyof typeof POSITION_LABELS]}
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
                      {ps.player.position === "GK" ? (
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
                      {ps.site_rating != null && (
                        <span style={{ color: theme.accent }}>Voto siti: {Number(ps.site_rating).toFixed(1)}</span>
                      )}
                    </div>
                    <ExtraStats ps={ps} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
      </div>
    </div>
  );
}

function ExtraStats({ ps }: { ps: any }) {
  const isGK = ps.player.position === "GK";
  const groups = PLAYER_EXTRA_GROUPS.map((g) => ({
    title: g.title,
    items: g.stats.filter((d) => (!d.gkOnly || isGK) && ps[d.key] != null && Number(ps[d.key]) !== 0),
  })).filter((g) => g.items.length > 0);
  if (groups.length === 0) return null;
  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-[11px] underline text-steel">Altre statistiche</summary>
      <div className="mt-2 space-y-1.5">
        {groups.map((g) => (
          <p key={g.title} className="text-[11px] text-steel">
            <span className="font-semibold uppercase">{g.title}: </span>
            {g.items.map((d) => `${d.label} ${fmtStat(ps[d.key], d.decimals)}`).join(" · ")}
          </p>
        ))}
      </div>
    </details>
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
