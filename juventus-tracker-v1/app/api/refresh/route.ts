import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';
const BASE='https://site.api.espn.com/apis/site/v2/sports/soccer'; const TEAM='111';
const comps=['ita.1','uefa.europa','ita.coppa_italia','ita.super_cup','uefa.champions'];
async function get(path:string){const r=await fetch(BASE+path,{cache:'no-store'}); if(!r.ok) throw new Error('ESPN '+r.status); return r.json()}
function arr(v:any){return Array.isArray(v)?v:[]}
function juve(e:any){return arr(e?.competitions?.[0]?.competitors).find((c:any)=>String(c?.team?.id)===TEAM)}
function opp(e:any){return arr(e?.competitions?.[0]?.competitors).find((c:any)=>String(c?.team?.id)!==TEAM)}
function score(c:any){return c?.score==null?null:Number(c.score)||0}
export async function POST(){try{const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)return NextResponse.json({error:'Non autenticato'},{status:401});const today=new Date().toISOString().slice(0,10);for(const slug of comps){let board:any;try{board=await get(`/${slug}/scoreboard?dates=${today}`)}catch{continue}for(const e of arr(board?.events)){if(!arr(e?.competitions?.[0]?.competitors).some((c:any)=>String(c?.team?.id)===TEAM))continue;const j=juve(e),o=opp(e),home=j?.homeAway==='home';let summary:any=null;try{summary=await get(`/${slug}/summary?event=${e.id}`)}catch{};const ev=summary?.header?.competitions?.[0]?{...e,competitions:summary.header.competitions}:e;const jj=juve(ev),oo=opp(ev);await s.from('matches').update({status:ev?.competitions?.[0]?.status?.type?.completed?'completed':ev?.competitions?.[0]?.status?.type?.state==='in'?'live':'scheduled',juve_score:home?score(jj):score(oo),opponent_score:home?score(oo):score(jj),raw_provider_json:summary||e,opponent_logo_url:oo?.team?.logo||o?.team?.logo||null}).eq('user_id',user.id).eq('external_id',String(e.id));}}
return NextResponse.json({ok:true,updated:new Date().toISOString()})}catch(e:any){return NextResponse.json({error:e?.message||'refresh error'},{status:500})}}
