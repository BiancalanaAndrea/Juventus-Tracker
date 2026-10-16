"use client";

import { useState } from "react";
import { FORMATIONS, layoutLineup, sortBench } from "@/lib/formations";
import PlayerPhoto from "./PlayerPhoto";
import { ratingColors } from "@/lib/ratingColor";
import type { CompetitionTheme } from "@/lib/competitionThemes";
import { matchAwards } from "@/lib/awards";

function fmtRating(r: number) {
  return String(parseFloat(Number(r).toFixed(2)));
}


function Pill({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className="flex h-5 w-5 items-center justify-center rounded-full bg-black/80 text-[11px] leading-none ring-1 ring-white/20"
    >
      {children}
    </span>
  );
}

// n icone (max 3, poi "emoji ×n")
function Repeat({ n, icon, title }: { n: number; icon: string; title: string }) {
  if (n <= 0) return null;
  if (n > 3)
    return (
      <span
        title={title}
        className="flex h-5 items-center justify-center rounded-full bg-black/80 px-1.5 text-[10px] font-semibold leading-none ring-1 ring-white/20"
      >
        {icon}×{n}
      </span>
    );
  return (
    <>
      {Array.from({ length: n }).map((_, i) => (
        <Pill key={i} title={title}>
          {icon}
        </Pill>
      ))}
    </>
  );
}

