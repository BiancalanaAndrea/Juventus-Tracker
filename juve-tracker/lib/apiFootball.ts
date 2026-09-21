// Wrapper minimale per API-Football (https://www.api-football.com/documentation-v3)
// La chiave resta sempre lato server: queste funzioni vengono chiamate SOLO
// dalle API routes di Next.js (app/api/...), mai dal browser.

const BASE_URL = "https://v3.football.api-sports.io";

async function callApi(path: string, params: Record<string, string | number>) {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("Variabile API_FOOTBALL_KEY mancante (vedi .env.example)");

  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
  );
  const res = await fetch(`${BASE_URL}${path}?${qs.toString()}`, {
    headers: { "x-apisports-key": key },
    // niente cache: i dati cambiano; la "cache" vera è il nostro database Supabase
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`API-Football error ${res.status} su ${path}`);
  }
  const json = await res.json();
  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(`API-Football errors: ${JSON.stringify(json.errors)}`);
  }
  return json.response as unknown[];
}

// Tutte le partite di una squadra in una stagione (facoltativo: filtro per lega)
export function getFixturesByTeam(teamApiId: number, season: number, leagueApiId?: number) {
  const params: Record<string, string | number> = { team: teamApiId, season };
  if (leagueApiId) params.league = leagueApiId;
  return callApi("/fixtures", params);
}

// Statistiche di squadra per una singola partita
export function getFixtureTeamStatistics(fixtureApiId: number) {
  return callApi("/fixtures/statistics", { fixture: fixtureApiId });
}

// Statistiche dei singoli giocatori per una partita
export function getFixturePlayersStatistics(fixtureApiId: number) {
  return callApi("/fixtures/players", { fixture: fixtureApiId });
}

// Rosa attuale della squadra
export function getSquad(teamApiId: number) {
  return callApi("/players/squads", { team: teamApiId });
}

// Classifica di un campionato (es. Serie A)
export function getStandings(leagueApiId: number, season: number) {
  return callApi("/standings", { league: leagueApiId, season });
}

// ID ufficiali API-Football utili per l'Italia / competizioni europee
// (verificabili su https://www.api-football.com/documentation-v3#tag/Leagues)
export const LEAGUE_IDS = {
  SERIE_A: 135,
  COPPA_ITALIA: 137,
  EUROPA_LEAGUE: 3,
};
