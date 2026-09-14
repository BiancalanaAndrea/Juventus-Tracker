'use client';
import Link from 'next/link';
import {House,Plane,ChevronLeft,ChevronRight} from 'lucide-react';
import {useMemo,useState} from 'react';
export default function DashboardCalendar({matches}:{matches:any[]}){
 const [cursor,setCursor]=useState(new Date(new Date().getFullYear(),new Date().getMonth(),1));
 const days=new Date(cursor.getFullYear(),cursor.getMonth()+1,0).getDate();
 const first=new Date(cursor.getFullYear(),cursor.getMonth(),1).getDay();
 const offset=(first+6)%7;
 const cells=Array.from({length:offset+days},(_,i)=>i<offset?null:i-offset+1);
 const mm=matches.filter(m=>{const d=new Date(m.match_date);return d.getFullYear()===cursor.getFullYear()&&d.getMonth()===cursor.getMonth()&&!/friendly|amichevole/i.test(String(m.competition))});
 const byDay=useMemo(()=>new Map(mm.map(m=>[new Date(m.match_date).getDate(),m])),[mm]);
 return <section className="panel calendar-panel"><div className="panel-head"><div><p className="eyebrow">CALENDARIO</p><h3>{cursor.toLocaleDateString('it-IT',{month:'long',year:'numeric'})}</h3></div><div className="calendar-nav"><button onClick={()=>setCursor(new Date(cursor.getFullYear(),cursor.getMonth()-1,1))}><ChevronLeft/></button><button onClick={()=>setCursor(new Date(cursor.getFullYear(),cursor.getMonth()+1,1))}><ChevronRight/></button></div></div><div className="calendar-grid"><div className="calendar-week">{['Lun','Mar','Mer','Gio','Ven','Sab','Dom'].map(x=><b key={x}>{x}</b>)}</div><div className="calendar-days">{cells.map((day,i)=>{const m=day?byDay.get(day):null;let cls='';if(m&&m.status==='completed'){const js=Number(m.juve_score),os=Number(m.opponent_score);cls=js>os?'cal-win':js===os?'cal-draw':'cal-loss'}const home=m?.raw_provider_json?.header?.competitions?.[0]?.competitors?.find((c:any)=>String(c.team?.id)==='111')?.homeAway==='home';return <div className={`cal-cell ${cls}`} key={i}>{day&&<span className="cal-num">{day}</span>}{m&&<Link href={`/matches/${m.id}`} className="cal-match"><img src={m.opponent_logo_url}/><span>{m.status==='completed'?`${m.juve_score}-${m.opponent_score}`:new Date(m.match_date).toLocaleTimeString('it-IT',{hour:'2-digit',minute:'2-digit'})}</span>{home?<House size={13}/>:<Plane size={13}/>}</Link>}</div>})}</div></div></section>
}
