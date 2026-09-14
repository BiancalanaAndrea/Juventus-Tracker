'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function Settings(){
 const [provider,setProvider]=useState('highlightly');
 const [season,setSeason]=useState('2026/27');
 const [apiKey,setApiKey]=useState('');
 const [hasKey,setHasKey]=useState(false);
 const [msg,setMsg]=useState('');
 const [busy,setBusy]=useState(false);
 const client=createClient();
 useEffect(()=>{(async()=>{const {data:{user}}=await client.auth.getUser();if(!user)return;const {data}=await client.from('tracker_settings').select('provider,season,football_api_key').eq('user_id',user.id).maybeSingle();if(data){setProvider(data.provider||'highlightly');setSeason(data.season||'2026/27');setHasKey(Boolean(data.football_api_key));}})()},[]);
 async function save(){setMsg('');const {data:{user}}=await client.auth.getUser();if(!user)return;const payload:any={user_id:user.id,provider:'highlightly',season,updated_at:new Date().toISOString()};if(apiKey.trim())payload.football_api_key=apiKey.trim();const {error}=await client.from('tracker_settings').upsert(payload,{onConflict:'user_id'});if(!error){setProvider('highlightly');setApiKey('');setHasKey(true);}setMsg(error?error.message:'Impostazioni salvate.');}
 async function sync(){setBusy(true);setMsg('Sincronizzazione Highlightly in corso…');const r=await fetch('/api/sync',{method:'POST'});const j=await r.json();setMsg(r.ok?`Sincronizzazione completata: ${j.savedMatches} partite sincronizzate.`:(j.error||'Errore'));setBusy(false)}
 async function signOut(){await client.auth.signOut();location.href='/auth/login'}
 return <div><header className="topbar"><div><p className="eyebrow">IMPOSTAZIONI</p><h1>Gestione</h1><p className="muted">Provider, stagione e sincronizzazione.</p></div><button className="filter" onClick={signOut}>Esci</button></header><section className="panel settings-panel"><label>Provider<select value={provider} onChange={e=>setProvider(e.target.value)}><option value="highlightly">Highlightly — Free</option></select></label><label>Stagione<input value={season} onChange={e=>setSeason(e.target.value)}/></label><label>API Key Highlightly<input type="password" placeholder={hasKey?'••••••••••••••••••••':'Incolla qui la tua API Key'} value={apiKey} onChange={e=>setApiKey(e.target.value)} autoComplete="off"/><small className="muted">La chiave viene salvata nel tuo account Supabase e non viene mostrata nel sito.</small></label><div className="settings-actions"><button className="primary-btn" onClick={save}>Salva</button><button className="filter" onClick={sync} disabled={busy||!hasKey}>{busy?'Sincronizzazione…':'Sincronizza Highlightly'}</button></div>{msg&&<p className={msg.includes('completata')||msg.includes('salvate')?'success':'error'}>{msg}</p>}<p className="muted settings-note">Highlightly Free/BASIC fornisce 100 richieste al giorno. Il tracker salva i dati in Supabase e usa una sincronizzazione mirata per evitare richieste inutili.</p></section></div>
}
