"use client";

import { useState } from "react";
import { matchOutcome, OUTCOME_STYLES, POSITION_ORDER, POSITION_LABELS } from "@/lib/types";
import RatingPicker from "./RatingPicker";

export default function MatchDetailClient({ initial }: { initial: any }) {
  const [match, setMatch] = useState(initial.match);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    match_date: match.match_date?.slice(0, 16) ?? "",
    venue: match.venue ?? "",
    notes: match.notes ?? "",
    home_score: match.home_score ?? "",
    away_score: match.away_score ?? "",
  });
  const [ratings, setRatings] = useState<Record<number, number>>(
    Object.fromEntries((initial.ratings || []).map((r: any) => [r.player_id, Number(r.rating)]))
  );

  const outcome = matchOutcome(match);
  const opponent = match.is_home ? match.away_team : match.home_team;

  const teamStatsByTeam = new Map((initial.teamStats || []).map((t: any) => [t.team_id, t]));
  const playersByPosition = POSITION_ORDER.map((pos) => ({
    pos,
    players: (initial.playerStats || []).filter((ps: any) => ps.player.position === pos),
  })).filter((g) => g.players.length > 0);

  const saveEdit = async () => {
    const res = await fetch(`/api/matches/${match.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        match_date: new Date(form.match_date).toISOString(),
        venue: form.venue,
        notes: form.notes,
        home_score: form.home_score === "" ? null : Number(form.home_score),
        away_score: form.away_score === "" ? null : Number(form.away_score),
      }),
    });
    if (res.ok) {
      setMatch({
        ...match,
        match_date: new Date(form.match_date).toISOString(),
        venue: form.venue,
        notes: form.notes,
        home_score: form.home_score === "" ? null : Number(form.home_score),
        away_score: form.away_score === "" ? null : Number(form.away_score),
      });
      setEditing(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      {/* Header partita */}
      <div className={`rounded-lg border p-5 mb-6 ${OUTCOME_STYLES[outcome]}`}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-wide opacity-70">
            {match.competition?.name} · {match.matchday}
          </p>
          <button onClick={() => setEditing((e) => !e)} className="text-xs underline">
            {editing ? "Annulla" : "Modifica"}
          </button>
        </div>
        <h1 className="scoreboard text-2xl text-ink">
          {match.is_home ? "Juventus" : opponent?.name} vs {match.is_home ? opponent?.name : "Juventus"}
        </h1>
        {match.status === "FINISHED" && (
          <p className="scoreboard text-4xl mt-1">
            {match.home_score} - {match.away_score}
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
          <div className="flex gap-3">
            <Field label="Gol casa">
              <input
                type="number"
                value={form.home_score}
                onChange={(e) => setForm({ ...form, home_score: e.target.value })}
                className="w-20 rounded-md border border-line px-3 py-1.5 text-sm"
              />
            </Field>
            <Field label="Gol trasferta">
              <input
                type="number"
                value={form.away_score}
                onChange={(e) => setForm({ ...form, away_score: e.target.value })}
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

      {/* Statistiche di squadra */}
      {teamStatsByTeam.size > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-medium uppercase tracking-wide text-steel mb-3">Statistiche squadra</h2>
          <div className="overflow-x-auto rounded-lg border border-line bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase text-steel">
                  <th className="px-3 py-2">Statistica</th>
                  {[...teamStatsByTeam.values()].map((t: any) => (
                    <th key={t.team_id} className="px-3 py-2">{t.team.name}</th>
                  ))}
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
                  <tr key={key} className="border-b border-line last:border-0">
                    <td className="px-3 py-2 text-steel">{label}</td>
                    {[...teamStatsByTeam.values()].map((t: any) => (
                      <td key={t.team_id} className="px-3 py-2 font-medium">
                        {t[key as string] ?? "-"}
                        {t[key as string] != null ? suffix : ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Statistiche + valutazioni giocatori, per reparto */}
      {playersByPosition.length > 0 && (
        <section>
          <h2 className="text-sm font-medium uppercase tracking-wide text-steel mb-3">
            Giocatori e valutazioni
          </h2>
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
      )}
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
