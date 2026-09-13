import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Free/public ESPN soccer feed. No API token required.
const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer';
const TEAM_ID = '111'; // Juventus on ESPN

// ESPN exposes Juventus competitions through separate league slugs.
// We query them separately and merge the fixtures.
const COMPETITIONS = [
  { slug: 'ita.1', name: 'Serie A' },
  { slug: 'uefa.europa', name: 'Europa League' },
  { slug: 'ita.coppa_italia', name: 'Coppa Italia' },
  { slug: 'ita.super_cup', name: 'Supercoppa Italiana' },
  { slug: 'uefa.champions', name: 'Champions League' },
];

const seasonWindow = (season: string) => {
  const m = season.match(/(\d{4})\/(\d{2,4})/);
  if (!m) return { from: '2026-07-01', to: '2027-06-30' };
  const y = Number(m[1]);
  const y2 = m[2].length === 2 ? 2000 + Number(m[2]) : Number(m[2]);
  return { from: `${y}-07-01`, to: `${y2}-06-30` };
};

async function espn(path: string) {
  const r = await fetch(`${BASE}${path}`, { cache: 'no-store', headers: { Accept: 'application/json' } });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body?.message || `ESPN HTTP ${r.status}`);
  return body;
}

function arr(v: any) { return Array.isArray(v) ? v : []; }
function n(v: any) {
  if (typeof v === 'number') return v;
  const x = Number(String(v ?? '').replace('%', '').replace(',', '.'));
  return Number.isFinite(x) ? x : 0;
}
function seasonNumber(season: string) { return Number(String(season).slice(0, 4)) || new Date().getFullYear(); }
function inWindow(date: string, from: string, to: string) {
  const d = String(date || '').slice(0, 10);
  return d >= from && d <= to;
}
function competitionName(event: any) {
  return event?.competitions?.[0]?.league?.name
    || event?.league?.name
    || event?.season?.displayName
    || event?.season?.name
    || 'Competizione';
}
function competitionLogo(event: any) {
  return event?.competitions?.[0]?.league?.logos?.[0]?.href
    || event?.competitions?.[0]?.league?.logo
    || null;
}
function competitor(event: any, homeAway: 'home' | 'away') {
  return arr(event?.competitions?.[0]?.competitors).find((c: any) => c.homeAway === homeAway);
}
function juventusCompetitor(event: any) {
  return arr(event?.competitions?.[0]?.competitors).find((c: any) => String(c?.team?.id) === TEAM_ID);
}
function opponentCompetitor(event: any) {
  return arr(event?.competitions?.[0]?.competitors).find((c: any) => String(c?.team?.id) !== TEAM_ID);
}
function matchStatus(event: any) {
  const s = event?.competitions?.[0]?.status?.type;
  if (s?.completed) return 'completed';
  if (s?.state === 'in') return 'live';
  return 'scheduled';
}
function scoreOf(c: any) {
  const v = c?.score;
  if (v == null || v === '') return null;
  return n(v);
}
function statValue(stats: any[], aliases: string[]) {
  const wanted = aliases.map(x => x.toLowerCase());
  const item = arr(stats).find((s: any) => {
    const hay = `${s?.name || ''} ${s?.displayName || ''} ${s?.abbreviation || ''}`.toLowerCase();
    return wanted.some(a => hay === a || hay.includes(a));
  });
  return item?.value ?? item?.displayValue ?? 0;
}
function statsArray(obj: any) {
  return arr(obj?.statistics || obj?.stats || obj?.teamStats || obj?.athlete?.statistics);
}
function playerPhoto(athlete: any) {
  return athlete?.headshot?.href || athlete?.headshot?.url || athlete?.images?.[0]?.href || null;
}
function playerName(athlete: any) {
  return athlete?.displayName || athlete?.fullName || athlete?.shortName || athlete?.name || 'Giocatore';
}
function positionName(athlete: any) {
  return athlete?.position?.displayName || athlete?.position?.name || athlete?.position?.abbreviation || null;
}

function collectRosterPlayers(rosterResponse: any) {
  const groups = arr(rosterResponse?.athletes).length ? [{ items: rosterResponse.athletes }] : arr(rosterResponse?.athletesByPosition);
  const out: any[] = [];
  for (const group of groups) for (const item of arr(group?.items || group?.athletes || group)) {
    const athlete = item?.athlete || item;
    if (athlete?.id) out.push({ athlete, jersey: item?.jersey || athlete?.jersey });
  }
  return [...new Map(out.map(x => [String(x.athlete.id), x])).values()];
}