function SubArrow({ dir }: { dir: "in" | "out" }) {
  const color = dir === "in" ? "#2FBE72" : "#E14B4B";
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/85 ring-1 ring-white/20">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d={dir === "in" ? "M6 10V3M3 5.5L6 2.5l3 3" : "M6 2v7M3 6.5L6 9.5l3-3"}
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

// Cognome da mostrare ("Nick WOLTEMADE" -> "WOLTEMADE", "Francisco Conceição" -> "Conceição")
function shortName(name: string) {
  const words = String(name || "").split(" ").filter(Boolean);
  const upper = words.filter((w) => w.length > 1 && w === w.toUpperCase());
  return upper.length ? upper.join(" ") : words[words.length - 1] || "";
}

// "⚽⚽" (max 3, poi "⚽×4")
function iconsText(n: number, icon: string) {
  if (n <= 0) return "";
  return n > 3 ? `${icon}×${n}` : icon.repeat(n);
}

// Nome sul campo: "Mario ROSSI" -> "M. ROSSI"; un solo nome ("Bremer") -> "BREMER"
function fieldName(name: string) {
  const words = String(name || "").split(" ").filter(Boolean);
  if (words.length <= 1) return (words[0] || "").toUpperCase();
  const upper = words.filter((w) => w.length > 1 && w === w.toUpperCase());
  const surnameWords = upper.length ? upper : [words[words.length - 1]];
  const first = words.find((w) => !surnameWords.includes(w));
  const surname = surnameWords.join(" ").toUpperCase();
  return first ? `${first[0].toUpperCase()}. ${surname}` : surname;
}

// quanti minuti ha giocato / quando è entrato (stima: 90 - minuti giocati)
const hasActivity = (ps: any) =>
  (ps.minutes_played || 0) > 0 ||
  ["goals", "assists", "shots_total", "passes_total", "fouls_committed", "fouls_suffered", "yellow_cards", "red_cards"].some(
    (k) => (ps[k] || 0) > 0
  );

type Award = "mvp" | "worst" | null;

function AwardPill({ award, small }: { award: Award; small?: boolean }) {
  if (!award) return null;
  const mvp = award === "mvp";
  return (
    <span
      title={mvp ? "MVP della partita" : "Peggiore in campo"}
      className={`flex items-center justify-center rounded-full ring-1 ${small ? "h-4 w-4 text-[9px]" : "h-5 w-5 text-[11px]"} leading-none`}
      style={
        mvp
          ? { background: "#F5C518", color: "#0A0A0A", boxShadow: "0 0 0 1px rgba(0,0,0,0.4)" }
          : { background: "#E14B4B", color: "#fff", boxShadow: "0 0 0 1px rgba(0,0,0,0.4)" }
      }
    >
      {mvp ? "🏆" : "👎"}
    </span>
  );
}

function RatingPill({ value, title, small }: { value: number; title: string; small?: boolean }) {
  const c = ratingColors(value);
  return (
    <span
      title={title}
      className={`rounded font-bold leading-none ring-1 ring-black/40 ${small ? "px-1 py-px text-[8px]" : "px-1.5 py-0.5 text-[10px]"}`}
      style={{ background: c.bg, color: c.text }}
    >
      {value}
    </span>
  );
}

function PlayerNode({
  ps,
  rating,
  award,
  replacedBy,
  replacesName,
  sub,
  selected,
  onClick,
  small,
}: {
  ps: any;
  rating?: number | null;
  award?: Award;
  replacedBy?: any;
  replacesName?: string | null;
  sub?: "in" | "out" | null;
  selected?: boolean;
  onClick?: () => void;
  small?: boolean;
}) {
  const p = ps.player;
  const size = small ? "h-11 w-11" : "h-12 w-12 sm:h-14 sm:w-14";
  const minute =
    sub === "out" ? `${ps.minutes_played}′` : sub === "in" ? `~${Math.max(1, 90 - (ps.minutes_played || 0))}′` : null;
  const siteRating = ps.site_rating != null ? Number(ps.site_rating) : null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col items-center ${small ? "w-full" : "w-16 sm:w-20"} ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className="relative">
        {/* gol e assist sopra la foto */}
        <div className="absolute -top-2.5 left-1/2 z-10 flex -translate-x-1/2 gap-0.5">
          <Repeat n={ps.assists || 0} icon="👟" title="Assist" />
          <Repeat n={ps.goals || 0} icon="⚽" title="Gol" />
        </div>
        <div
          className={`${size} overflow-hidden rounded-full bg-neutral-700 ring-2 transition ${
            selected ? "ring-yellow-300 scale-110" : "ring-white/30"
          }`}
        >
          <PlayerPhoto url={p.photo_url} name={p.name} focusY={p.photo_focus_y} focusX={p.photo_focus_x} fallback={p.shirt_number ?? "?"} />
        </div>
        {/* premio: MVP / peggiore (in alto a sinistra) */}
        {award && (
          <div className="absolute -left-2 -top-1.5 z-20">
            <AwardPill award={award} />
          </div>
        )}
        {/* sostituzione (in alto a destra) */}
        {sub && (
          <div className="absolute -right-2 -top-1.5 z-10">
            <SubArrow dir={sub} />
          </div>
        )}
        {/* cartellini */}
        {(ps.red_cards > 0 || ps.yellow_cards > 0) && (
          <div className="absolute -left-2 top-1/2 z-10 -translate-y-1/2">
            <Pill title="Cartellino">{ps.red_cards > 0 ? "🟥" : "🟨"}</Pill>
          </div>
        )}
        {/* il mio voto */}
        {rating != null && (
          <span
            className="absolute -bottom-1.5 -left-1 z-10 rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none ring-1 ring-black/40 sm:-left-2"
            style={{ background: ratingColors(rating).bg, color: ratingColors(rating).text }}
            title="Il mio voto"
          >
            {fmtRating(rating)}
          </span>
        )}
      </div>
      <p className="mt-1.5 max-w-full truncate text-[11px] font-medium leading-tight text-white drop-shadow sm:text-xs">
        {fieldName(p.name)}
      </p>
      <p className="flex items-center justify-center gap-1 text-[10px] leading-tight text-white/70">
        <span>
          {p.shirt_number ?? "-"}
          {minute ? ` · ${minute}` : ""}
        </span>
        {siteRating != null && (
          <span
            title="Voto dei siti"
            className="rounded px-1 py-px text-[9px] font-bold leading-none ring-1 ring-white/50"
            style={{ background: ratingColors(siteRating).bg, color: ratingColors(siteRating).text }}
          >
            {siteRating.toFixed(1)}
          </span>
        )}
      </p>
      {replacesName && (
        <p className="max-w-full truncate text-[10px] leading-tight text-white/80" title="Entrato al posto di">
          per {replacesName}
        </p>
      )}
      {replacedBy && (
        <p className="max-w-full truncate text-[10px] font-medium leading-tight" style={{ color: "#6EE7A0" }}>
          ↑ {shortName(replacedBy.player.name).toUpperCase()}
          {(replacedBy.minutes_played || 0) > 0 ? ` ${90 - replacedBy.minutes_played}′` : ""}
        </p>
      )}
    </button>
  );
}

