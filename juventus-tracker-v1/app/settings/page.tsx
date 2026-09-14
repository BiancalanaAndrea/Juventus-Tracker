'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
export default function Settings(){
 const [provider,setProvider]=useState('espn');const [season,setSeason]=useState('2026/27');const [msg,setMsg]=useState('');const [busy,setBusy]=useState(false);
 const client=createClient();
 useEffect(()=>{(async()=>{const {data:{user}}=await client.auth.getUser();if(!user)return;const {data}=await client.from('tracker_settings').select('provider,season').eq('user_id',user.id).maybeSingle();if(data){setProvider('espn');setSeason(data.season||'2026/27')}})()},[]);
 async function save(){setMsg('');const {data:{user}}=await client.auth.getUser();if(!user)return;const {error}=await client.from('tracker_settings').upsert({user_id:user.id,provider:'espn',season,football_api_key:null},{onConflict:'user_id'});setProvider('espn');setMsg(error?error.message:'Impostazioni salvate.');}
 async function sync(){setBusy(true);setMsg('Sincronizzazione in corso…');const r=await fetch('/api/sync',{method:'POST'});const j=await r.json();setMsg(r.ok?`Sincronizzazione completata: ${j.savedMatches} partite, ${j.squad} giocatori.`:(j.error||'Errore'));setBusy(false)}
 async function signOut(){await client.auth.signOut();location.href='/auth/login'}
 return <div><header className="topbar"><div><p className="eyebrow">IMPOSTAZIONI</p><h1>Gestione</h1><p className="muted">Provider, stagione e sincronizzazione.</p></div><button className="filter" onClick={signOut}>Esci</button></header><section className="panel settings-panel"><label>Provider<select value={provider} onChange={e=>setProvider(e.target.value)}><option value="espn">ESPN — gratuito</option></select></label><label>Stagione<input value={season} onChange={e=>setSeason(e.target.value)}/></label><div className="settings-actions"><button className="primary-btn" onClick={save}>Salva</button><button className="filter" onClick={sync} disabled={busy}>{busy?'Sincronizzazione…':'Aggiorna dati automaticamente'}</button></div>{msg&&<p className={msg.includes('completata')||msg.includes('salvate')?'success':'error'}>{msg}</p>}<p className="muted settings-note">I dati sportivi vengono sincronizzati automaticamente da ESPN senza token. Le partite, la rosa, le statistiche e i tuoi voti vengono salvati nel tuo account Supabase.</p></section></div>
}
