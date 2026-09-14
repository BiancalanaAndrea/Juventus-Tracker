 "use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { demoPlayers } from "@/lib/demo-data";

export default function NewMatch() {
  const [teamRating, setTeamRating] = useState("7");
  const [coachRating, setCoachRating] = useState("7");
  return (
    <div>
      <Link href="/matches" className="back-link"><ArrowLeft size={16}/> Torna alle partite</Link>
      <header className="topbar"><div><p className="eyebrow">NUOVA VALUTAZIONE</p><h1>Registra partita</h1><p className="muted">Per ora inserisci solo le informazioni che vuoi controllare personalmente.</p></div><button className="primary-btn"><Save size={17}/> Salva</button></header>
      <section className="form-grid">
        <div className="panel"><h3>Partita</h3><div className="fields"><label>Avversario<input defaultValue="Inter"/></label><label>Competizione<select defaultValue="Serie A"><option>Serie A</option><option>Champions League</option><option>Coppa Italia</option></select></label><label>Data<input type="date"/></label><label>Risultato<input placeholder="es. 2 - 1"/></label></div></div>
        <div className="panel"><h3>Le tue valutazioni</h3><div className="rating-input"><label>Juventus<input type="number" min="1" max="10" step=".1" value={teamRating} onChange={e=>setTeamRating(e.target.value)}/></label><label>Allenatore<input type="number" min="1" max="10" step=".1" value={coachRating} onChange={e=>setCoachRating(e.target.value)}/></label></div></div>
      </section>
      <section className="panel"><div className="panel-head"><div><p className="eyebrow">ROSA</p><h3>Convocati / XI</h3></div><span className="muted">In V2 questi dati potranno arrivare automaticamente dal provider</span></div>
        <div className="selection-grid">{demoPlayers.map(p=><label className="select-player" key={p.id}><input type="checkbox"/><span className="avatar">{p.number}</span><span><b>{p.name}</b><small>{p.position}</small></span><input className="small-rating" type="number" min="1" max="10" step=".1" placeholder="Voto"/></label>)}</div>
      </section>
    </div>
  );
}