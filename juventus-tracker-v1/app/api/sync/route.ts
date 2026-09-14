import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BASE = 'https://v3.football.api-sports.io';
const JUVE_ID = '496';
const SEASON = '2026';

type ApiResponse = { response?: any[]; results?: number; errors?: any; paging?: { current?: number; total?: number } };

async function api(path: string, key: string): Promise<ApiResponse> {
  const r = await fetch(`${BASE}${path}`, {
    headers: { 'x-apisports-key': key },
    cache: 'no-store',
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body?.errors?.message || body?.message || `API-Football HTTP ${r.status}`);
  if (body?.errors && Object.keys(body.errors).length) throw new Error(JSON.stringify(body.errors));
  return body;
}

function arr(v: any) { return Array.isArray(v) ? v : []; }
function roleGroup(position: string | null) {
  if (position === 'Goalkeeper') return 'GK';
  if (position === 'Defender') return 'DF';
  if (position === 'Midfielder') return 'MF';
  return 'FW';
}
function num(v: any) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function nullableNum(v: any) { const n = Number(v); return Number.isFinite(n) ? n : null; }
function fixtureStatus(f: any) {
  const s = f?.fixture?.status?.short;
  if (['FT','AET','PEN'].includes(s)) return 'completed';
  if (['1H','HT','2H','ET','BT','P'].includes(s)) return 'live';
  return 'scheduled';
}
function competitionName(f: any) { return f?.league?.name || 'Competizione'; }
function playerIdFromLineup(p: any) { return p?.player?.id != null ? String(p.player.id) : null; }
function playerNameFromLineup(p: any) { return p?.player?.name || p?.player?.shortname || 'Giocatore'; }

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const { data: settings } = await supabase
    .from('tracker_settings')
    .select('provider,season,football_api_key')
    .eq('user_id', user.id)
    .maybeSingle();

  const key = settings?.football_api_key?.trim();
  if (!key) return NextResponse.json({ error: 'Inserisci prima la API Key di API-Football nelle Impostazioni.' }, { status: 400 });
  if ((settings?.provider || 'api-football') !== 'api-football') {
    return NextResponse.json({ error: 'Il provider deve essere API-Football.' }, { status: 400 });
  }

  const season = Number(String(settings?.season || '2026/27').slice(0, 4)) || 2026;
  const run = await supabase.from('sync_runs').insert({ user_id: user.id, provider: 'api-football', status: 'running' }).select('id').maybeSingle();
  const runId = run.data?.id;

  try {
    // 1) Squad: one or two paginated calls depending on roster size.
    const roster: any[] = [];
    for (let page = 1; page <= 3; page++) {
      const data = await api(`/players?team=${JUVE_ID}&season=${season}&page=${page}`, key);
      roster.push(...arr(data.response));
      if (!data.paging || Number(data.paging.current || page) >= Number(data.paging.total || page)) break;
    }

    for (const item of roster) {
      const p = item?.player || {};
      const stats = arr(item?.statistics)[0] || {};
      const team = stats?.team || {};
      const row = {
        user_id: user.id,
        external_id: String(p.id),
        name: p.name || 'Giocatore',
        short_name: p.firstname && p.lastname ? `${p.firstname} ${p.lastname}` : p.name,
        number: nullableNum(stats?.games?.number),
        position: stats?.games?.position || null,
        role_group: roleGroup(stats?.games?.position || null),
        photo_url: p.photo || null,
        active: true,
        injury_status: p.injured ? 'Indisponibile' : null,
      } as any;
      await supabase.from('players').upsert(row, { onConflict: 'user_id,external_id' });
    }

    // 2) Current injuries. The response is merged into the player cards.
    try {
      const inj = await api(`/injuries?team=${JUVE_ID}&season=${season}`, key);
      for (const item of arr(inj.response)) {
        const p = item?.player;
        if (!p?.id) continue;
        const status = item?.player?.reason || item?.player?.type || item?.player?.status || 'Indisponibile';
        await supabase.from('players').update({
          injury_status: status,
          injury_category: item?.player?.type || null,
          injury_return_date: null,
        }).eq('user_id', user.id).eq('external_id', String(p.id));
      }
    } catch { /* injuries are optional */ }

    // 3) Full Juventus season fixture list. One call covers all competitions.
    const fixturesData = await api(`/fixtures?team=${JUVE_ID}&season=${season}`, key);
    const fixtures = arr(fixturesData.response);
    let savedMatches = 0;

    for (const f of fixtures) {
      const fixtureId = String(f?.fixture?.id);
      if (!fixtureId) continue;
      const home = String(f?.teams?.home?.id) === JUVE_ID;
      const juve = home ? f.teams.home : f.teams.away;
      const opp = home ? f.teams.away : f.teams.home;
      const matchRow = {
        user_id: user.id,
        external_id: fixtureId,
        season: `${season}/${String(season + 1).slice(-2)}`,
        competition: competitionName(f),
        competition_logo_url: f?.league?.logo || null,
        match_date: f?.fixture?.date,
        opponent: opp?.name || 'Avversario',
        opponent_logo_url: opp?.logo || null,
        venue: f?.fixture?.venue?.name || null,
        status: fixtureStatus(f),
        juve_score: nullableNum(juve?.goals),
        opponent_score: nullableNum(opp?.goals),
        raw_provider_json: f,
      } as any;

      const { data: saved, error: matchError } = await supabase
        .from('matches')
        .upsert(matchRow, { onConflict: 'user_id,external_id' })
        .select('id')
        .single();
      if (matchError || !saved) continue;
      savedMatches++;

      // API-Football can return events, lineups, team statistics and player statistics
      // together from /fixtures?id=...; this keeps the free quota manageable.
      if (fixtureStatus(f) === 'scheduled' && new Date(f.fixture.date).getTime() > Date.now()) continue;
      let detail: any;
      try { detail = (await api(`/fixtures?id=${fixtureId}`, key)).response?.[0]; } catch { continue; }
      if (!detail) continue;

      await supabase.from('matches').update({
        status: fixtureStatus(detail),
        juve_score: nullableNum((home ? detail.teams?.home?.goals : detail.teams?.away?.goals)),
        opponent_score: nullableNum((home ? detail.teams?.away?.goals : detail.teams?.home?.goals)),
        raw_provider_json: detail,
      }).eq('id', saved.id).eq('user_id', user.id);

      const lineups = arr(detail.lineups);
      const juveLineup = lineups.find((x: any) => String(x?.team?.id) === JUVE_ID);
      const lineupPlayers = [...arr(juveLineup?.startXI), ...arr(juveLineup?.substitutes)];

      for (const lp of lineupPlayers) {
        const ext = playerIdFromLineup(lp);
        if (!ext) continue;
        const name = playerNameFromLineup(lp);
        const { data: existing } = await supabase.from('players').select('id').eq('user_id', user.id).eq('external_id', ext).maybeSingle();
        let playerId = existing?.id;
        if (!playerId) {
          const { data: inserted } = await supabase.from('players').insert({
            user_id: user.id, external_id: ext, name, short_name: name, active: true,
          }).select('id').single();
          playerId = inserted?.id;
        }
        if (!playerId) continue;
        const started = arr(juveLineup?.startXI).some((x: any) => playerIdFromLineup(x) === ext);
        const bench = arr(juveLineup?.substitutes).some((x: any) => playerIdFromLineup(x) === ext);
        const playerStats = arr(detail.players).find((x: any) => String(x?.team?.id) === JUVE_ID)?.players || [];
        const ps = playerStats.find((x: any) => String(x?.player?.id) === ext)?.statistics?.[0] || {};
        const minutes = num(ps?.games?.minutes);

        await supabase.from('match_players').upsert({
          user_id: user.id, match_id: saved.id, player_id: playerId, started, bench, minutes,
        }, { onConflict: 'match_id,player_id' });

        await supabase.from('player_match_stats').upsert({
          user_id: user.id,
          match_id: saved.id,
          player_id: playerId,
          appearances: minutes > 0 ? 1 : 0,
          minutes,
          goals: num(ps?.goals?.total),
          assists: num(ps?.goals?.assists),
          shots: num(ps?.shots?.total),
          shots_on_target: num(ps?.shots?.on),
          xg: nullableNum(ps?.goals?.expected),
          xa: nullableNum(ps?.goals?.expected_assists),
          chances_created: num(ps?.passes?.key),
          successful_dribbles: num(ps?.dribbles?.success),
          duels_won: num(ps?.duels?.won),
          recoveries: num(ps?.tackles?.total),
          yellow_cards: num(ps?.cards?.yellow),
          red_cards: num(ps?.cards?.red),
          raw_provider_json: ps,
        }, { onConflict: 'match_id,player_id' });
      }

      const juveTeamStats = arr(detail.statistics).find((x: any) => String(x?.team?.id) === JUVE_ID)?.statistics || [];
      const statMap = new Map(arr(juveTeamStats).map((x: any) => [String(x.type), x.value]));
      const pct = (v: any) => v == null ? null : Number(String(v).replace('%', ''));
      await supabase.from('match_team_stats').upsert({
        user_id: user.id,
        match_id: saved.id,
        possession: pct(statMap.get('Ball Possession')),
        xg: nullableNum(statMap.get('expected_goals')),
        shots: nullableNum(statMap.get('Total Shots')),
        shots_on_target: nullableNum(statMap.get('Shots on Goal')),
        corners: nullableNum(statMap.get('Corner Kicks')),
        offsides: nullableNum(statMap.get('Offsides')),
        passes: nullableNum(statMap.get('Total passes')),
        successful_passes: nullableNum(statMap.get('Passes accurate')),
        pass_accuracy: pct(statMap.get('Passes %')),
        tackles: nullableNum(statMap.get('Tackles')),
        interceptions: nullableNum(statMap.get('Interceptions')),
        fouls: nullableNum(statMap.get('Fouls')),
        yellow_cards: nullableNum(statMap.get('Yellow Cards')),
        red_cards: nullableNum(statMap.get('Red Cards')),
        saves: nullableNum(statMap.get('Goalkeeper Saves')),
        raw_provider_json: juveTeamStats,
      }, { onConflict: 'match_id' });
    }

    await supabase.from('tracker_settings').update({ provider: 'api-football', season: `${season}/${String(season + 1).slice(-2)}`, updated_at: new Date().toISOString() }).eq('user_id', user.id);
    if (runId) await supabase.from('sync_runs').update({ status: 'completed', finished_at: new Date().toISOString(), message: `${savedMatches} partite sincronizzate` }).eq('id', runId);
    return NextResponse.json({ ok: true, provider: 'api-football', savedMatches, squad: roster.length });
  } catch (e: any) {
    if (runId) await supabase.from('sync_runs').update({ status: 'failed', finished_at: new Date().toISOString(), message: e?.message || 'sync error' }).eq('id', runId);
    return NextResponse.json({ error: e?.message || 'API-Football sync error' }, { status: 500 });
  }
}
