// Orari delle partite: salvati e mostrati come "ora scritta da te" (ora italiana),
// senza conversioni di fuso orario. Così l'orario che inserisci è sempre quello che vedi,
// qualunque sia il dispositivo (telefono, PC, server).

/** "2026-08-29T20:45" (campo del form) -> valore da salvare */
export function fromInput(local: string): string {
  return `${local.slice(0, 16)}:00.000Z`;
}

/** valore salvato -> "2026-08-29T20:45" per il campo del form */
export function toInput(iso: string | null | undefined): string {
  return iso ? new Date(iso).toISOString().slice(0, 16) : "";
}

/** formatta senza spostare l'orario */
export function fmt(iso: string, opts: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleString("it-IT", { ...opts, timeZone: "UTC" });
}
