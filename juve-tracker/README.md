# Juve Tracker

App (PWA) per seguire tutte le partite della Juventus — Serie A, Coppa Italia, Europa League — con
rosa, statistiche e le tue valutazioni personali ai giocatori (0-10, step 0.25).

**100% inserimento manuale**: nessuna API esterna, nessuna chiave da procurarsi. Partite e rosa si
aggiungono da moduli dentro l'app; le statistiche dettagliate di ogni partita si importano da un
semplice file di testo. Tutto è salvato su Supabase, quindi sincronizzato automaticamente tra PC e
telefono (inserisci da un dispositivo, lo vedi anche sull'altro).

---

## Cosa serve (tutto gratuito, nessuna carta di credito)

1. Un account **GitHub** → https://github.com/signup
2. Un account **Supabase** (il database) → https://supabase.com
3. Un account **Vercel** (dove "vive" l'app online) → https://vercel.com

---

## Passo 1 — Crea il database su Supabase

1. Vai su https://supabase.com → **New project**. Scegli un nome (es. `juve-tracker`) e una password
   per il database (tienila da parte).
2. Aspetta che il progetto sia pronto (1-2 minuti).
3. Nel menu a sinistra vai su **SQL Editor** → **New query**.
4. Apri il file `supabase/schema.sql` di questo progetto, copia **tutto** il contenuto, incollalo
   nell'editor e clicca **Run**. Crea tutte le tabelle (partite, giocatori, statistiche, voti,
   classifica) e inserisce già le 3 competizioni (Serie A, Coppa Italia, Europa League).
5. Vai su **Project Settings → API**. Ti servono due valori:
   - **Project URL** → sarà `SUPABASE_URL`
   - **service_role key** (sotto "Project API keys", NON la "anon" key) → sarà `SUPABASE_SERVICE_ROLE_KEY`

   ⚠️ La `service_role key` è potente: non va mai nel codice del frontend, solo nelle variabili
   d'ambiente del server. In questo progetto è usata solo dentro le API routes di Next.js.

---

## Passo 2 — Carica il codice su GitHub

1. Crea un nuovo repository vuoto su GitHub (es. `juve-tracker`).
2. Assicurati che il file `package.json` finisca **nella pagina principale del repository**, non
   dentro una sottocartella — altrimenti Vercel non troverà il progetto.
3. Da terminale:
   ```bash
   cd juve-tracker
   git init
   git add .
   git commit -m "Prima versione di Juve Tracker"
   git branch -M main
   git remote add origin https://github.com/TUO-USERNAME/juve-tracker.git
   git push -u origin main
   ```

---

## Passo 3 — Collega tutto su Vercel

1. Vai su https://vercel.com → **Add New → Project** → importa il repository da GitHub.
2. Controlla che **Framework Preset** sia impostato su **Next.js** (dovrebbe essere automatico).
3. Se il tuo `package.json` è dentro una sottocartella, imposta **Root Directory** su quella cartella
   (Settings → General).
4. Prima di cliccare "Deploy", apri **Environment Variables** e inserisci:

   | Nome | Valore |
   |---|---|
   | `SUPABASE_URL` | il Project URL di Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | la service_role key di Supabase |

5. Clicca **Deploy**. Dopo 1-2 minuti l'app è online su un indirizzo tipo
   `https://juve-tracker-tuonome.vercel.app`.

---

## Passo 4 — Installa l'app su PC e telefono

- **PC (Chrome/Edge):** apri il sito, clicca l'icona "Installa" nella barra degli indirizzi.
- **Telefono Android (Chrome):** menu ⋮ → "Installa app" / "Aggiungi a schermata Home".
- **iPhone (Safari):** tasto Condividi → "Aggiungi a schermata Home".

---

## Come inserire i dati

### Aggiungere una partita
Sezione **Partite → + Nuova partita**: competizione, giornata, avversario, casa/trasferta, data,
stadio, stato (da giocare / giocata / rinviata) ed eventuale risultato.

### Importare le statistiche di una partita
Apri la partita dalla sezione Partite, poi **"Importa statistiche (file .txt)"**. Puoi caricare un
file `.txt` o incollare direttamente il testo, in questo formato:

```
SQUADRA: possesso=58 tiri=14 tiri_porta=6 angoli=5 falli=10 gialli=2 rossi=0 fuorigioco=3 passaggi=480 precisione=87
AVVERSARIO: possesso=42 tiri=8 tiri_porta=3 angoli=2 falli=14 gialli=3 rossi=1 fuorigioco=1 passaggi=320 precisione=79
GIOCATORI:
numero=7 minuti=90 gol=1 assist=0 tiri=3 tiri_porta=2 passaggi=20 falli_fatti=1 falli_subiti=3 gialli=0 rossi=0 titolare=si
numero=10 minuti=85 gol=0 assist=1 passaggi=35 falli_fatti=0 falli_subiti=2 gialli=1 titolare=si
numero=1 minuti=90 parate=4 gol_subiti=1 titolare=si
```

Regole:
- Le righe `SQUADRA:` e `AVVERSARIO:` sono le statistiche di squadra (facoltative, puoi mettere solo
  quello che hai).
- Dopo `GIOCATORI:`, ogni riga è un giocatore: `numero=` deve corrispondere al **numero di maglia**
  impostato in Rosa — è così che l'app capisce a chi assegnare le statistiche.
- Puoi omettere qualsiasi campo: quelli non scritti restano a 0.
- Le righe che iniziano con `//` vengono ignorate (utile per appunti tuoi nel file).
- Dopo l'importazione, l'app ti mostra un riepilogo di cosa è stato salvato e segnala eventuali numeri
  di maglia non trovati in rosa.

Le **tue valutazioni ai giocatori** (0-10, step 0,25) si inseriscono a parte, direttamente sulla
partita, con il pulsante +/− accanto a ogni giocatore.

### Gestire la rosa
Sezione **Rosa → + Nuovo giocatore**: nome, ruolo, numero di maglia, nazionalità, foto (facoltativa,
solo un link a un'immagine online).

### Aggiornare la classifica
Sezione **Statistiche → + Aggiorna riga**: inserisci/aggiorna posizione, punti, V/N/P, gol fatti/subiti
per qualsiasi squadra. Spunta "è la Juventus" sulla riga della Juve per farla comparire evidenziata in
Dashboard.

---

## Struttura del progetto

```
app/
  page.tsx                     → Dashboard
  partite/page.tsx             → Lista partite + nuova partita
  partite/[id]/page.tsx        → Dettaglio partita, import statistiche, valutazioni
  rosa/page.tsx                → Rosa per reparto + nuovo giocatore
  rosa/[id]/page.tsx           → Dettaglio giocatore
  statistiche/page.tsx         → Statistiche complete + classifica manuale
  impostazioni/page.tsx        → Guida rapida
  api/                         → backend (Next.js API routes)
lib/
  supabase.ts                  → client database
  statsTxtParser.ts            → interprete del formato .txt delle statistiche
  types.ts                     → tipi condivisi
supabase/schema.sql            → schema completo del database
```

## Limiti da conoscere

- Le statistiche giocatore si associano per **numero di maglia**: se cambi la maglia di un giocatore a
  stagione in corso, i file .txt più vecchi restano collegati al numero con cui li hai importati —
  meglio non riassegnare un numero già usato nella stessa stagione.
- Non c'è alcuna importazione automatica: se non inserisci una partita o non importi le statistiche,
  l'app semplicemente non le mostra.
