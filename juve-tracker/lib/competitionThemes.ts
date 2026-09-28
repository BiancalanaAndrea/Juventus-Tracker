export interface CompetitionTheme {
  bg: string; // sfondo pagina
  surface: string; // sfondo delle card/elementi
  text: string; // colore testo principale su bg
  accent: string; // colore di accento (tab attivo, bottoni, dettagli)
  accentText: string; // colore testo leggibile sopra "accent"
  label: string;
}

export const THEMES: Record<string, CompetitionTheme> = {
  all: {
    bg: "#F7F7F5",
    surface: "#FFFFFF",
    text: "#0A0A0A",
    accent: "#0A0A0A",
    accentText: "#F7F7F5",
    label: "Tutte",
  },
  serie_a: {
    // verde Serie A
    bg: "#F2F9F5",
    surface: "#FFFFFF",
    text: "#0A2E1F",
    accent: "#0B6E4F",
    accentText: "#FFFFFF",
    label: "Serie A",
  },
  europa_league: {
    // nero e arancione UEFA Europa League
    bg: "#161616",
    surface: "#232323",
    text: "#F5F5F5",
    accent: "#FF6A13",
    accentText: "#161616",
    label: "Europa League",
  },
  coppa_italia: {
    // blu e oro Coppa Italia
    bg: "#F1F5FB",
    surface: "#FFFFFF",
    text: "#0E2A4D",
    accent: "#12407A",
    accentText: "#FFFFFF",
    label: "Coppa Italia",
  },
};

export function getTheme(shortName?: string | null): CompetitionTheme {
  return THEMES[shortName || "all"] || THEMES.all;
}
