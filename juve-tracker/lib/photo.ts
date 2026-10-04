// Posizione effettiva della foto nel cerchio. Il valore verticale salvato per
// ogni giocatore (0-100) viene alzato di qualche punto per inquadrare meglio
// il viso; il valore orizzontale (0 = sinistra, 100 = destra) vale 50 se non
// è stato impostato. Usato sia nell'anteprima sia in tutte le pagine, così
// quello che vedi mentre regoli è identico a quello che vedrai in app.
export const PHOTO_OFFSET = 17;

export function photoObjectPosition(focusY?: number | null, focusX?: number | null): string {
  const y = Math.max(0, Math.min(100, (focusY ?? 25) - PHOTO_OFFSET));
  const x = Math.max(0, Math.min(100, focusX ?? 50));
  return `${x}% ${y}%`;
}
