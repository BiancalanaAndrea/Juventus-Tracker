"use client";

import { useEffect, useState } from "react";
import { photoImgStyle } from "@/lib/photo";

// Indirizzo "pulito": toglie gli spazi, passa da http a https (altrimenti il
// browser blocca l'immagine) e codifica gli spazi interni.
export function cleanPhotoUrl(url?: string | null): string | null {
  if (!url) return null;
  const u = url.trim();
  if (!u) return null;
  return u.replace(/^http:\/\//i, "https://").replace(/ /g, "%20");
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
  const src = cleanPhotoUrl(url);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);

  if (!src || failed) {
    return (
      <span className={`flex h-full w-full items-center justify-center font-semibold text-white/80 ${fallbackClassName}`}>
        {fallback ?? initials(name)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name || ""}
      className="h-full w-full object-cover"
      style={photoImgStyle(focusY, focusX)}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
