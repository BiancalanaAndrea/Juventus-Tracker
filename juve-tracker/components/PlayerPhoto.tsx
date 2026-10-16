"use client";

import { useEffect, useState } from "react";
import { photoImgStyle } from "@/lib/photo";

// Indirizzo "pulito": toglie gli spazi, passa da http a https (altrimenti il
// browser blocca l'immagine) e codifica gli spazi interni.
export function cleanPhotoUrl(url?: string | null): string | null {
  if (!url) return null;
  let u = url.trim().replace(/^["'<]+|["'>]+$/g, "");
  if (!u) return null;
  // link senza "https://" (es. "www.sito.it/foto.jpg") o che inizia con "//"
  if (u.startsWith("//")) u = "https:" + u;
  else if (!/^(https?:|data:|blob:|\/)/i.test(u)) u = "https://" + u;
  u = u.replace(/^http:\/\//i, "https://");

  // Google Drive: link di condivisione -> link diretto all'immagine
  const drive = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]+)/i);
  if (drive) return `https://drive.google.com/thumbnail?id=${drive[1]}&sz=w800`;

  // Dropbox: ?dl=0 mostra la pagina, ?raw=1 mostra la foto
  if (/dropbox\.com/i.test(u)) {
    try {
      const x = new URL(u);
      x.searchParams.delete("dl");
      x.searchParams.set("raw", "1");
      u = x.toString();
    } catch {}
  }

  return u.replace(/ /g, "%20").replace(/[^\x00-\x7F]/g, (c) => encodeURIComponent(c));
}

function initials(name?: string | null) {
  const words = String(name || "").split(" ").filter(Boolean);
  if (words.length === 0) return "?";
  const last = words[words.length - 1];
  return ((words[0][0] || "") + (words.length > 1 ? last[0] || "" : "")).toUpperCase();
}

/**
 * Foto del giocatore dentro il suo cerchio (il contenitore lo decide chi la usa).
 * - non invia il "referrer": molti siti bloccano le foto richieste da altri siti
 * - se la foto non si carica mostra le iniziali (o il numero di maglia) invece di un buco vuoto
 */
export default function PlayerPhoto({
  url,
  name,
  focusY,
  focusX,
  fallback,
  fallbackClassName = "text-sm",
}: {
  url?: string | null;
  name?: string | null;
  focusY?: number | null;
  focusX?: number | null;
  fallback?: string | number | null;
  fallbackClassName?: string;
}) {
  const direct = cleanPhotoUrl(url);
  // 0 = indirizzo originale, 1 = scaricata dal nostro server, 2 = tramite servizio di ridimensionamento
  // (aggira i blocchi dei siti e le foto troppo pesanti), 3 = non disponibile
  const [stage, setStage] = useState<0 | 1 | 2 | 3>(0);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setStage(0);
    setLoaded(false);
  }, [direct]);
  // se la foto non arriva entro pochi secondi (o arriva vuota) prova il metodo successivo
  useEffect(() => {
    if (!direct || loaded || stage >= 3) return;
    const t = setTimeout(() => setStage((st) => (st < 3 ? ((st + 1) as 0 | 1 | 2 | 3) : st)), 5000);
    return () => clearTimeout(t);
  }, [direct, loaded, stage]);

  const src = !direct
    ? null
    : stage === 1
    ? `/api/photo?u=${encodeURIComponent(direct)}`
    : stage === 2
    ? `https://wsrv.nl/?url=${encodeURIComponent(direct)}&w=600&h=600&fit=cover&a=attention&output=jpg`
    : direct;

  if (!src || stage === 3) {
    return (
      <span className={`flex h-full w-full items-center justify-center font-semibold text-white/80 ${fallbackClassName}`}>
        {fallback ?? initials(name)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={src}
      src={src}
      alt={name || ""}
      className="h-full w-full object-cover"
      style={photoImgStyle(focusY, focusX)}
      referrerPolicy="no-referrer"
      onLoad={(e) => {
        if ((e.currentTarget as HTMLImageElement).naturalWidth > 1) setLoaded(true);
        else setStage((st) => (st < 3 ? ((st + 1) as 0 | 1 | 2 | 3) : st));
      }}
      onError={() => setStage((st) => (st === 0 ? 1 : st === 1 ? 2 : 3))}
    />
  );
}
