import type { CSSProperties } from "react";

// Stile della foto nel cerchio. Il valore verticale salvato (0-100) viene
// alzato di qualche punto per inquadrare meglio il viso; quello orizzontale
// (0 = sinistra, 100 = destra, 50 se non impostato) sposta l'immagine
// ingrandita anche quando la foto è "in piedi" e non avrebbe margine laterale.
// Usato sia nell'anteprima sia in tutte le pagine, così quello che vedi mentre
// regoli è identico a quello che vedrai in app.
export const PHOTO_OFFSET = 17;
const ZOOM = 1.25;

export function photoImgStyle(focusY?: number | null, focusX?: number | null): CSSProperties {
  const y = Math.max(0, Math.min(100, (focusY ?? 25) - PHOTO_OFFSET));
  const x = Math.max(0, Math.min(100, focusX ?? 50));
  // con zoom 1.25 ci sono 12.5% di margine per lato: x=0 → +12.5%, x=100 → -12.5%
  const tx = ((50 - x) / 50) * ((ZOOM - 1) / 2) * 100;
  return {
    objectPosition: `${x}% ${y}%`,
    transform: `translateX(${tx}%) scale(${ZOOM})`,
    transformOrigin: "50% 0%",
  };
}
