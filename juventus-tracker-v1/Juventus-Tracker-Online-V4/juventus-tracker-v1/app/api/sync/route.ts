import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const BASE='https://api.sportmonks.com/v3/football';
const TEAM_ID=625;
const seasonWindow=(season:string)=>{const m=season.match(/(\d{4})\/(\d{2,4})/);if(!m)return {from:'2026-07-01',to:'2027-06-30'};const y=Number(m[1]);const y2=m[2].length===2?2000+Number(m[2]):Number(m[2]);return {from:`${y}-07-01`,to:`${y2}-06-30`}};

async function sm(path:string, token:string){
 const r=await fetch(`${BASE}${path}${path.includes('?')?'&':'?'}api_token=${encodeURIComponent(token)}`,{cache:'no-store'});
 const body=await r.json().catch(()=>({}));
 if(!r.ok) throw new Error(body?.message||`Sportmonks HTTP ${r.status}`);
 return body?.data;
}
function arr(v:any){return Array.isArray(v)?v:[]}
function val(details:any[], names:string[]){const d=arr(details).find((x:any)=>names.some(n=>String(x?.type?.name||x?.name||'').toLowerCase().includes(n))); const v=d?.data?.value ?? d?.value ?? d?.data; return typeof v==='number'?v:Number(v)||0}
function participant(f:any,id:number){return arr(f?.participants).find((p:any)=>Number(p.id)===id)}
function status(f:any){const s=String(f?.state?.name||f?.status||'').toLowerCase(); if(s.includes('finished')||s.includes('ended')||s.includes('full'))return 'completed'; return s.includes('live')||s.includes('progress')?'live':'scheduled'}
function score(f:any,id:number){const p=participant(f,id); const s=arr(f?.scores).find((x:any)=>Number(x.participant_id)===id && String(x.description||x.type?.name||'').toLowerCase().includes('current')); return Number(s?.goals ?? p?.meta?.score ?? 0)}

