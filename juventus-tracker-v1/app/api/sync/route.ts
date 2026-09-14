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
    const hay = `${s?.name || ''} ${s?.displayName || ''} ${s?.abbreviation || ''} ${s?.key || ''}`.toLowerCase();
    return wanted.some(a => hay === a || hay.includes(a));
  });
  if (!item) return 0;
  return item?.value ?? item?.displayValue ?? 0;
}

function normalizeStats(block: any): any[] {
  if (!block) return [];
  const direct = arr(block?.stats || block?.statistics);
  if (direct.length && direct.every((x: any) => typeof x === 'object')) return direct;
  const keys = arr(block?.keys);
  const values = arr(block?.values);
  const names = arr(block?.names);
  const labels = arr(block?.labels);
  if (keys.length && values.length) {
    return keys.map((k: any, i: number) => ({ key: String(k), name: String(k), displayName: labels[i] || names[i] || k, value: values[i] }));
  }
  return [];
}

const playerLabelMap: Record<string,string> = {
  min:'minutes', minutes:'minutes', g:'goals', goals:'goals', a:'assists', ast:'assists', assists:'assists',
  sh:'shots', shots:'shots', sog:'shots_on_target', shotsongoal:'shots_on_target', shotsontarget:'shots_on_target',
  xg:'xg', xa:'xa', keyp:'chances_created', keypasses:'chances_created', chancescreated:'chances_created',
  d:'successful_dribbles', dri:'successful_dribbles', drb:'successful_dribbles', successfuldribbles:'successful_dribbles',
  dw:'duels_won', duelswon:'duels_won', recoveries:'recoveries', rec:'recoveries', tk:'tackles', tackles:'tackles',
  int:'interceptions', interceptions:'interceptions', fc:'fouls', fouls:'fouls', yc:'yellow_cards', yellow:'yellow_cards',
  rc:'red_cards', red:'red_cards', saves:'saves', sv:'saves', gc:'goals_conceded', goalsconceded:'goals_conceded',
  goalsallowed:'goals_conceded', passes:'passes', pass:'passes', totalpasses:'passes',
  accuratepasses:'successful_passes', successfulpasses:'successful_passes', completedpasses:'successful_passes',
  passaccuracy:'pass_accuracy', passingaccuracy:'pass_accuracy', acc:'pass_accuracy'
};
function cleanLabel(v:any){return String(v ?? '').toLowerCase().replace(/[^a-z0-9]/g,'')}
function athleteStatsFromRow(row:any, group:any): any[] {
  const raw = arr(row?.stats || row?.statistics);
  const labels = arr(group?.labels || group?.keys || group?.names || group?.statistics?.names);
  if (!raw.length) return [];
  return raw.map((value:any,i:number)=>{
    if (value && typeof value === 'object') {
      const label=value?.name || value?.key || value?.abbreviation || value?.displayName || labels[i] || `stat${i}`;
      return {...value, key:value?.key || playerLabelMap[cleanLabel(label)] || cleanLabel(label), name:value?.name || playerLabelMap[cleanLabel(label)] || label, value:value?.value ?? value?.displayValue ?? value?.displayValueRaw ?? 0};
    }
    const label=String(labels[i] ?? `stat${i}`);
    const key=cleanLabel(label);
    const mapped=playerLabelMap[key];
    return { key: mapped || key, name: mapped || label, displayName: label, value };
  });
}
function statsArray(obj:any){
  if (!obj) return [];
  if (obj?.athlete && (obj?.stats || obj?.statistics)) return athleteStatsFromRow(obj, obj);
  const source = obj?.statistics || obj?.stats || obj?.teamStats;
  if (Array.isArray(source)) {
    const out:any[]=[];
    for (const block of source) {
      if (block?.athletes) {
        for (const a of arr(block.athletes)) out.push(...athleteStatsFromRow(a, block));
      } else out.push(...normalizeStats(block));
    }
    return out;
  }
  return normalizeStats(obj);
}
function playerPhoto(athlete: any) {
  const direct = athlete?.headshot?.href || athlete?.headshot?.url || athlete?.images?.find?.((x:any)=>x?.href)?.href || athlete?.images?.[0]?.href || null;
  if (direct) return direct;
  return athlete?.id ? `https://a.espncdn.com/i/headshots/soccer/players/full/${athlete.id}.png` : null;
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
  const out:any[]=[];
  for (const teamBlock of arr(summary?.rosters)) {
    if (String(teamBlock?.team?.id)!==TEAM_ID) continue;
    for (const r of arr(teamBlock?.roster || teamBlock?.players)) {
      const athlete=r?.athlete||r; if(!athlete?.id) continue;
      out.push({athlete, starter:r?.starter===true || r?.starter==='true', minutes:n(r?.minutesPlayed ?? r?.minutes ?? 0), stats:statsArray(r), raw:r});
    }
  }
  for (const teamBlock of arr(summary?.boxscore?.players)) {
    if (String(teamBlock?.team?.id)!==TEAM_ID) continue;
    for (const group of arr(teamBlock?.statistics)) {
      for (const athleteBlock of arr(group?.athletes)) {
        const athlete=athleteBlock?.athlete||athleteBlock; if(!athlete?.id) continue;
        const existing=out.find(x=>String(x.athlete.id)===String(athlete.id));
        const st=athleteStatsFromRow(athleteBlock,group);
        if(existing){
          if(st.length) existing.stats=st;
          existing.raw=existing.raw||athleteBlock;
          existing.minutes=existing.minutes||n(athleteBlock?.minutesPlayed ?? athleteBlock?.minutes ?? statValue(st,['minutes','min']));
        } else {
          const mins=n(athleteBlock?.minutesPlayed ?? athleteBlock?.minutes ?? statValue(st,['minutes','min']));
          out.push({athlete,starter:athleteBlock?.starter===true,minutes:mins,stats:st,raw:athleteBlock});
        }
      }
    }
  }
  return [...new Map(out.map(x=>[String(x.athlete.id),x])).values()];
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
    let teamResponse: any = null;
    try { teamResponse = await espn(`/ita.1/teams/${TEAM_ID}`); } catch {}
    const roster = collectRosterPlayers(rosterResponse);

    const coaches = arr(teamResponse?.team?.coaches || teamResponse?.coaches || teamResponse?.team?.coach || rosterResponse?.coaches || rosterResponse?.coach);
    await supabase.from('coaches').update({active:false}).eq('user_id', user.id);
    if (coaches.length) {
      for (const c of coaches) {
        const a=c?.athlete||c; if (!a?.id) continue;
        await supabase.from('coaches').upsert({user_id:user.id, external_id:String(a.id), name:playerName(a), photo_url:playerPhoto(a), active:true}, {onConflict:'user_id,external_id'});
      }
    } else {
      await supabase.from('coaches').upsert({user_id:user.id, external_id:'juve-head-coach', name:'Luciano Spalletti', active:true}, {onConflict:'user_id,external_id'});
    }

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
        role_group: (() => { const x=String(positionName(p)||'').toLowerCase(); return x.includes('goal')||x==='gk'||x.includes('port')?'GK':x.includes('back')||x.includes('def')||x==='d'||x==='df'?'DF':x.includes('mid')||x.includes('centro')||x==='m'||x==='mf'?'MF':'FW'; })(),
      }, { onConflict: 'user_id,external_id' });
      if (error) throw new Error(`Rosa: ${error.message}`);
    }

    // Build the season calendar from the Juventus team schedules.
    // Unlike a huge scoreboard date-range scan, this is fast and avoids gateway timeouts.
    const scheduleResults = await Promise.all(COMPETITIONS.map(async competition => {
      try {
        const data = await espn(`/${competition.slug}/teams/${TEAM_ID}/schedule?fixture=true&season=${seasonNumber(season)}`);
        return {competition, events: arr(data?.events)};
      } catch { return {competition, events: []}; }
    }));
    const eventMap = new Map<string, any>();
    for (const result of scheduleResults) for (const e of result.events) {
      if (!inWindow(e?.date, from, to)) continue;
      if (!arr(e?.competitions?.[0]?.competitors).some((c:any)=>String(c?.team?.id)===TEAM_ID)) continue;
      eventMap.set(String(e.id), {...e, __leagueSlug: result.competition.slug});
    }
    const uniqueEvents = [...eventMap.values()].sort((a,b)=>String(a.date).localeCompare(String(b.date)));

    let saved = 0;
    for (const event of uniqueEvents) {
      const leagueSlug = event?.__leagueSlug || event?.competitions?.[0]?.league?.slug || 'ita.1';
      let summary: any = null;
      const statusBefore = matchStatus(event);
      if (statusBefore === 'completed' || statusBefore === 'live') {
        try { summary = await espn(`/${leagueSlug}/summary?event=${encodeURIComponent(event.id)}`); } catch {}
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
        opponent_logo_url: opp?.team?.logo || opp?.team?.logos?.[0]?.href || (opp?.team?.id ? `https://a.espncdn.com/i/teamlogos/soccer/500/${opp.team.id}.png` : null),
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

      // Rebuild automatic stats for this match so stale/incorrect provider values cannot survive. User ratings live in match_players and are preserved.
      await supabase.from('player_match_stats').delete().eq('user_id', user.id).eq('match_id', match.id);
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
          shots_on_target: Math.round(playerMetric(stats, ['shots on target', 'shots on goal', 'shotsongoal'])),
          xg: playerMetric(stats, ['expected goals', 'xg']),
          xa: playerMetric(stats, ['expected assists', 'xa']),
          chances_created: Math.round(playerMetric(stats, ['chances created', 'key passes'])),
          successful_dribbles: Math.round(playerMetric(stats, ['successful dribbles', 'dribbles completed'])),
          duels_won: Math.round(playerMetric(stats, ['duels won', 'duels won'])) ,
          recoveries: Math.round(playerMetric(stats, ['recoveries'])),
          passes: Math.round(playerMetric(stats, ['passes', 'total passes'])),
          successful_passes: Math.round(playerMetric(stats, ['successful passes', 'passes completed', 'accurate passes', 'accuratepasses'])),
          pass_accuracy: playerMetric(stats, ['pass accuracy', 'passing accuracy', 'passaccuracy', 'accurate pass percentage']),
          tackles: Math.round(playerMetric(stats, ['tackles'])),
          interceptions: Math.round(playerMetric(stats, ['interceptions'])),
          fouls: Math.round(playerMetric(stats, ['fouls', 'fouls committed'])),
          saves: Math.round(playerMetric(stats, ['saves'])),
          goals_conceded: Math.round(playerMetric(stats, ['goals conceded', 'goals allowed', 'goals against'])),
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
        goals: Math.round(home ? scoreOf(juve) || 0 : scoreOf(opp) || 0),
        xg,
        shots: Math.round(playerMetric(teamStats, ['shots', 'total shots'])),
        shots_on_target: Math.round(playerMetric(teamStats, ['shots on target', 'shots on goal', 'shotsongoal'])),
        corners: Math.round(playerMetric(teamStats, ['corners'])),
        offsides: Math.round(playerMetric(teamStats, ['offsides'])),
        passes: Math.round(playerMetric(teamStats, ['passes', 'total passes'])),
        successful_passes: Math.round(playerMetric(teamStats, ['successful passes', 'passes completed', 'accurate passes', 'accuratepasses'])),
        pass_accuracy: playerMetric(teamStats, ['pass accuracy', 'passing accuracy', 'passaccuracy', 'accurate pass percentage']),
        tackles: Math.round(playerMetric(teamStats, ['tackles'])),
        interceptions: Math.round(playerMetric(teamStats, ['interceptions'])),
        fouls: Math.round(playerMetric(teamStats, ['fouls', 'fouls committed'])),
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
