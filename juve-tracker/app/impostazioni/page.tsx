export default function ImpostazioniPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-8">
      <h1 className="scoreboard text-3xl mb-6">Impostazioni</h1>

      <section className="rounded-lg border border-line bg-white p-4 mb-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-steel mb-2">Come inserire i dati</h2>
        <ul className="space-y-2 text-sm text-steel list-disc pl-4">
          <li>
            <b className="text-ink">Partite:</b> aggiungile a mano dalla sezione Partite con "+ Nuova partita".
          </li>
          <li>
            <b className="text-ink">Statistiche di una partita:</b> apri la partita e usa "Importa statistiche (file .txt)" —
            puoi caricare un file oppure incollare il testo.
          </li>
          <li>
            <b className="text-ink">Valutazioni ai giocatori:</b> le dai tu direttamente dentro ogni partita, da 0 a 10 con
            incrementi di 0,25.
          </li>
          <li>
            <b className="text-ink">Rosa:</b> aggiungi/rimuovi giocatori dalla sezione Rosa con "+ Nuovo giocatore".
          </li>
          <li>
            <b className="text-ink">Classifica:</b> aggiornala dalla sezione Statistiche con "+ Aggiorna riga".
          </li>
        </ul>
      </section>

      <section className="rounded-lg border border-line bg-white p-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-steel mb-2">Installa l'app</h2>
        <p className="text-sm text-steel">
          Da PC: apri il sito in Chrome/Edge e clicca l'icona "Installa app" nella barra degli indirizzi.
          <br />
          Da telefono: apri il sito, poi "Aggiungi a schermata Home" (Safari) o "Installa app" (Chrome Android).
        </p>
      </section>
    </div>
  );
}
