'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function Login(){
 const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [error,setError]=useState(''); const [loading,setLoading]=useState(false);
 async function submit(e:FormEvent){e.preventDefault();setLoading(true);setError(''); const {error}=await createClient().auth.signInWithPassword({email,password}); if(error)setError(error.message); else location.href='/'; setLoading(false)}
 return <main className="auth-page"><form className="auth-card" onSubmit={submit}><p className="eyebrow">JUVENTUS TRACKER</p><h1>Accedi</h1><p className="muted">I tuoi dati restano sincronizzati tra PC e Samsung.</p><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></label>{error&&<div className="error">{error}</div>}<button className="primary-btn full" disabled={loading}>{loading?'Accesso…':'Accedi'}</button><p className="auth-link">Non hai un account? <Link href="/auth/sign-up">Registrati</Link></p></form></main>
}
