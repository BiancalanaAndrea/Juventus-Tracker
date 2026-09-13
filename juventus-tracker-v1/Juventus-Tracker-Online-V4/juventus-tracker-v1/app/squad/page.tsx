import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getUser, ratingClass } from '@/lib/data';

export default async function Squad() {
 const {supabase,user}=await getUser();if(!user)return null;
 const {data:players}=await supabase.from('players').select('*').eq('user_id',user.id).eq('active',true).order('name');
 const {data:ratings}=await supabase.from('match_players').select('player_id,user_rating').eq('user_id',user.id).not('user_rating','is',null);
 const map=new Map<string,number[]>();(ratings??[]).forEach(r=>{const a=map.get(r.player_id)??[];a.push(Number(r.user_rating));map.set(r.player_id,a)});
 const {data:stats}=await supabase.from('player_match_stats').select('player_id,minutes,goals,assists,appearances').eq('user_id',user.id);
 const totals=new Map<string,any>();(stats??[]).forEach(s=>{const t=totals.get(s.player_id)||{minutes:0,goals:0,assists:0,appearances:0};t.minutes+=Number(s.minutes||0);t.goals+=Number(s.goals||0);t.assists+=Number(s.assists||0);t.appearances+=Number(s.appearances||0);totals.set(s.player_id,t)});
 return <div><header className="topbar"><div><p className="eyebrow">ROSA</p><h1>Giocatori</h1><p className="muted">Rosa importata automaticamente da Sportmonks.</p></div></header><div className="player-grid">{(players??[]).map(p=>{const a=map.get(p.id)??[];const avg=a.length?a.reduce((x,y)=>x+y,0)/a.length:null;const t=totals.get(p.id)||{};return <Link href={`/squad/${p.id}`} className="player-card" key={p.id}><div className="player-top">{p.photo_url?<img className="player-photo" src={p.photo_url} alt=""/>:<div className="big-number">{p.number??'—'}</div>}<div><span className="position">{p.position??'Giocatore'}</span><h3>{p.name}</h3>{p.injury_status&&<span className="injury">🩹 {p.injury_status}</span>}</div></div><div className="player-stats"><div><span>Presenze</span><b>{t.appearances??0}</b></div><div><span>Gol</span><b>{t.goals??0}</b></div><div><span>Assist</span><b>{t.assists??0}</b></div><div><span>Minuti</span><b>{t.minutes??0}</b></div></div><div className="rating-line"><span>Tua media</span><strong className={avg?ratingClass(avg):''}>{avg?avg.toFixed(1):'—'}</strong><ArrowRight size={16}/></div></Link>})}</div>{!players?.length&&<p className="empty">La rosa apparirà dopo la prima sincronizzazione.</p>}</div>
}
