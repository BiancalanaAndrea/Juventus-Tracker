import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { getUser, ratingClass } from '@/lib/data';

export default async function Matches() {
  const { supabase, user } = await getUser(); if(!user)return null;
  const { data: matches } = await supabase.from('matches').select('*').eq('user_id',user.id).order('match_date',{ascending:false});
  const groups=[...new Set((matches??[]).map(m=>m.competition))];
  return <div><header className="topbar"><div><p className="eyebrow">PARTITE</p><h1>Calendario</h1><p className="muted">Le competizioni vengono create automaticamente dai dati del provider.</p></div><Link className="primary-btn" href="/settings"><Plus size={17}/> Sincronizza</Link></header>
  <div className="filters"><button className="filter active">Tutte</button>{groups.map(g=><button className="filter" key={g}>{g}</button>)}</div>
  <section className="panel"><div className="match-list big">{(matches??[]).map(m=><div className="match-row match-row-large" key={m.id}><div><span className="competition">{m.competition}</span><strong>Juventus</strong><span>vs {m.opponent} · {new Date(m.match_date).toLocaleDateString('it-IT')}</span></div><div className="score">{m.juve_score !== null ? `${m.juve_score} - ${m.opponent_score}` : '—'}</div><div>{m.team_rating ? <span className={`rating ${ratingClass(Number(m.team_rating))}`}>{Number(m.team_rating).toFixed(1)}</span> : <span className="pending">Da valutare</span>}</div><ArrowRight size={17}/></div>)}</div>{!matches?.length&&<p className="empty">Nessuna partita. Inserisci il ESPN nelle Impostazioni e avvia la sincronizzazione.</p>}</section></div>
}
