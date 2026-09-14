import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BASE = 'https://soccer.highlightly.net';
const SEASON_DEFAULT = 2026;

type ApiBody = any;

async function api(path: string, key: string): Promise<ApiBody> {
  const r = await fetch(`${BASE}${path}`, {
    headers: { 'x-rapidapi-key': key },
    cache: 'no-store',
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(body?.message || body?.error || `Highlightly HTTP ${r.status}`);
  return body;
}

function arr(v: any) { return Array.isArray(v) ? v : Array.isArray(v?.data) ? v.data : []; }
function num(v: any) { const n = Number(v); return Number.isFinite(n) ? n : 0; }
function nullableNum(v: any) { if (v === null || v === undefined || v === '') return null; const n = Number(String(v).replace('%','')); return Number.isFinite(n) ? n : null; }
function pct(v: any) { return nullableNum(v); }
function roleGroup(position: string | null) {
  const p = String(position || '').toLowerCase();
  if (p.includes('goal')) return 'GK';
  if (p.includes('def')) return 'DF';
  if (p.includes('mid')) return 'MF';
  return 'FW';
}
function statusFromMatch(m: any) {
  const s = String(m?.state || m?.status || m?.matchStatus || '').toLowerCase();
  if (s.includes('live') || s.includes('first') || s.includes('second') || s.includes('half')) return 'live';
  if (s.includes('finished') || s.includes('ended') || s.includes('complete') || s === 'ft') return 'completed';
  if (m?.isFinished === true) return 'completed';
  return 'scheduled';
}
function homeTeam(m: any) { return m?.homeTeam || m?.home || m?.teams?.home || {}; }
function awayTeam(m: any) { return m?.awayTeam || m?.away || m?.teams?.away || {}; }
function teamId(t: any) { return t?.id != null ? String(t.id) : ''; }
function teamName(t: any) { return t?.name || t?.displayName || 'Squadra'; }
function score(t: any) { return nullableNum(t?.score ?? t?.goals ?? t?.currentScore); }
function matchDate(m: any) { return m?.startTime || m?.startDate || m?.date || m?.utcDate || m?.kickoff || null; }
function competition(m: any) { return m?.league?.name || m?.competition?.name || m?.leagueName || 'Competizione'; }
function competitionLogo(m: any) { return m?.league?.logo || m?.competition?.logo || null; }

function lineupPlayers(lineup: any, side: 'home'|'away') {
  const x = side === 'home' ? lineup?.home : lineup?.away;
  const root = x || lineup?.[side] || {};
  return [...arr(root?.initialLineup), ...arr(root?.startingXI), ...arr(root?.startXI), ...arr(root?.substitutes), ...arr(root?.bench)];
}
function playerFromLineup(x: any) { return x?.player || x; }
function playerId(p: any) { return p?.id != null ? String(p.id) : null; }
function playerName(p: any) { return p?.name || p?.fullName || p?.displayName || 'Giocatore'; }

function statValue(stats: any[], names: string[]) {
  const wanted = names.map(x => x.toLowerCase());
  const item = stats.find((s: any) => wanted.includes(String(s?.name || s?.displayName || s?.type || '').toLowerCase()));
  return item?.value ?? item?.amount ?? item?.statValue ?? null;
}

function boxPlayers(box: any, juveId: string) {
  const teams = arr(box);
  const team = teams.find((t: any) => teamId(t) === juveId) || teams.find((t: any) => String(t?.team?.id) === juveId) || {};
  return arr(team?.players || team?.boxScores || team?.playerStats || team?.players?.data);
}

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });

  const { data: settings } = await supabase.from('tracker_settings')
    .select('provider,season,football_api_key')
    .eq('user_id', user.id).maybeSingle();
  const key = settings?.football_api_key?.trim();
  if (!key) return NextResponse.json({ error: 'Inserisci prima la API Key di Highlightly nelle Impostazioni.' }, { status: 400 });
  if ((settings?.provider || 'highlightly') !== 'highlightly') return NextResponse.json({ error: 'Il provider deve essere Highlightly.' }, { status: 400 });

  const season = Number(String(settings?.season || '2026/27').slice(0,4)) || SEASON_DEFAULT;
  const run = await supabase.from('sync_runs').insert({ user_id:user.id, provider:'highlightly', status:'running' }).select('id').maybeSingle();
  const runId = run.data?.id;

  try {
    // Resolve Juventus once, then use its ID for all subsequent calls.
    const teams = arr(await api('/teams?name=Juventus&limit=20', key));
    const juveTeam = teams.find((t:any) => /juventus/i.test(t?.name || t?.displayName || '')) || teams[0];
    if (!juveTeam?.id) throw new Error('Juventus non trovata su Highlightly.');
    const JUVE_ID = String(juveTeam.id);

    // Home + away queries avoid relying on an undocumented "team" filter and capture every competition.
    const [homeData, awayData] = await Promise.all([
      api(`/matches?homeTeamId=${JUVE_ID}&season=${season}&limit=100&offset=0`, key),
      api(`/matches?awayTeamId=${JUVE_ID}&season=${season}&limit=100&offset=0`, key),
    ]);
    const map = new Map<string, any>();
    for (const m of [...arr(homeData), ...arr(awayData)]) if (m?.id != null) map.set(String(m.id), m);
    const matches = [...map.values()].sort((a,b)=>String(matchDate(a)).localeCompare(String(matchDate(b))));

    // Existing IDs let us avoid repeatedly downloading full match details and burning the free quota.
    const { data: existingMatches } = await supabase.from('matches').select('id,external_id,raw_provider_json').eq('user_id',user.id);
    const existingByExt = new Map((existingMatches || []).map((m:any)=>[String(m.external_id),m]));
    let savedMatches = 0, detailedMatches = 0;

    for (const m of matches) {
      const id = String(m.id);
      const home = homeTeam(m), away = awayTeam(m);
      const isHome = teamId(home) === JUVE_ID;
      const juve = isHome ? home : away;
      const opp = isHome ? away : home;
      const status = statusFromMatch(m);
      const row:any = {
        user_id:user.id,
        external_id:id,
        season:`${season}/${String(season+1).slice(-2)}`,
        competition:competition(m),
        competition_logo_url:competitionLogo(m),
        match_date:matchDate(m),
        opponent:teamName(opp),
        opponent_logo_url:opp?.logo || opp?.image || null,
        venue:m?.venue?.name || m?.venue?.stadium || null,
        status,
        juve_score:score(juve),
        opponent_score:score(opp),
        raw_provider_json:m,
      };
      const { data:saved, error } = await supabase.from('matches').upsert(row,{onConflict:'user_id,external_id'}).select('id').single();
      if (error || !saved) continue;
      savedMatches++;

      const old:any = existingByExt.get(id);
      const needsDetail = status === 'live' || status === 'completed' && !old?.raw_provider_json;
      if (!needsDetail) continue;

      let detail:any = m;
      let lineups:any = null, stats:any = null, box:any = null;
      try { detail = (await api(`/matches/${id}`,key)); } catch {}
      try { lineups = await api(`/lineups/${id}`,key); } catch {}
      try { stats = await api(`/statistics/${id}`,key); } catch {}
      try { box = await api(`/box-score/${id}`,key); } catch {}
      detailedMatches++;

      const detailedHome = homeTeam(detail), detailedAway = awayTeam(detail);
      const dHome = teamId(detailedHome) === JUVE_ID ? detailedHome : detailedAway;
      const dOpp = teamId(detailedHome) === JUVE_ID ? detailedAway : detailedHome;
      await supabase.from('matches').update({
        status:statusFromMatch(detail),
        juve_score:score(dHome),
        opponent_score:score(dOpp),
        raw_provider_json:detail,
        opponent_logo_url:dOpp?.logo || dOpp?.image || row.opponent_logo_url,
        venue:detail?.venue?.name || detail?.venue?.stadium || row.venue,
      }).eq('id',saved.id).eq('user_id',user.id);

      const homeLine = lineups?.home || lineups?.data?.home || lineups?.[0] || {};
      const awayLine = lineups?.away || lineups?.data?.away || lineups?.[1] || {};
      const juveLine = teamId(homeLine?.team) === JUVE_ID || teamId(homeLine) === JUVE_ID ? homeLine : awayLine;
      const allLine = [...arr(juveLine?.initialLineup), ...arr(juveLine?.startingXI), ...arr(juveLine?.startXI), ...arr(juveLine?.substitutes), ...arr(juveLine?.bench)];
      const uniqueLine = new Map<string,any>();
      for(const x of allLine){ const p=playerFromLineup(x); const pid=playerId(p); if(pid) uniqueLine.set(pid,{x,p}); }
      const bplayers = boxPlayers(box,JUVE_ID);
      const bmap = new Map<string,any>();
      for(const x of bplayers){const pid=playerId(x?.player||x); if(pid)bmap.set(pid,x)}

      for (const {x,p} of uniqueLine.values()) {
        const ext = playerId(p); if(!ext) continue;
        const {data:existingPlayer}=await supabase.from('players').select('id').eq('user_id',user.id).eq('external_id',ext).maybeSingle();
        let playerDbId=existingPlayer?.id;
        if(!playerDbId){
          const {data:ins}=await supabase.from('players').insert({user_id:user.id,external_id:ext,name:playerName(p),short_name:playerName(p),number:nullableNum(p?.shirtNumber ?? p?.jersey ?? x?.shirtNumber),position:p?.position || x?.position || null,role_group:roleGroup(p?.position || x?.position),photo_url:p?.logo || p?.photo || x?.logo || null,active:true}).select('id').single();
          playerDbId=ins?.id;
        } else {
          await supabase.from('players').update({photo_url:p?.logo || p?.photo || x?.logo || undefined,number:nullableNum(p?.shirtNumber ?? p?.jersey ?? x?.shirtNumber),position:p?.position || x?.position || undefined,role_group:roleGroup(p?.position || x?.position)}).eq('id',playerDbId).eq('user_id',user.id);
        }
        if(!playerDbId) continue;
        const started = arr(juveLine?.initialLineup).some((z:any)=>playerId(playerFromLineup(z))===ext) || arr(juveLine?.startingXI).some((z:any)=>playerId(playerFromLineup(z))===ext) || arr(juveLine?.startXI).some((z:any)=>playerId(playerFromLineup(z))===ext);
        const bench = !started;
        const bp=bmap.get(ext)||{};
        const rawStats=arr(bp?.statistics || bp?.stats);
        const get=(...names:string[])=>statValue(rawStats,names);
        const minutes=nullableNum(bp?.minutes ?? bp?.minutesPlayed ?? get('Minutes played')) || 0;
        const goals=nullableNum(bp?.goals ?? bp?.goalsScored ?? get('Goals scored')) || 0;
        const assists=nullableNum(bp?.assists ?? get('Assists')) || 0;
        const shots=nullableNum(bp?.shots ?? bp?.totalShots ?? get('Total shots','Shots')) || 0;
        const sot=nullableNum(bp?.shotsOnTarget ?? get('Shots on target')) || 0;
        const xg=nullableNum(bp?.xG ?? bp?.expectedGoals ?? get('Expected goals (xG)','Expected goals'));
        const dribbles=nullableNum(bp?.successfulDribbles ?? get('Successful dribbles')) || 0;
        const duels=nullableNum(bp?.duelsWon ?? get('Duels won')) || 0;
        const tackles=nullableNum(bp?.totalTackles ?? get('Total tackles')) || 0;
        const interceptions=nullableNum(bp?.totalInterceptions ?? get('Total interceptions')) || 0;
        const cards=bp?.cards || {};
        await supabase.from('match_players').upsert({user_id:user.id,match_id:saved.id,player_id:playerDbId,started,bench,minutes},{onConflict:'match_id,player_id'});
        await supabase.from('player_match_stats').upsert({user_id:user.id,match_id:saved.id,player_id:playerDbId,appearances:minutes>0?1:0,minutes,goals,assists,shots,shots_on_target:sot,xg,xa:null,chances_created:nullableNum(bp?.keyPasses ?? get('Key passes')) || 0,successful_dribbles:dribbles,duels_won:duels,recoveries:interceptions,yellow_cards:nullableNum(cards?.yellow ?? get('Yellow cards')) || 0,red_cards:nullableNum(cards?.red ?? get('Red cards')) || 0,raw_provider_json:bp},{onConflict:'match_id,player_id'});
      }

      const teamStats = arr(stats).find((x:any)=>teamId(x?.team)===JUVE_ID) || {};
      const sarr=arr(teamStats?.statistics);
      const getS=(...names:string[])=>statValue(sarr,names);
      await supabase.from('match_team_stats').upsert({user_id:user.id,match_id:saved.id,possession:pct(getS('Possession','Ball possession')),xg:nullableNum(getS('Expected goals','xG')),shots:nullableNum(getS('Total shots','Shots')),shots_on_target:nullableNum(getS('Shots on target','Shots on goal')),corners:nullableNum(getS('Corners','Corner kicks')),offsides:nullableNum(getS('Offsides')),passes:nullableNum(getS('Total passes','Passes')),successful_passes:nullableNum(getS('Accurate passes','Successful passes')),pass_accuracy:pct(getS('Pass accuracy','Passes accurate','Pass accuracy %')),tackles:nullableNum(getS('Tackles')),interceptions:nullableNum(getS('Interceptions')),fouls:nullableNum(getS('Fouls')),yellow_cards:nullableNum(getS('Yellow cards')),red_cards:nullableNum(getS('Red cards')),saves:nullableNum(getS('Saves','Goalkeeper saves')),raw_provider_json:teamStats},{onConflict:'match_id'});
    }

    await supabase.from('tracker_settings').update({provider:'highlightly',season:`${season}/${String(season+1).slice(-2)}`,updated_at:new Date().toISOString()}).eq('user_id',user.id);
    if(runId) await supabase.from('sync_runs').update({status:'completed',finished_at:new Date().toISOString(),message:`${savedMatches} partite sincronizzate, ${detailedMatches} dettagli aggiornati`}).eq('id',runId);
    return NextResponse.json({ok:true,provider:'highlightly',savedMatches,detailedMatches,teamId:JUVE_ID});
  } catch(e:any){
    if(runId) await supabase.from('sync_runs').update({status:'failed',finished_at:new Date().toISOString(),message:e?.message||'sync error'}).eq('id',runId);
    return NextResponse.json({error:e?.message||'Highlightly sync error'},{status:500});
  }
}
