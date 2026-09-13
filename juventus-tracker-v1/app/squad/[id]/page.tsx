import Link from "next/link";
import { ArrowLeft, Activity, Goal, Star, Timer } from "lucide-react";
import { demoPlayers, demoPlayerMatches } from "@/lib/demo-data";

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const player = demoPlayers.find(p => p.id === id) ?? demoPlayers[0];

  return (
    <div>
      <Link href="/squad" className="back-link"><ArrowLeft size={16}/> Torna alla rosa</Link>
      <header className="profile-head">
        <div className="profile-number">{player.number}</div>
        <div><p className="eyebrow">{player.position}</p><h1>{player.name}</h1><p className="muted">Profilo stagione 2026/27 · statistiche predisposte per il feed automatico</p></div>
        <div className="profile-rating"><span>TUA MEDIA</span><strong>{player.averageRating.toFixed(1)}</strong><small>{player.ratingCount} valutazioni</small></div>
      </header>

      <section className="stat-grid">
        <div className="stat-card"><Activity/><span>Presenze</span><strong>{player.appearances}</strong></div>
        <div className="stat-card"><Timer/><span>Minuti</span><strong>{player.minutes}</strong></div>
        <div className="stat-card"><Goal/><span>Gol + Assist</span><strong>{player.goals + player.assists}</strong></div>
        <div className="stat-card"><Star/><span>Miglior voto</span><strong>{player.bestRating.toFixed(1)}</strong></div>
      </section>

      <section className="panel">
        <div className="panel-head"><div><p className="eyebrow">MATCH LOG</p><h3>Partita per partita</h3></div></div>
        <div className="table-wrap"><table><thead><tr><th>Data</th><th>Avversario</th><th>Min</th><th>Gol</th><th>Assist</th><th>Tuo voto</th></tr></thead>
        <tbody>{demoPlayerMatches.map(m=><tr key={m.date+m.opponent}><td>{m.date}</td><td>{m.opponent}</td><td>{m.minutes}</td><td>{m.goals}</td><td>{m.assists}</td><td><b className="gold">{m.rating.toFixed(1)}</b></td></tr>)}</tbody></table></div>
      </section>
    </div>
  );
}