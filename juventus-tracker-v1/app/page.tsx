import Link from 'next/link';
import {House,Plane,Radio,Trophy,Shield,CalendarDays} from 'lucide-react';
import {getUser} from '@/lib/data';
import {AutoRefresh} from './components_client';
import DashboardCalendar from './dashboard-client';
const JUVE='https://media.api-sports.io/football/teams/496.png';
function competitorsOf(m:any){return m?.raw_provider_json?.header?.competitions?.[0]?.competitors||m?.raw_provider_json?.competitions?.[0]?.competitors||[]}
function actualScores(m:any){const raw=competitorsOf(m);const juve=raw.find((c:any)=>String(c.team?.id)==='111');const opp=raw.find((c:any)=>String(c.team?.id)!=='111');if(juve&&opp){const js=Number(juve.score),os=Number(opp.score);if(Number.isFinite(js)&&Number.isFinite(os))return {juve:js,opp:os}}return {juve:Number(m.juve_score),opp:Number(m.opponent_score)}}
function result(m:any){if(m?.status!=='completed')return '';const a=actualScores(m);return a.juve>a.opp?'win':a.juve===a.opp?'draw':'loss'}
function homeOf(m:any){const raw=competitorsOf(m);return raw.find((c:any)=>String(c?.team?.id)==='111')?.homeAway==='home'}
function teamIdOf(m:any,juve=false){const raw=competitorsOf(m);const c=juve?raw.find((x:any)=>String(x?.team?.id)==='111'):raw.find((x:any)=>String(x?.team?.id)!=='111');return c?.team?.id?String(c.team.id):null}
function MatchCard({m,label}:{m:any,label:string}){
 if(!m) return <div className="hero-match"><div className="hero-match-head"><span>{label}</span><small>Nessuna partita</small></div><p style={{marginTop:20}}>Nessun incontro disponibile.</p></div>;
 const home=homeOf(m);
 const a=actualScores(m);
 const r=result(m);
 const juveLogo=JUVE;
 const oppLogo=m.opponent_logo_url||'';
 const date=new Date(m.match_date);
 const dateText=Number.isNaN(date.getTime())?'':date.toLocaleDateString('it-IT',{day:'2-digit',month:'2-digit',year:'numeric'});
 const timeText=Number.isNaN(date.getTime())?'':date.toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'});
 const score=Number.isFinite(a.juve)&&Number.isFinite(a.opp)?(home?`${a.juve} - ${a.opp}`:`${a.opp} - ${a.juve}`):'—';
 return <Link href={`/matches/${m.id}`} className={`hero-match ${r}`}>
  <div className="hero-match-head"><span>{label}</span><small>{dateText}{timeText?` · ${timeText}`:''}</small></div>
  <div className="hero-teams">
   <div>{home?<><img src={juveLogo} alt="Juventus"/><strong>Juventus</strong></>:<><img src={oppLogo} alt={m.opponent}/><strong>{m.opponent}</strong></>}</div>
   <strong>{score}</strong>
   <div>{home?<><strong>{m.opponent}</strong><img src={oppLogo} alt={m.opponent}/></>:<><strong>Juventus</strong><img src={juveLogo} alt="Juventus"/></>}</div>
  </div>
  <p>{m.competition||'Partita'}</p>
 </Link>
}
function RecentFive({matches}:{matches:any[]}){return <div className="recent-five-list">{matches.slice(0,5).map((m:any)=><Link key={m.id} href={m.juveMatch?`/matches/${m.id}`:'#'} className={`recent-five-item ${m.result}`}><span>{m.opponent}</span><b>{m.for} - {m.against}</b><em>{m.result==='win'?'Vittoria':m.result==='draw'?'Pareggio':'Sconfitta'}</em></Link>)}</div>}
export default async function Dashboard(){const {supabase,user}=await getUser();if(!user)return null;const {data:matches}=await supabase.from('matches').select('*').eq('user_id',user.id).order('match_date',{ascending:true});const ms=matches||[];const completed=ms.filter(m=>m.status==='completed').sort((a,b)=>+new Date(b.match_date)-+new Date(a.match_date));const live=ms.find(m=>m.status==='live');const upcoming=ms.filter(m=>m.status!=='completed'&&m.status!=='live').sort((a,b)=>+new Date(a.match_date)-+new Date(b.match_date));const last=completed[0];const next=upcoming[0];const juveForm=completed.slice(0,5).map((m:any)=>{const a=actualScores(m);return {result:a.juve>a.opp?'win':a.juve===a.opp?'draw':'loss',opponent:m.opponent,for:a.juve,against:a.opp,juveMatch:true,id:m.id}});return <div><AutoRefresh seconds={25} sync={true}/><header className="topbar"><div><p className="eyebrow">JUVENTUS TRACKER</p><h1>Dashboard</h1><p className="muted">Ultima, prossima, live e calendario Juventus.</p></div></header><section className="hero-two"><MatchCard m={last} label="ULTIMA PARTITA"/><MatchCard m={next} label="PROSSIMA PARTITA"/></section><section className="panel live-panel"><div className="panel-head"><div><p className="eyebrow live-red">LIVE</p><h3>Partita live</h3></div></div>{live?<Link href={`/matches/${live.id}`} className="live-card"><span className="live-badge">LIVE</span><div><img src={homeOf(live)?JUVE:live.opponent_logo_url}/><b>{homeOf(live)?'Juventus':live.opponent}</b><strong>{homeOf(live)?`${live.juve_score??0} - ${live.opponent_score??0}`:`${live.opponent_score??0} - ${live.juve_score??0}`}</strong><img src={homeOf(live)?live.opponent_logo_url:JUVE}/><b>{homeOf(live)?live.opponent:'Juventus'}</b></div><small>{live.competition}</small></Link>:<div className="empty">La Juventus non sta giocando in questo momento.</div>}</section><section className="panel recent-panel"><div className="panel-head"><div><p className="eyebrow">ULTIME 5</p><h3>Ultime 5 partite Juventus</h3></div></div><RecentFive matches={juveForm}/></section><DashboardCalendar matches={ms}/><section className="quick-grid"><Link href="/squad" className="quick-card"><Shield/><div><strong>Rosa</strong><span>Giocatori e allenatori</span></div></Link><Link href="/matches" className="quick-card"><CalendarDays/><div><strong>Partite</strong><span>Calendario e voti</span></div></Link><Link href="/stats" className="quick-card"><Trophy/><div><strong>Statistiche</strong><span>Juventus e giocatori</span></div></Link><Link href="/settings" className="quick-card"><Radio/><div><strong>Aggiornamento</strong><span>Automatico</span></div></Link></section></div>}
