// Cognome da mostrare dove c'è poco spazio.
// "Nick WOLTEMADE" -> "WOLTEMADE", "Randal KOLO MUANI" -> "KOLO MUANI", "Francisco Conceição" -> "Conceição"
export function shortName(name: string): string {
  const words = String(name || "").split(" ").filter(Boolean);
  const upper = words.filter((w) => w.length > 1 && w === w.toUpperCase());
  return upper.length ? upper.join(" ") : words[words.length - 1] || "";
}
