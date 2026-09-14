'use client';
import Link from 'next/link';
import {House,Plane,ChevronLeft,ChevronRight} from 'lucide-react';
import {useMemo,useState} from 'react';
export default function DashboardCalendar({matches}:{matches:any[]}){
 const now=new Date(); const [cursor,setCursor]=useState(new Date(now.getFullYear(),now.getMonth(),1));
 const ym=cursor.getFullYear()+'-'+cursor.getMonth();
 const days=new Date(cursor.getFullYear(),cursor.getMonth()+1,0).getDate(); const first=new Date(cursor.getFullYear(),cursor.getMonth(),1).getDay();
 const offset=(first+6)%7; const cells=Array.from({length:offset+days},(_,i)=>i<offset?null:i-offset+1);
 const mm=matches.filter(m=>{const d=new Date(m.match_date);return d.getFullYear()===cursor.getFullYear()&&d.getMonth()===cursor.getMonth()});
 const byDay=useMemo(()=>new Map(mm.map(m=>[new Date(m.match_date).getDate(),m])),[mm]);
 const homeOf=(m:any)=>{const raw=m.raw_provider_json?.header?.competitions?.[0]?.competitors||m.raw_provider_json?.competitions?.[0]?.competitors||[];const j=raw.find((c:any)=>String(c.team?.id)==='111');if(j)return j.homeAway==='home';return /juventus/i.test(String(m.raw_provider_json?.homeTeam?.displayName||m.raw_provider_json?.homeTeam?.name||''));};
 return <section className="panel calendar-panel" style={{marginLeft:0,marginRight:0,maxWidth:'none'}}><div className="panel-head"><div><p className="eyebrow">CALENDARIO</p><h3>{cursor.toLocaleDateString('it-IT',{month:'long',year:'numeric'})}</h3></div><div className="calendar-nav"><button onClick={()=>setCursor(new Date(cursor.getFullYear(),cursor.getMonth()-1,1))}><ChevronLeft/></button><button onClick={()=>setCursor(new Date(cursor.getFullYear(),cursor.getMonth()+1,1))}><ChevronRight/></button></div></div><div className="calendar-grid"><div className="calendar-week">{['Lun','Mar','Mer','Gio','Ven','Sab','Dom'].map(x=><b key={x}>{x}</b>)}</div><div className="calendar-days">{cells.map((day,i)=>{const m=day?byDay.get(day):null;let cls='';if(m&&m.status==='completed'){const js=Number(m.juve_score),os=Number(m.opponent_score);const win=js>os,draw=js===os;cls=win?'cal-win':draw?'cal-draw':'cal-loss'}return <div className={`cal-cell ${cls}`} key={i}>{day&&<span className="cal-num">{day}</span>}{m&&<Link href={`/matches/${m.id}`} className="cal-match"><img src={m.opponent_logo_url}/><span>{m.status==='completed'?`${(()=>{return `${m.juve_score}-${m.opponent_score}`})()}`:new Date(m.match_date).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}</span>{(()=>{return homeOf(m)?<House size={13}/>:<Plane size={13}/>})()}</Link>}</div>})}</div></div></section>
}