function collectMatchPlayers(summary: any) {
  const out: any[] = [];
  for (const teamBlock of arr(summary?.rosters)) {
    if (String(teamBlock?.team?.id) !== TEAM_ID) continue;
    for (const r of arr(teamBlock?.roster || teamBlock?.players)) {
      const athlete = r?.athlete || r;
      if (!athlete?.id) continue;
      out.push({
        athlete,
        starter: r?.starter === true || r?.starter === 'true' || r?.position?.abbreviation != null && r?.starter !== false,
        subbedIn: false,
        minutes: n(r?.minutesPlayed ?? r?.minutes ?? 0),
        stats: statsArray(r),
        raw: r,
      });
    }
  }
  for (const teamBlock of arr(summary?.boxscore?.players)) {
    if (String(teamBlock?.team?.id) !== TEAM_ID) continue;
    for (const group of arr(teamBlock?.statistics)) {
      for (const athleteBlock of arr(group?.athletes)) {
        const athlete = athleteBlock?.athlete || athleteBlock;
        if (!athlete?.id) continue;
        const existing = out.find(x => String(x.athlete.id) === String(athlete.id));
        if (existing) {
          existing.stats = arr(existing.stats).length ? existing.stats : statsArray(athleteBlock);
          existing.raw = existing.raw || athleteBlock;
        } else {
          out.push({ athlete, starter: athleteBlock?.starter === true, subbedIn: false, minutes: n(athleteBlock?.minutesPlayed ?? athleteBlock?.minutes ?? 0), stats: statsArray(athleteBlock), raw: athleteBlock });
        }
      }
    }
  }
  return [...new Map(out.map(x => [String(x.athlete.id), x])).values()];
}

