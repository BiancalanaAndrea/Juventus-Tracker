"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { currentSeason, seasonLabel } from "@/lib/season";

// Stagione scelta dall'utente, ricordata sul dispositivo (cookie + localStorage).
// Il cookie serve alle pagine che caricano i dati dal server (es. scheda giocatore).

interface SeasonCtx {
  season: number;
  ready: boolean; // false finché non ho letto la scelta salvata (evita caricamenti doppi)
  seasons: number[]; // dalla più recente alla più vecchia
  label: string;
  setSeason: (s: number) => void;
  addNextSeason: () => void;
}

const Ctx = createContext<SeasonCtx>({
  season: currentSeason(),
  ready: true,
  seasons: [currentSeason()],
  label: seasonLabel(currentSeason()),
  setSeason: () => {},
  addNextSeason: () => {},
});

export const useSeason = () => useContext(Ctx);

const LS_SEASON = "jt_season";
const LS_EXTRA = "jt_extra_seasons";

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

function writeCookie(season: number) {
  try {
    document.cookie = `jt_season=${season}; path=/; max-age=31536000; samesite=lax`;
  } catch {}
}

export default function SeasonProvider({ children }: { children: React.ReactNode }) {
  const [season, setSeasonState] = useState<number>(currentSeason());
  const [ready, setReady] = useState(false);
  const [fromDb, setFromDb] = useState<number[]>([]);
  const [extra, setExtra] = useState<number[]>([]);

  useEffect(() => {
    const saved = Number(safeGet(LS_SEASON));
    if (Number.isInteger(saved) && saved > 1990) {
      setSeasonState(saved);
      writeCookie(saved);
    } else {
      writeCookie(currentSeason());
    }
    try {
      const e = JSON.parse(safeGet(LS_EXTRA) || "[]");
      if (Array.isArray(e)) setExtra(e.filter((x) => Number.isInteger(x)));
    } catch {}
    setReady(true);

    fetch("/api/seasons", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => Array.isArray(d.seasons) && setFromDb(d.seasons))
      .catch(() => {});
  }, []);

  const seasons = useMemo(() => {
    const set = new Set<number>([currentSeason(), season, ...fromDb, ...extra]);
    return [...set].sort((a, b) => b - a);
  }, [fromDb, extra, season]);

  const setSeason = useCallback((s: number) => {
    setSeasonState(s);
    safeSet(LS_SEASON, String(s));
    writeCookie(s);
  }, []);

  const addNextSeason = useCallback(() => {
    const next = Math.max(...seasons) + 1;
    const newExtra = [...new Set([...extra, next])];
    setExtra(newExtra);
    safeSet(LS_EXTRA, JSON.stringify(newExtra));
    setSeason(next);
  }, [seasons, extra, setSeason]);

  const value = useMemo(
    () => ({ season, ready, seasons, label: seasonLabel(season), setSeason, addNextSeason }),
    [season, ready, seasons, setSeason, addNextSeason]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
