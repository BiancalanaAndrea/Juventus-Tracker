import { supabaseServer } from "@/lib/supabase";
import {
  getFixturesByTeam,
  getFixtureTeamStatistics,
  getFixturePlayersStatistics,
  getStandings,
  getSquad,
  LEAGUE_IDS,
} from "@/lib/apiFootball";

// Logica di sincronizzazione condivisa, usata sia dal cron giornaliero
// automatico sia dal pulsante "Sincronizza ora" nelle Impostazioni.
export async function runSync() {
  const db = supabaseServer();
  const season = Number(process.env.SEASON_YEAR || "2026");
  const juveApiId = Number(process.env.JUVENTUS_API_ID || "496");

  const log: string[] = [];

  try {
    // 1) Assicura che le 3 competizioni esistano in tabella
    const competitions = [
      { api_id: LEAGUE_IDS.SERIE_A, name: "Serie A", short_name: "serie_a" },
      { api_id: LEAGUE_IDS.COPPA_ITALIA, name: "Coppa Italia", short_name: "coppa_italia" },
      { api_id: LEAGUE_IDS.EUROPA_LEAGUE, name: "UEFA Europa League", short_name: "europa_league" },
    ];
    for (const c of competitions) {
      await db.from("competitions").upsert(c, { onConflict: "api_id" });
    }
    const { data: compRows } = await db.from("competitions").select("id, api_id");
    const compIdByApiId = new Map((compRows || []).map((c) => [c.api_id, c.id]));

    // 2) Scarica le partite per ognuna delle 3 competizioni e le salva/aggiorna
    for (const league of Object.values(LEAGUE_IDS)) {
      const fixtures = (await getFixturesByTeam(juveApiId, season, league)) as any[];
      for (const f of fixtures) {
        const homeApiId = f.teams.home.id;
        const awayApiId = f.teams.away.id;

        // upsert squadre coinvolte
        await db.from("teams").upsert(
          [
            { api_id: homeApiId, name: f.teams.home.name, logo_url: f.teams.home.logo },
            { api_id: awayApiId, name: f.teams.away.name, logo_url: f.teams.away.logo },
          ],
          { onConflict: "api_id" }
        );
        const { data: teamRows } = await db
          .from("teams")
          .select("id, api_id")
          .in("api_id", [homeApiId, awayApiId]);
        const teamIdByApiId = new Map((teamRows || []).map((t) => [t.api_id, t.id]));

        const statusMap: Record<string, string> = {
          FT: "FINISHED",
          AET: "FINISHED",
          PEN: "FINISHED",
          NS: "SCHEDULED",
          "1H": "LIVE",
          "2H": "LIVE",
          HT: "LIVE",
          PST: "POSTPONED",
        };

        const matchRow = {
          api_id: f.fixture.id,
          competition_id: compIdByApiId.get(league),
          matchday: f.league.round,
          match_date: f.fixture.date,
          venue: f.fixture.venue?.name || null,
          home_team_id: teamIdByApiId.get(homeApiId),
          away_team_id: teamIdByApiId.get(awayApiId),
          home_score: f.goals.home,
          away_score: f.goals.away,
          status: statusMap[f.fixture.status.short] || "SCHEDULED",
          is_home: homeApiId === juveApiId,
        };

        // Non sovrascrivere campi modificati manualmente dall'utente (notes)
        const { data: existing } = await db
          .from("matches")
          .select("id, updated_manually")
          .eq("api_id", f.fixture.id)
          .maybeSingle();

        if (existing) {
          await db.from("matches").update(matchRow).eq("id", existing.id);
        } else {
          await db.from("matches").insert(matchRow);
        }

        // 3) Se la partita è FINITA, importa anche le statistiche (squadra + giocatori)
        if (matchRow.status === "FINISHED") {
          const { data: savedMatch } = await db
            .from("matches")
            .select("id")
            .eq("api_id", f.fixture.id)
            .single();
          if (savedMatch) {
            await syncMatchStats(db, savedMatch.id, f.fixture.id, teamIdByApiId);
          }
        }
      }
      log.push(`Competizione ${league}: ${fixtures.length} partite sincronizzate`);
    }

    // 4) Classifica Serie A
    const standings = (await getStandings(LEAGUE_IDS.SERIE_A, season)) as any[];
    const table = standings[0]?.league?.standings?.[0] || [];
    for (const row of table) {
      await db.from("teams").upsert(
        { api_id: row.team.id, name: row.team.name, logo_url: row.team.logo },
        { onConflict: "api_id" }
      );
      const { data: t } = await db.from("teams").select("id").eq("api_id", row.team.id).single();
      if (t) {
        await db.from("standings").upsert(
          {
            competition_id: compIdByApiId.get(LEAGUE_IDS.SERIE_A),
            position: row.rank,
            team_id: t.id,
            played: row.all.played,
            won: row.all.win,
            drawn: row.all.draw,
            lost: row.all.lose,
            goals_for: row.all.goals.for,
            goals_against: row.all.goals.against,
            points: row.points,
          },
          { onConflict: "competition_id,team_id" }
        );
      }
    }
    log.push(`Classifica Serie A: ${table.length} squadre aggiornate`);

    // 5) Rosa Juventus (giocatori)
    const squad = (await getSquad(juveApiId)) as any[];
    const players = squad[0]?.players || [];
    for (const p of players) {
      const posMap: Record<string, string> = {
        Goalkeeper: "GK",
        Defender: "DF",
        Midfielder: "MF",
        Attacker: "FW",
      };
      await db.from("players").upsert(
        {
          api_id: p.id,
          name: p.name,
          position: posMap[p.position] || "MF",
          shirt_number: p.number,
          photo_url: p.photo,
        },
        { onConflict: "api_id" }
      );
    }
    log.push(`Rosa: ${players.length} giocatori aggiornati`);

    return { ok: true, log };
  } catch (err: any) {
    return { ok: false, error: err.message, log };
  }
}

