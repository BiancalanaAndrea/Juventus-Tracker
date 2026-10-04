"use client";

import { useState } from "react";
import { FORMATIONS, layoutLineup } from "@/lib/formations";
import { photoImgStyle } from "@/lib/photo";
import type { CompetitionTheme } from "@/lib/competitionThemes";

function fmtRating(r: number) {
  return String(parseFloat(Number(r).toFixed(2)));
}

function ratingColor(r: number) {
  return r >= 7 ? "#2FBE72" : r >= 6 ? "#E0A61A" : "#E14B4B";
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

function PlayerNode({
  ps,
  rating,
  sub,
  selected,
  onClick,
  small,
}: {
  ps: any;
  rating?: number | null;
  sub?: "in" | "out" | null;
  selected?: boolean;
  onClick?: () => void;
  small?: boolean;
}) {
  const p = ps.player;
  const size = small ? "h-11 w-11" : "h-12 w-12 sm:h-14 sm:w-14";
  const minute =
    sub === "out" ? `${ps.minutes_played}′` : sub === "in" ? `~${Math.max(1, 90 - (ps.minutes_played || 0))}′` : null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex w-16 flex-col items-center sm:w-20 ${onClick ? "cursor-pointer" : "cursor-default"}`}
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
          {p.photo_url && p.photo_url.trim() !== "" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.photo_url}
              alt={p.name}
              className="h-full w-full object-cover"
              style={photoImgStyle(p.photo_focus_y, p.photo_focus_x)}
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm font-semibold text-white/80">
              {p.shirt_number ?? "?"}
            </span>
          )}
        </div>
        {/* sostituzione */}
        {sub && (
          <div className="absolute -right-2 top-1/2 z-10 -translate-y-1/2">
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
            className="absolute -bottom-1.5 -left-2 z-10 rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none text-black"
            style={{ background: ratingColor(rating) }}
            title="Il mio voto"
          >
            {fmtRating(rating)}
          </span>
        )}
      </div>
      <p className="mt-1.5 max-w-full truncate text-[11px] font-medium leading-tight text-white drop-shadow sm:text-xs">
        {p.name}
      </p>
      <p className="text-[10px] leading-tight text-white/70">
        {p.shirt_number ?? "-"}
        {minute ? ` · ${minute}` : ""}
      </p>
    </button>
  );
}

export default function LineupPitch({
  matchId,
  formation,
  playerStats,
  ratings,
  theme,
  onFormationSaved,
  onSlotsSaved,
}: {
  matchId: number;
  formation: string | null;
  playerStats: any[];
  ratings: Record<number, number>;
  theme: CompetitionTheme;
  onFormationSaved: (f: string | null) => void;
  onSlotsSaved: (slots: Record<number, number>) => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const starters = playerStats.filter((ps) => ps.is_starter);
  const bench = playerStats.filter((ps) => !ps.is_starter);
  const entered = bench
    .filter((ps) => (ps.minutes_played || 0) > 0)
    .sort((a, b) => b.minutes_played - a.minutes_played);
  const unused = bench.filter((ps) => !((ps.minutes_played || 0) > 0));

  const { placed, formationLabel } = layoutLineup(starters, formation);

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

      {entered.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: theme.accent }}>
            Subentrati
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-5 rounded-xl bg-[#2a7338] px-3 py-5 ring-1 ring-white/10">
            {entered.map((ps) => (
              <PlayerNode key={ps.id} ps={ps} rating={ratings[ps.player.id] ?? null} sub="in" small />
            ))}
          </div>
          <p className="mt-1 text-[10px]" style={{ color: theme.textMuted }}>
            Il minuto d'ingresso (~) è stimato dai minuti giocati.
          </p>
        </div>
      )}
      {unused.length > 0 && (
        <p className="mt-3 text-xs" style={{ color: theme.textMuted }}>
          Non entrati: {unused.map((ps) => ps.player.name).join(", ")}
        </p>
      )}
    </div>
  );
}