function playerMetric(stats: any[], aliases: string[]) { return n(statValue(stats, aliases)); }

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

    const { data: settings } = await supabase.from('tracker_settings').select('*').eq('user_id', user.id).single();
    const season = settings?.season || '2026/27';
    const { from, to } = seasonWindow(season);

    // Current Juventus roster. Serie A is the canonical team feed for the squad.
    const rosterResponse = await espn(`/ita.1/teams/${TEAM_ID}/roster`);
    const roster = collectRosterPlayers(rosterResponse);

    // Current injury report, when ESPN exposes it.
    let injuries: any[] = [];
    try {
      const injuryResponse = await espn(`/ita.1/teams/${TEAM_ID}/injuries`);
      injuries = arr(injuryResponse?.injuries || injuryResponse?.items || injuryResponse);
    } catch { /* injury feed can be unavailable; the rest of the sync must continue */ }

    for (const item of roster) {
      const p = item.athlete;
      const injury = injuries.find((x: any) => String(x?.athlete?.id || x?.player?.id || x?.id) === String(p.id));
      const statusText = injury ? `Indisponibile${injury?.details?.returnDate ? ` fino al ${new Date(injury.details.returnDate).toLocaleDateString('it-IT')}` : ''}` : null;
      const { error } = await supabase.from('players').upsert({
        user_id: user.id,
        external_id: String(p.id),
        name: playerName(p),
        short_name: p?.shortName || p?.displayName || playerName(p),
        number: item.jersey != null ? Number(item.jersey) : (p?.jersey != null ? Number(p.jersey) : null),
        position: positionName(p),
        photo_url: playerPhoto(p),
        active: true,
        injury_status: statusText,
        injury_return_date: injury?.details?.returnDate || null,
        injury_category: injury?.type || injury?.details?.type || null,
      }, { onConflict: 'user_id,external_id' });
      if (error) throw new Error(`Rosa: ${error.message}`);
    }

    // ESPN does not have a valid generic /all league endpoint.
    // Fetch Juventus' schedule once for each competition and merge by event id.
    const eventMap = new Map<string, any>();
    for (const competition of COMPETITIONS) {
      try {
        const schedule = await espn(`/${competition.slug}/teams/${TEAM_ID}/schedule?fixture=true`);
        for (const e of arr(schedule?.events)) {
          if (!inWindow(e?.date, from, to)) continue;
          const copy = { ...e, __leagueSlug: competition.slug };
          eventMap.set(String(e.id), copy);
        }
      } catch {
        // A competition may have no Juventus schedule/feed for this season.
      }
    }
    const uniqueEvents = [...eventMap.values()];

    let saved = 0;
    for (const event of uniqueEvents) {
      const leagueSlug = event?.__leagueSlug || event?.competitions?.[0]?.league?.slug || 'ita.1';
      let summary: any = null;
      try {
        summary = await espn(`/${leagueSlug}/summary?event=${encodeURIComponent(event.id)}`);
      } catch {
        // Some future fixtures have no summary yet. The fixture itself is still saved.
      }

      const ev = summary?.header?.competitions?.[0] ? { ...event, competitions: summary.header.competitions } : event;
      const juve = juventusCompetitor(ev);
      const opp = opponentCompetitor(ev);
      const home = juve?.homeAway === 'home';
      const row = {
        user_id: user.id,
        external_id: String(event.id),
        season,
        competition: competitionName(ev),
        competition_logo_url: competitionLogo(ev),
        match_date: event.date,
        opponent: opp?.team?.displayName || opp?.team?.shortDisplayName || 'Avversario',
        opponent_logo_url: opp?.team?.logo || opp?.team?.logos?.[0]?.href || null,
        venue: event?.competitions?.[0]?.venue?.fullName || event?.competitions?.[0]?.venue?.address?.city || null,
        status: matchStatus(ev),
        juve_score: home ? scoreOf(juve) : scoreOf(opp),
        opponent_score: home ? scoreOf(opp) : scoreOf(juve),
        raw_provider_json: summary || event,
      };
      const { data: match, error: matchError } = await supabase.from('matches').upsert(row, { onConflict: 'user_id,external_id' }).select('id').single();
      if (matchError) throw new Error(`Partita: ${matchError.message}`);
      saved++;

      if (!summary) continue;

      const dbPlayers = await supabase.from('players').select('id,external_id').eq('user_id', user.id);
      const idMap = new Map((dbPlayers.data ?? []).map((p: any) => [String(p.external_id), p.id]));
      const matchPlayers = collectMatchPlayers(summary);

      // If ESPN gives a match roster, import starters and bench. Existing user ratings are preserved.
      for (const mp of matchPlayers) {
        const pid = idMap.get(String(mp.athlete.id));
        if (!pid) continue;
        const stats = arr(mp.stats);
        const minutes = Math.round(playerMetric(stats, ['minutes', 'min']));
        const started = mp.starter === true;
        await supabase.from('match_players').upsert({
          user_id: user.id,
          match_id: match.id,
          player_id: pid,
          started,
          bench: !started,
          minutes,
        }, { onConflict: 'match_id,player_id' });

        await supabase.from('player_match_stats').upsert({
          user_id: user.id,
          match_id: match.id,
          player_id: pid,
          appearances: minutes > 0 || started ? 1 : 0,
          minutes,
          goals: Math.round(playerMetric(stats, ['goals'])),
          assists: Math.round(playerMetric(stats, ['assists'])),
          shots: Math.round(playerMetric(stats, ['shots', 'total shots'])),
          shots_on_target: Math.round(playerMetric(stats, ['shots on target', 'shots on goal'])),
          xg: playerMetric(stats, ['expected goals', 'xg']),
          xa: playerMetric(stats, ['expected assists', 'xa']),
          chances_created: Math.round(playerMetric(stats, ['chances created', 'key passes'])),
          successful_dribbles: Math.round(playerMetric(stats, ['successful dribbles', 'dribbles completed'])),
          duels_won: Math.round(playerMetric(stats, ['duels won', 'won'])) ,
          recoveries: Math.round(playerMetric(stats, ['recoveries'])),
          yellow_cards: Math.round(playerMetric(stats, ['yellow cards', 'yellow'])),
          red_cards: Math.round(playerMetric(stats, ['red cards', 'red'])),
          raw_provider_json: mp.raw,
        }, { onConflict: 'match_id,player_id' });
      }

      // Team statistics from ESPN boxscore. Names vary slightly by competition, so aliases are used.
      const teamBox = arr(summary?.boxscore?.teams).find((t: any) => String(t?.team?.id) === TEAM_ID);
      const teamStats = statsArray(teamBox);
      const xg = playerMetric(teamStats, ['expected goals', 'xg']);
      await supabase.from('match_team_stats').upsert({
        user_id: user.id,
        match_id: match.id,
        possession: playerMetric(teamStats, ['possession', 'possession pct', 'possession percentage']),
        xg,
        shots: Math.round(playerMetric(teamStats, ['shots', 'total shots'])),
        shots_on_target: Math.round(playerMetric(teamStats, ['shots on target', 'shots on goal'])),
        corners: Math.round(playerMetric(teamStats, ['corners'])),
        offsides: Math.round(playerMetric(teamStats, ['offsides'])),
        passes: Math.round(playerMetric(teamStats, ['passes', 'total passes'])),
        successful_passes: Math.round(playerMetric(teamStats, ['successful passes', 'passes completed'])),
        pass_accuracy: playerMetric(teamStats, ['pass accuracy', 'passing accuracy']),
        tackles: Math.round(playerMetric(teamStats, ['tackles'])),
        interceptions: Math.round(playerMetric(teamStats, ['interceptions'])),
        fouls: Math.round(playerMetric(teamStats, ['fouls'])),
        yellow_cards: Math.round(playerMetric(teamStats, ['yellow cards', 'yellow'])),
        red_cards: Math.round(playerMetric(teamStats, ['red cards', 'red'])),
        saves: Math.round(playerMetric(teamStats, ['saves'])),
        raw_provider_json: teamBox || null,
      }, { onConflict: 'match_id' });
    }

    await supabase.from('sync_runs').insert({
      user_id: user.id,
      provider: 'espn',
      finished_at: new Date().toISOString(),
      status: 'completed',
      message: `Sincronizzate ${saved} partite e ${roster.length} giocatori.`,
    });

    return NextResponse.json({ ok: true, savedMatches: saved, squad: roster.length, injuries: injuries.length, provider: 'espn' });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Errore di sincronizzazione' }, { status: 500 });
  }
}