async function syncMatchStats(
  db: ReturnType<typeof supabaseServer>,
  matchId: number,
  fixtureApiId: number,
  teamIdByApiId: Map<number, number>
) {
  // già importate? evita di rifare le chiamate ogni giorno per partite vecchie
  const { count } = await db
    .from("match_team_stats")
    .select("id", { count: "exact", head: true })
    .eq("match_id", matchId);
  if (count && count > 0) return;

  const teamStats = (await getFixtureTeamStatistics(fixtureApiId)) as any[];
  for (const ts of teamStats) {
    const teamId = teamIdByApiId.get(ts.team.id);
    if (!teamId) continue;
    const find = (type: string) => ts.statistics.find((s: any) => s.type === type)?.value;
    await db.from("match_team_stats").upsert(
      {
        match_id: matchId,
        team_id: teamId,
        possession: parsePercent(find("Ball Possession")),
        shots_total: toInt(find("Total Shots")),
        shots_on_target: toInt(find("Shots on Goal")),
        shots_off_target: toInt(find("Shots off Goal")),
        corners: toInt(find("Corner Kicks")),
        fouls: toInt(find("Fouls")),
        yellow_cards: toInt(find("Yellow Cards")),
        red_cards: toInt(find("Red Cards")),
        offsides: toInt(find("Offsides")),
        passes_total: toInt(find("Total passes")),
        passes_accuracy: parsePercent(find("Passes %")),
      },
      { onConflict: "match_id,team_id" }
    );
  }

  const playerStats = (await getFixturePlayersStatistics(fixtureApiId)) as any[];
  for (const teamBlock of playerStats) {
    for (const pl of teamBlock.players) {
      const { data: playerRow } = await db
        .from("players")
        .select("id")
        .eq("api_id", pl.player.id)
        .maybeSingle();
      if (!playerRow) continue; // giocatore avversario, non tracciato
      const s = pl.statistics[0];
      await db.from("match_player_stats").upsert(
        {
          match_id: matchId,
          player_id: playerRow.id,
          minutes_played: s.games.minutes || 0,
          goals: s.goals.total || 0,
          assists: s.goals.assists || 0,
          shots_total: s.shots.total || 0,
          shots_on_target: s.shots.on || 0,
          passes_total: s.passes.total || 0,
          passes_key: s.passes.key || 0,
          tackles: s.tackles?.total || 0,
          fouls_committed: s.fouls?.committed || 0,
          fouls_suffered: s.fouls?.drawn || 0,
          yellow_cards: s.cards.yellow || 0,
          red_cards: s.cards.red || 0,
          saves: s.goals.saves || 0,
          goals_conceded: s.goals.conceded || 0,
          is_starter: s.games.substitute === false,
        },
        { onConflict: "match_id,player_id" }
      );
    }
  }
}

function toInt(v: unknown) {
  const n = parseInt(String(v ?? "0"), 10);
  return isNaN(n) ? 0 : n;
}
function parsePercent(v: unknown) {
  if (!v) return null;
  const n = parseInt(String(v).replace("%", ""), 10);
  return isNaN(n) ? null : n;
}