export async function POST(){
 try{
  const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
  if(!user)return NextResponse.json({error:'Non autenticato'},{status:401});
  const {data:settings}=await supabase.from('tracker_settings').select('*').eq('user_id',user.id).single();
  if(!settings?.football_api_key)return NextResponse.json({error:'Inserisci prima il token Sportmonks in Impostazioni.'},{status:400});
  const token=settings.football_api_key as string; const {from,to}=seasonWindow(settings.season||'2026/27');

  // Squadra attuale + foto + infortuni.
  const squad=await sm(`/squads/teams/${TEAM_ID}/extended?include=position;detailedPosition`,token);
  const team=await sm(`/teams/${TEAM_ID}?include=sidelined.type;sidelined.player`,token);
  const injuries=arr(team?.sidelined).filter((x:any)=>x.completed===false || x.completed==null || !x.end_date);
  for(const p of arr(squad).filter((x:any)=>x.in_squad!==false)){
    const inj=injuries.find((x:any)=>Number(x.player_id)===Number(p.id));
    const injuryText=inj ? `Indisponibile${inj.end_date?` fino al ${new Date(inj.end_date).toLocaleDateString('it-IT')}`:''}` : null;
    const {error}=await supabase.from('players').upsert({user_id:user.id,external_id:String(p.id),name:p.name||p.display_name||'Giocatore',short_name:p.display_name||p.common_name||p.name,number:p.jersey_number??null,position:p.position?.name||null,photo_url:p.image_path||null,active:true,injury_status:injuryText,injury_return_date:inj?.end_date??null,injury_category:inj?.type?.name||inj?.category||null},{onConflict:'user_id,external_id'});
    if(error) throw new Error(`Rosa: ${error.message}`);
  }

  // Calendario di tutte le competizioni attive del club nel periodo stagionale.
  const schedules=await sm(`/schedules/teams/${TEAM_ID}`,token);
  const fixtures=arr(schedules).flatMap((s:any)=>arr(s.rounds).flatMap((r:any)=>arr(r.fixtures))).filter((f:any)=>{const d=String(f.starting_at||'').slice(0,10);return d>=from&&d<=to});
  const unique=[...new Map(fixtures.map((f:any)=>[String(f.id),f])).values()];
  let saved=0;
  for(const brief of unique){
    const f=await sm(`/fixtures/${brief.id}?include=participants;scores;events;lineups.details.type;statistics.type;xGFixture;formations;state;season;league`,token);
    const juve=participant(f,TEAM_ID); const opp=arr(f?.participants).find((p:any)=>Number(p.id)!==TEAM_ID); const home=juve?.meta?.location==='home' || Number(f?.participants?.[0]?.id)===TEAM_ID;
    const opponent=opp?.name||'Avversario'; const comp=f?.league?.name||f?.season?.name||'Competizione';
    const row={user_id:user.id,external_id:String(f.id),season:settings.season||'2026/27',competition:comp,competition_logo_url:f?.league?.image_path||null,match_date:f.starting_at,opponent,opponent_logo_url:opp?.image_path||null,venue:f?.venue?.name||null,status:status(f),juve_score:home?score(f,TEAM_ID):score(f,Number(opp?.id)),opponent_score:home?score(f,Number(opp?.id)):score(f,TEAM_ID),raw_provider_json:f,};
    const {data:match,error:me}=await supabase.from('matches').upsert(row,{onConflict:'user_id,external_id'}).select('id').single(); if(me)throw new Error(`Partita: ${me.message}`);
    saved++;
    const lineups=arr(f?.lineups); const dbPlayers=await supabase.from('players').select('id,external_id').eq('user_id',user.id); const idMap=new Map((dbPlayers.data??[]).map((p:any)=>[String(p.external_id),p.id]));
    for(const l of lineups.filter((x:any)=>Number(x.team_id)===TEAM_ID)){
      const pid=idMap.get(String(l.player_id)); if(!pid)continue;
      const isStarter=String(l.type?.name||l.type_id||'').toLowerCase().includes('starting') || l.formation_position!=null || l.position!=null;
      const details=arr(l.details); const minutes=Number(l.minutes??val(details,['minutes']));
      await supabase.from('match_players').upsert({user_id:user.id,match_id:match.id,player_id:pid,started:isStarter,bench:!isStarter,minutes},{onConflict:'match_id,player_id'});
      await supabase.from('player_match_stats').upsert({user_id:user.id,match_id:match.id,player_id:pid,appearances:l.player?.meta?.starter===true||isStarter?1:minutes>0?1:0,minutes,goals:Number(l.goals??val(details,['goals'])),assists:Number(l.assists??val(details,['assists'])),shots:Number(l.shots??val(details,['shots'])),shots_on_target:Number(l.shots_on_target??val(details,['shots on target','shots on-target'])),xg:Number(l.xg??l.expected_goals??0),xa:Number(l.xa??l.expected_assists??0),chances_created:Number(l.chances_created??val(details,['chances created','key passes'])),successful_dribbles:Number(l.successful_dribbles??val(details,['successful dribbles'])),duels_won:Number(l.duels_won??val(details,['duels won'])),recoveries:Number(l.recoveries??val(details,['recoveries'])),yellow_cards:Number(l.yellow_cards??0),red_cards:Number(l.red_cards??0),raw_provider_json:l},{onConflict:'match_id,player_id'});
    }
    const stats=arr(f?.statistics).find((x:any)=>Number(x?.participant_id)===TEAM_ID) || {};
    const d=arr(stats?.statistics||stats?.details||stats);
    await supabase.from('match_team_stats').upsert({user_id:user.id,match_id:match.id,possessions:Number(stats.possession??val(d,['possession'])),xg:Number(f?.xGFixture?.find?.((x:any)=>Number(x.team_id)===TEAM_ID)?.xg??f?.xGFixture?.xg??0),shots:Number(stats.shots??val(d,['shots'])),shots_on_target:Number(stats.shots_on_target??val(d,['shots on target'])),corners:Number(stats.corners??val(d,['corners'])),offsides:Number(stats.offsides??val(d,['offsides'])),passes:Number(stats.passes??val(d,['passes'])),successful_passes:Number(stats.successful_passes??val(d,['successful passes'])),pass_accuracy:Number(stats.pass_accuracy??val(d,['pass accuracy'])),tackles:Number(stats.tackles??val(d,['tackles'])),interceptions:Number(stats.interceptions??val(d,['interceptions'])),fouls:Number(stats.fouls??val(d,['fouls'])),yellow_cards:Number(stats.yellow_cards??val(d,['yellow cards'])),red_cards:Number(stats.red_cards??val(d,['red cards'])),saves:Number(stats.saves??val(d,['saves']))},{onConflict:'match_id'});
  }
  await supabase.from('sync_runs').insert({user_id:user.id,provider:'sportmonks',finished_at:new Date().toISOString(),status:'completed',message:`Sincronizzate ${saved} partite e ${arr(squad).length} giocatori.`});
  return NextResponse.json({ok:true,savedMatches:saved,squad:arr(squad).length,injuies:injuries.length});
 }catch(e:any){return NextResponse.json({error:e?.message||'Errore di sincronizzazione'},{status:500})}
}
