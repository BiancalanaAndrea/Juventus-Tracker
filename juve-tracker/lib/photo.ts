// Posizione verticale effettiva della foto nel cerchio. Il valore salvato per
// ogni giocatore (0-100) viene alzato di qualche punto per inquadrare meglio
// il viso; usato sia nell'anteprima del selettore sia in tutte le pagine, così
// quello che vedi mentre regoli è identico a quello che vedrai in app.
export const PHOTO_OFFSET = 7;

export function photoObjectPosition(focusY?: number | null): string {
  const v = focusY ?? 25;
  const y = Math.max(0, Math.min(100, v - PHOTO_OFFSET));
  return `center ${y}%`;
}
