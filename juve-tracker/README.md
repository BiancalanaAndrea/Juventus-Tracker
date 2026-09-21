# Juve Tracker

App (PWA) per seguire tutte le partite della Juventus — Serie A, Coppa Italia, Europa League — con
rosa, statistiche, classifica e le tue valutazioni personali ai giocatori (0-10, step 0.25).

Dati importati automaticamente ogni giorno da API-Football. Funziona da PC e da telefono (si installa
come un'app vera, senza App Store).

---

## Cosa serve (tutto gratuito, nessuna carta di credito)

1. Un account **GitHub** (per caricare il codice) → https://github.com/signup
2. Un account **Supabase** (il database) → https://supabase.com
3. Un account **Vercel** (dove "vive" l'app online) → https://vercel.com
4. Una chiave **API-Football** → https://www.api-football.com (piano Free, 100 richieste/giorno)

---

## Passo 1 — Crea il database su Supabase

1. Vai su https://supabase.com → **New project**. Scegli un nome (es. `juve-tracker`) e una password
   per il database (salvala da parte, non serve altrove ma tienila).
2. Aspetta che il progetto sia pronto (1-2 minuti).
3. Nel menu a sinistra vai su **SQL Editor** → **New query**.
4. Apri il file `supabase/schema.sql` di questo progetto, copia **tutto** il contenuto, incollalo
   nell'editor e clicca **Run**. Questo crea tutte le tabelle (partite, giocatori, statistiche, voti...).
5. Vai su **Project Settings → API**. Ti servono due valori per dopo:
   - **Project URL** → sarà `SUPABASE_URL`
   - **service_role key** (sotto "Project API keys", NON la "anon" key) → sarà `SUPABASE_SERVICE_ROLE_KEY`

   ⚠️ La `service_role key` è potente: non va mai messa nel codice del frontend, solo nelle variabili
   d'ambiente del server (come spiegato sotto). In questo progetto viene usata solo dentro le API
   routes di Next.js, mai nel browser.

---

## Passo 2 — Ottieni la chiave API-Football

1. Registrati su https://www.api-football.com (o via RapidAPI, come preferisci) e attiva il piano **Free**.
2. Nella tua dashboard trovi la **API Key**: sarà `API_FOOTBALL_KEY`.
3. Verifica l'ID della Juventus: chiama (anche solo dal browser, sostituendo TUACHIAVE)
   `https://v3.football.api-sports.io/teams?name=Juventus` con l'header richiesto, oppure fidati del
   valore di default già impostato nel progetto (`496`), che è corretto al momento della scrittura.
4. Annota anche l'anno della stagione corrente, es. `2026` per la stagione 2026/2027 → `SEASON_YEAR`.

---

## Passo 3 — Carica il codice su GitHub

1. Crea un nuovo repository vuoto su GitHub (es. `juve-tracker`).
2. Da questa cartella, sul tuo PC:
   ```bash
   cd juve-tracker
   git init
   git add .
   git commit -m "Prima versione di Juve Tracker"
   git branch -M main
   git remote add origin https://github.com/TUO-USERNAME/juve-tracker.git
   git push -u origin main
   ```
   (Se non hai `git` installato, puoi anche caricare la cartella zippata direttamente su GitHub
   tramite "Upload files" dal sito, decomprimendola prima.)

---

## Passo 4 — Collega tutto su Vercel

1. Vai su https://vercel.com → **Add New → Project** → importa il repository `juve-tracker` da GitHub.
2. Prima di cliccare "Deploy", apri **Environment Variables** e inserisci queste 5 variabili
   (i valori raccolti nei passi precedenti):

   | Nome | Valore |
   |---|---|
   | `SUPABASE_URL` | il Project URL di Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | la service_role key di Supabase |
   | `API_FOOTBALL_KEY` | la tua chiave API-Football |
   | `JUVENTUS_API_ID` | `496` (o il valore verificato al Passo 2) |
   | `SEASON_YEAR` | `2026` |
   | `CRON_SECRET` | una stringa lunga a caso, inventata da te (es. generata su https://1password.com/password-generator) |

3. Clicca **Deploy**. Dopo 1-2 minuti la tua app sarà online su un indirizzo tipo
   `https://juve-tracker-tuonome.vercel.app`.

Il file `vercel.json` incluso nel progetto configura già un **Cron Job gratuito** che ogni giorno alle
6:00 chiama automaticamente `/api/cron/sync`, che scarica partite, statistiche, rosa e classifica
aggiornate e le salva nel database. Non devi fare nulla: parte da solo dopo il deploy.

---

## Passo 5 — Primo popolamento dei dati

Il cron gira una volta al giorno, ma per non aspettare fino a domattina:

1. Apri la tua app appena pubblicata.
2. Vai su **Impostazioni → Sincronizza ora**.
3. Aspetta qualche secondo: verranno importate tutte le partite della stagione per Serie A, Coppa
   Italia ed Europa League, la rosa, le statistiche delle partite già giocate e la classifica.

---

## Passo 6 — Installa l'app su PC e telefono

- **PC (Chrome/Edge):** apri il sito, clicca l'icona "Installa" nella barra degli indirizzi.
- **Telefono Android (Chrome):** menu ⋮ → "Installa app" / "Aggiungi a schermata Home".
- **iPhone (Safari):** tasto Condividi → "Aggiungi a schermata Home".

Da quel momento l'app si apre a schermo intero con la sua icona, come un'app scaricata da uno store.

---

## Come funziona l'automazione

- Ogni giorno alle 6:00 il cron di Vercel importa da API-Football: partite (nuove e aggiornate),
  statistiche di squadra e giocatori delle partite finite, rosa, classifica Serie A.
- Se **modifichi manualmente** una partita (data, luogo, note, risultato) dalla sezione Partite, quella
  partita viene marcata come "modificata manualmente" e la sincronizzazione automatica non sovrascrive
  più il risultato — resta comunque aggiornata per le statistiche.
- Le **tue valutazioni ai giocatori** (0-10, step 0.25) sono sempre e solo tue: l'API non le tocca mai.

## Struttura del progetto

```
app/
  page.tsx                  → Dashboard
  partite/page.tsx          → Lista partite (con i 4 filtri)
  partite/[id]/page.tsx     → Dettaglio partita + valutazioni
  rosa/page.tsx             → Rosa per reparto
  rosa/[id]/page.tsx        → Dettaglio giocatore
  statistiche/page.tsx      → Statistiche complete + classifica
  impostazioni/page.tsx     → Sincronizzazione manuale, info
  api/                      → backend (Next.js API routes)
lib/
  apiFootball.ts            → chiamate ad API-Football
  supabase.ts                → client database
  sync.ts                    → logica di importazione automatica
  types.ts                   → tipi condivisi
supabase/schema.sql          → schema completo del database
```

## Limiti da conoscere

- Piano free API-Football: **100 richieste al giorno**. La sincronizzazione giornaliera ne usa circa
  10-20 a seconda di quante partite sono finite di recente — ampio margine anche premendo
  "Sincronizza ora" più volte al giorno.
- Le statistiche dettagliate (possesso palla, tiri, ecc.) sono disponibili solo per le partite già
  **finite** — non esistono prima del fischio d'inizio.
