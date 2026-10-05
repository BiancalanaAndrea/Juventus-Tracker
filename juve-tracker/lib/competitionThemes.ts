export interface CompetitionTheme {
  bg: string; // sfondo pagina
  surface: string; // sfondo delle card/elementi
  text: string; // colore testo principale su bg
  textMuted: string; // colore testo secondario su bg
  accent: string; // colore di accento (tab attivo, bottoni, dettagli)
  accentText: string; // colore testo leggibile sopra "accent"
  label: string;
}

// Tutti i temi condividono lo stesso stile "scuro e deciso" (quello che
// prima era solo dell'Europa League), ognuno con la sua identità cromatica.
export const THEMES: Record<string, CompetitionTheme> = {
  all: {
    // bianconero Juventus: nero profondo, dettagli oro
    bg: "#141414",
    surface: "#232323",
    text: "#F7F7F5",
    textMuted: "#B8B8B5",
    accent: "#C9A648",
    accentText: "#141414",
    label: "Tutte",
  },
  serie_a: {
    // verde Serie A
    bg: "#141414",
    surface: "#232323",
    text: "#F2FBF6",
    textMuted: "#B9D6C6",
    accent: "#1FA35C",
    accentText: "#0E1F16",
    label: "Serie A",
  },
  europa_league: {
    // nero e arancione UEFA Europa League (stile originale, invariato)
    bg: "#141414",
    surface: "#232323",
    text: "#FFFFFF",
    textMuted: "#C9C9C9",
    accent: "#FF6A13",
    accentText: "#161616",
    label: "Europa League",
  },
  coppa_italia: {
    // blu e oro Coppa Italia
    bg: "#141414",
    surface: "#232323",
    text: "#F3F7FF",
    textMuted: "#B7C6E3",
    accent: "#3E8EDE",
    accentText: "#0D1B33",
    label: "Coppa Italia",
  },
};

export function getTheme(shortName?: string | null): CompetitionTheme {
  return THEMES[shortName || "all"] || THEMES.all;
}

// Stesso motivo di sfondo della Dashboard (righe diagonali sottili + bagliore
// d'accento in alto a destra), ma calcolato sui colori del tema attivo così
// Serie A / Europa League / Coppa Italia mantengono la propria identità.
export function getPageBackground(theme: CompetitionTheme): {
  backgroundColor: string;
  backgroundImage: string;
  backgroundAttachment: "fixed";
} {
  return {
    backgroundColor: "#141414",
    backgroundImage: `repeating-linear-gradient(115deg, #F7F7F50D 0px, #F7F7F50D 1px, transparent 1px, transparent 46px), radial-gradient(circle at 100% 0%, ${theme.accent}33, transparent 45%)`,
    backgroundAttachment: "fixed",
  };
}
