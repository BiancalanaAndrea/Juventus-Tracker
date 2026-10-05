// Scala colori dei voti (0-10). Colori spenti, non fluo: il 10 è un verde scuro
// profondo, il 6 un giallino, dal 5 in giù rossi sempre più pesanti fino allo 0.
const STOPS: { v: number; rgb: [number, number, number] }[] = [
  { v: 0, rgb: [74, 16, 22] }, // rosso scurissimo
  { v: 1, rgb: [102, 22, 30] },
  { v: 2, rgb: [130, 30, 38] },
  { v: 3, rgb: [156, 42, 46] },
  { v: 4, rgb: [178, 58, 54] },
  { v: 5, rgb: [200, 84, 66] }, // inizio dei rossi (più chiaro)
  { v: 6, rgb: [226, 196, 82] }, // giallino: sufficiente, senza lode né infamia
  { v: 7, rgb: [150, 190, 96] }, // verde chiaro
  { v: 8, rgb: [74, 160, 98] },
  { v: 9, rgb: [26, 120, 72] },
  { v: 10, rgb: [8, 82, 44] }, // verde scuro profondo: il voto migliore
];

export function ratingColors(rating: number): { bg: string; text: string } {
  const r = Math.max(0, Math.min(10, rating));
  const lo = Math.min(9, Math.floor(r));
  const a = STOPS[lo];
  const b = STOPS[lo + 1];
  const t = r - lo;
  const rgb = a.rgb.map((c, i) => Math.round(c + (b.rgb[i] - c) * t));
  // testo bianco sui colori scuri, scuro sui colori chiari (giallo, verde chiaro)
  const lum = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  return {
    bg: `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
    text: lum > 0.58 ? "#1a1a1a" : "#FFFFFF",
  };
}
