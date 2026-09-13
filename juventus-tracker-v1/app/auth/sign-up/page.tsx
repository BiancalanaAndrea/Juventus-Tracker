'use client';
import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
export default function SignUp(){
 const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [message,setMessage]=useState('');const [error,setError]=useState('');
 async function submit(e:FormEvent){e.preventDefault();setError('');setMessage('');const {error}=await createClient().auth.signUp({email,password});if(error)setError(error.message);else setMessage('Registrazione completata. Controlla la tua email se è richiesta la conferma.');}
 return <main className="auth-page"><form className="auth-card" onSubmit={submit}><p className="eyebrow">PRIMO ACCESSO</p><h1>Crea account</h1><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label><label>Password<input type="password" minLength={6} value={password} onChange={e=>setPassword(e.target.value)} required /></label>{error&&<div className="error">{error}</div>}{message&&<div className="success">{message}</div>}<button className="primary-btn full">Crea account</button><p className="auth-link"><Link href="/auth/login">Torna al login</Link></p></form></main>
}
