import Link from "next/link";
import MatchCard from "@/components/MatchCard";
import { matchOutcome } from "@/lib/types";
import { headers } from "next/headers";

async function getDashboard() {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host");
  const res = await fetch(`${proto}://${host}/api/dashboard`, { cache: "no-store" });
  return res.json();
}

async function getStandings() {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host");
  const res = await fetch(`${proto}://${host}/api/standings`, { cache: "no-store" });
  return res.json();
}

export default async function DashboardPage() {
  const { lastMatch, nextMatch, lastFive, seasonStats } = await getDashboard();
  const { standings } = await getStandings();
  const juvePosition = standings?.find((s: any) => s.team.name === "Juventus");

  const form = lastFive.map((m: any) => matchOutcome(m));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:px-8">
      <h1 className="scoreboard text-3xl mb-6">Dashboard</h1>

      {/* Ultima e prossima partita */}
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <section className="rounded-lg border border-line bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-steel mb-2">Ultima partita</p>
          {lastMatch ? <MatchCard match={lastMatch} /> : <EmptyState label="Nessuna partita giocata ancora" />}
        </section>
        <section className="rounded-lg border border-line bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-steel mb-2">Prossima partita</p>
          {nextMatch ? <MatchCard match={nextMatch} /> : <EmptyState label="Nessuna partita in programma" />}
        </section>
      </div>

      {/* Forma ultime 5 */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-steel">Ultime 5 partite</h2>
          <div className="flex gap-1.5">
            {form.map((o: string, i: number) => (
              <span
                key={i}
                className={`h-6 w-6 rounded-full text-[10px] font-bold flex items-center justify-center text-white ${
                  o === "win" ? "bg-win" : o === "draw" ? "bg-draw" : "bg-loss"
                }`}
              >
                {o === "win" ? "V" : o === "draw" ? "N" : "P"}
              </span>
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {lastFive.map((m: any) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      </section>

      {/* Statistiche stagionali + posizione classifica */}
      <section className="grid gap-4 sm:grid-cols-2 mb-8">
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-steel mb-3">Statistiche stagione (Serie A + coppe)</p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="Giocate" value={seasonStats.played} />
            <Stat label="Vittorie" value={seasonStats.won} />
            <Stat label="Pareggi" value={seasonStats.drawn} />
            <Stat label="Sconfitte" value={seasonStats.lost} />
            <Stat label="Gol fatti" value={seasonStats.goals_for} />
            <Stat label="Gol subiti" value={seasonStats.goals_against} />
          </div>
        </div>
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-steel mb-3">Classifica Serie A</p>
          {juvePosition ? (
            <div className="flex items-center gap-4">
              <span className="scoreboard text-4xl">{juvePosition.position}°</span>
              <div className="text-sm text-steel">
                <p>{juvePosition.points} punti</p>
                <p>
                  {juvePosition.won}V {juvePosition.drawn}N {juvePosition.lost}P
                </p>
              </div>
            </div>
          ) : (
            <EmptyState label="Classifica non ancora sincronizzata" />
          )}
          <Link href="/statistiche" className="mt-3 inline-block text-xs underline text-steel">
            Vedi classifica completa →
          </Link>
        </div>
      </section>

      <Link
        href="/partite"
        className="inline-block rounded-md border border-line bg-white px-4 py-2 text-sm font-medium hover:bg-ink/5"
      >
        Vai al calendario completo →
      </Link>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="scoreboard text-2xl">{value}</p>
      <p className="text-[11px] text-steel">{label}</p>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <p className="text-sm text-steel py-4">{label}</p>;
}
