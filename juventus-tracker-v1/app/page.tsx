import Link from 'next/link';
import { ArrowRight, CalendarDays, Shield, Star, Trophy } from 'lucide-react';
import { getUser, ratingClass } from '@/lib/data';

export default async function Dashboard() {
  const { supabase, user } = await getUser();
  if (!user) return null;
  const { data: matches } = await supabase.from('matches').select('*').eq('user_id', user.id).order('match_date', { ascending: false }).limit(30);
  const { data: players } = await supabase.from('players').select('*').eq('user_id', user.id).eq('active', true).order('name');
  const { data: ratings } = await supabase.from('match_players').select('player_id,user_rating').eq('user_id', user.id).not('user_rating','is',null);
  const rated = ratings ?? [];
  const averages = new Map<string, number[]>(); rated.forEach(r => { const a=averages.get(r.player_id)??[]; a.push(Number(r.user_rating)); averages.set(r.player_id,a); });
  const ranking = (players ?? []).map(p => ({...p, avg:(averages.get(p.id)??[]).reduce((a,b)=>a+b,0)/((averages.get(p.id)??[]).length||1), count:(averages.get(p.id)??[]).length})).filter(p=>p.count>0).sort((a,b)=>b.avg-a.avg);
  const completed = (matches ?? []).filter(m => m.status === 'completed' || m.status === 'finished' || m.juve_score !== null).sort((a,b)=>new Date(b.match_date).getTime()-new Date(a.match_date).getTime());
  const next = (matches ?? []).filter(m => new Date(m.match_date).getTime() > Date.now()).sort((a,b)=>new Date(a.match_date).getTime()-new Date(b.match_date).getTime())[0];
  const last = completed[0];
  const teamRatings=(matches??[]).map(m=>Number(m.team_rating)).filter(n=>n>0);
  const coachRatings=(matches??[]).map(m=>Number(m.coach_rating)).filter(n=>n>0);
  const avg=(a:number[])=>a.length?(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1):'—';
  return <div>
    <header className="topbar"><div><p className="eyebrow">JUVENTUS TRACKER</p><h1>Dashboard</h1><p className="muted">Partite, rosa, statistiche e tue valutazioni sincronizzate.</p></div><Link className="primary-btn" href="/matches">Partite <ArrowRight size={16}/></Link></header>
    <section className="hero-card"><div className="hero-team"><img className="hero-logo" src="https://a.espncdn.com/i/teamlogos/soccer/500/111.png" alt="Juventus"/><div><span className="pill">{next?'PROSSIMA PARTITA':'ULTIMA PARTITA'}</span><h2>Juventus <span>vs</span> {next?.opponent ?? last?.opponent ?? '—'}</h2><p>{next ? `${next.competition} · ${new Date(next.match_date).toLocaleString('it-IT',{dateStyle:'medium',timeStyle:'short'})}` : last ? `${last.competition} · ${new Date(last.match_date).toLocaleDateString('it-IT')}` : 'Sincronizza ESPN dalle Impostazioni'}</p></div></div><div className="hero-opponent">{(next?.opponent_logo_url||last?.opponent_logo_url)&&<img className="hero-logo" src={next?.opponent_logo_url||last?.opponent_logo_url} alt=""/>}<div className="hero-badge">J</div></div></section>
    <section className="stat-grid"><div className="stat-card"><span>Media squadra</span><strong>{avg(teamRatings)}</strong><small>{teamRatings.length} partite valutate</small></div><div className="stat-card"><span>Media allenatore</span><strong>{avg(coachRatings)}</strong><small>{coachRatings.length} partite valutate</small></div><div className="stat-card"><span>Miglior giocatore</span><strong>{ranking[0]?.short_name || ranking[0]?.name || '—'}</strong><small>{ranking[0] ? ranking[0].avg.toFixed(1) : '—'} di media</small></div><div className="stat-card"><span>Partite</span><strong>{matches?.length ?? 0}</strong><small>stagione sincronizzata</small></div></section>
    <div className="section-grid"><section className="panel"><div className="panel-head"><div><p className="eyebrow">CALENDARIO</p><h3>Ultime partite</h3></div><Link href="/matches">Vedi tutto <ArrowRight size={16}/></Link></div><div className="match-list">{completed.slice(0,5).map(m=><div className="match-row" key={m.id}><div><strong>Juventus - {m.opponent}</strong><span>{m.competition} · {new Date(m.match_date).toLocaleDateString('it-IT')}</span></div><div className="score">{m.juve_score ?? '—'} - {m.opponent_score ?? '—'}</div><div className={m.team_rating?`rating ${ratingClass(Number(m.team_rating))}`:'rating'}>{m.team_rating?Number(m.team_rating).toFixed(1):'—'}</div></div>)}</div>{!completed.length&&<p className="empty">Nessuna partita sincronizzata. Vai in Impostazioni e avvia la sincronizzazione ESPN.</p>}</section></div>
    <section className="quick-grid"><Link href="/squad" className="quick-card"><Shield/><div><strong>Rosa</strong><span>Giocatori, foto, infortuni e statistiche</span></div></Link><Link href="/matches" className="quick-card"><CalendarDays/><div><strong>Partite</strong><span>Calendario, eventi e valutazioni</span></div></Link><Link href="/stats" className="quick-card"><Trophy/><div><strong>Statistiche</strong><span>Confronti e andamento stagionale</span></div></Link><Link href="/settings" className="quick-card"><Star/><div><strong>Sincronizzazione</strong><span>Aggiorna i dati da ESPN</span></div></Link></section>
  </div>;
}