export default function LineupPitch({
  matchId,
  formation,
  playerStats,
  ratings,
  coach,
  theme,
  onFormationSaved,
  onSlotsSaved,
}: {
  matchId: number;
  formation: string | null;
  playerStats: any[];
  ratings: Record<number, number>;
  coach?: any;
  theme: CompetitionTheme;
  onFormationSaved: (f: string | null) => void;
  onSlotsSaved: (slots: Record<number, number>) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const starters = playerStats.filter((ps) => ps.is_starter);
  const bench = sortBench(playerStats.filter((ps) => !ps.is_starter));
  const entered = bench.filter(hasActivity);
  const unused = bench.filter((ps) => !hasActivity(ps));

  const { placed, formationLabel } = layoutLineup(starters, formation);

  // MVP e peggiore in campo (a pari merito possono essere più di uno)
  const awards = matchAwards(
    playerStats.map((ps) => ({ id: ps.player.id, mine: ratings[ps.player.id] ?? null, site: ps.site_rating }))
  );
  const awardOf = (id: number): Award => (awards.mvp.has(id) ? "mvp" : awards.worst.has(id) ? "worst" : null);

  // Abbina ogni titolare uscito al subentrato che ha preso il suo posto:
  // il minuto d'uscita (minuti giocati dal titolare) coincide col minuto d'ingresso (90 - minuti del subentrato).
  const replacedByMap = new Map<number, any>();
  {
    const outs = starters.filter((s) => (s.minutes_played || 0) > 0 && s.minutes_played < 90);
    const free = new Set(outs.map((s) => s.player.id));
    const ins = entered.filter((s) => (s.minutes_played || 0) > 0);
    const groupOf = (p: string) => (p === "GK" ? "GK" : p);
    for (const pass of [0, 1]) {
      for (const subPs of ins) {
        if ([...replacedByMap.values()].includes(subPs)) continue;
        const inMinute = 90 - subPs.minutes_played;
        let best: any = null;
        let bestScore = Infinity;
        for (const o of outs) {
          if (!free.has(o.player.id)) continue;
          const diff = Math.abs(o.minutes_played - inMinute);
          if (diff > 1) continue;
          const samePos = groupOf(o.player.position) === groupOf(subPs.player.position);
          if (pass === 0 && !samePos) continue; // prima solo stesso ruolo
          const score = diff * 10 + (samePos ? 0 : 1);
          if (score < bestScore) {
            bestScore = score;
            best = o;
          }
        }
        if (best) {
          replacedByMap.set(best.player.id, subPs);
          free.delete(best.player.id);
        }
      }
    }
  }
  const pairedSubs = new Set<any>([...replacedByMap.values()]);
  // subentrato (id) -> titolare che ha sostituito
  const replacesMap = new Map<number, any>();
  starters.forEach((st) => {
    const sub = replacedByMap.get(st.player.id);
    if (sub) replacesMap.set(sub.player.id, st);
  });
  const changeFormation = async (value: string) => {
    setMsg(null);
    const res = await fetch(`/api/matches/${matchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formation: value || null }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setMsg(
        `Impossibile salvare il modulo: ${d.error || "errore"}. Hai eseguito la riga SQL di aggiornamento su Supabase?`
      );
      return;
    }
    setSelected(null);
    onFormationSaved(value || null);
  };

  const swap = async (playerId: number) => {
    if (selected == null) {
      setSelected(playerId);
      return;
    }
    if (selected === playerId) {
      setSelected(null);
      return;
    }
    const slotMap: Record<number, number> = {};
    placed.forEach((pl) => (slotMap[pl.ps.player.id] = pl.slot));
    const a = slotMap[selected];
    slotMap[selected] = slotMap[playerId];
    slotMap[playerId] = a;
    setSelected(null);
    onSlotsSaved(slotMap);
    const res = await fetch(`/api/matches/${matchId}/slots`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slots: Object.entries(slotMap).map(([player_id, slot]) => ({ player_id: Number(player_id), slot })),
      }),
    });
    if (!res.ok) setMsg("Impossibile salvare la posizione (serve la riga SQL di aggiornamento su Supabase).");
  };

  const subOf = (ps: any): "out" | null =>
    ps.is_starter && (ps.minutes_played || 0) > 0 && ps.minutes_played < 90 && !(ps.red_cards > 0) ? "out" : null;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs" style={{ color: theme.textMuted }}>
          Modulo
          <select
            value={formation ?? ""}
            onChange={(e) => changeFormation(e.target.value)}
            className="rounded-md border border-line px-2 py-1 text-sm"
          >
            <option value="">Automatico{!formation && formationLabel ? ` (${formationLabel})` : ""}</option>
            {FORMATIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>
        <span className="text-[11px]" style={{ color: theme.textMuted }}>
          Tocca due giocatori per scambiarli di posto
        </span>
      </div>
      {msg && <p className="mb-2 text-xs text-loss">{msg}</p>}

      {starters.length === 0 ? (
        <p className="text-sm" style={{ color: theme.textMuted }}>
          Nessun titolare selezionato. Imposta la formazione qui sopra per vedere il campo.
        </p>
      ) : (
        <div
          className="relative mx-auto w-full max-w-md overflow-hidden rounded-xl ring-1 ring-white/10"
          style={{
            aspectRatio: "100 / 150",
            background:
              "repeating-linear-gradient(180deg, #2f7d3e 0px, #2f7d3e 8.33%, #2a7338 8.33%, #2a7338 16.66%)",
          }}
        >
          {/* linee del campo (metà campo offensiva) */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 150" preserveAspectRatio="none" fill="none">
            <g stroke="rgba(255,255,255,0.55)" strokeWidth="0.6">
              <rect x="3" y="0" width="94" height="147" />
              <path d="M38 0 A12 12 0 0 0 62 0" />
              <rect x="22" y="115" width="56" height="32" />
              <rect x="36" y="134" width="28" height="13" />
              <path d="M40 115 A12 12 0 0 1 60 115" />
            </g>
            <circle cx="50" cy="125" r="0.8" fill="rgba(255,255,255,0.7)" />
          </svg>

          {placed.map((pl) => (
            <div
              key={pl.ps.player.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pl.x}%`, top: `${pl.y}%` }}
            >
              <PlayerNode
                ps={pl.ps}
                rating={ratings[pl.ps.player.id] ?? null}
                award={awardOf(pl.ps.player.id)}
                replacedBy={replacedByMap.get(pl.ps.player.id)}
                sub={subOf(pl.ps)}
                selected={selected === pl.ps.player.id}
                onClick={() => swap(pl.ps.player.id)}
              />
            </div>
          ))}

          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/55 px-3 py-1.5 text-xs text-white">
            <span className="font-semibold">Juventus</span>
            <span>{formation ?? formationLabel}</span>
          </div>
        </div>
      )}

      {coach && (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#2a7338] px-3 py-2.5 ring-1 ring-white/10">
          <div className="relative">
            <div className="h-11 w-11 overflow-hidden rounded-full bg-neutral-700 ring-2 ring-white/30">
              <PlayerPhoto url={coach.photo_url} name={coach.name} focusY={coach.photo_focus_y} focusX={coach.photo_focus_x} fallback="ALL" fallbackClassName="text-xs" />
            </div>
            {ratings[coach.id] != null && (
              <span
                className="absolute -bottom-1.5 -left-2 z-10 rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none ring-1 ring-black/40"
                style={{ background: ratingColors(ratings[coach.id]).bg, color: ratingColors(ratings[coach.id]).text }}
                title="Il mio voto"
              >
                {fmtRating(ratings[coach.id])}
              </span>
            )}
          </div>
          <div className="text-white">
            <p className="text-[10px] uppercase tracking-wide text-white/70">Allenatore</p>
            <p className="text-sm font-medium leading-tight">{coach.name}</p>
          </div>
        </div>
      )}

      {entered.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: theme.accent }}>
            Subentrati
          </p>
          <div className="grid grid-cols-5 gap-x-1 gap-y-6 rounded-xl bg-[#2a7338] px-2 py-5 ring-1 ring-white/10">
            {entered.map((ps) => (
              <PlayerNode
                key={ps.id}
                ps={ps}
                rating={ratings[ps.player.id] ?? null}
                award={awardOf(ps.player.id)}
                sub="in"
                replacesName={replacesMap.has(ps.player.id) ? shortName(replacesMap.get(ps.player.id).player.name).toUpperCase() : null}
                small
              />
            ))}
          </div>
          <p className="mt-1 text-[10px]" style={{ color: theme.textMuted }}>
            Il minuto d'ingresso (~) è stimato dai minuti giocati.
          </p>
        </div>
      )}
      {unused.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: theme.accent }}>
            Non entrati
          </p>
          <div className="grid grid-cols-5 gap-x-1 gap-y-6 rounded-xl bg-[#2a7338] px-2 py-5 ring-1 ring-white/10">
            {unused.map((ps) => (
              <PlayerNode key={ps.id} ps={ps} rating={ratings[ps.player.id] ?? null} award={awardOf(ps.player.id)} small />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
