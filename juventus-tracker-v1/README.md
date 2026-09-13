# Juventus Tracker — V1

Web app privata e responsive pensata per essere usata da PC e Samsung/Android con gli stessi dati.

## Stato V2 online-ready

- Dashboard Juventus Tracker
- Rosa giocatori
- Profilo giocatore
- Storico partita-per-partita
- Calendario partite
- Form per valutare una partita
- Valutazione squadra e allenatore
- Struttura per statistiche automatiche
- Schema database Supabase
- Struttura pronta per collegare un provider di dati calcistici

La base è pronta per essere pubblicata con Supabase Auth/Postgres e sincronizzazione server-side ESPN. Serve solo configurare le credenziali del tuo progetto Supabase; ESPN non richiede un token.

## Tecnologia

- Next.js + React + TypeScript
- Supabase/Postgres per sincronizzazione cloud
- @supabase/ssr per sessioni
- CSS responsive senza dipendenze grafiche pesanti

La configurazione segue il quickstart ufficiale Supabase per Next.js.

## Avvio

1. Installa Node.js.
2. Apri un terminale nella cartella del progetto.
3. Esegui:

   npm install
   npm run dev

4. Apri http://localhost:3000

## Sincronizzazione PC + telefono

Per renderla realmente sincronizzata:

1. Crea un progetto Supabase.
2. Copia `.env.example` in `.env.local`.
3. Inserisci:
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
4. Apri Supabase > SQL Editor.
5. Incolla `supabase/schema.sql` ed eseguilo.
6. In V2 collegheremo le pagine ai dati Supabase e aggiungeremo autenticazione.
7. Poi la pubblichiamo su un hosting web: lo stesso account potrà usarla da PC e Samsung.

## Collegamento live

Completato:
- autenticazione privata
- database per utente con RLS
- pagina Impostazioni
- endpoint server-side per ESPN
- struttura pronta per sincronizzazione

Prossimo:
- sincronizzazione fixtures/lineups/statistiche e dati squadra da ESPN
- inserimento e modifica voti
- calendario automatico
- formazioni e panchina automatiche
- eventi live
- statistiche giocatore per singola partita
- xG/xA e altre metriche disponibili dal provider
- aggiornamento automatico senza dover inserire manualmente i dati

Successivo:
- grafici
- forma ultime 5
- MVP
- confronti giocatori
- statistiche carriera Juventus
- notifiche/aggiornamenti live

## Nota importante

Non inserire mai chiavi segrete server-side nel frontend. Le credenziali Supabase pubblicabili sono pensate per essere usate dal client con Row Level Security; le chiavi segrete del provider calcistico andranno invece mantenute sul server.
