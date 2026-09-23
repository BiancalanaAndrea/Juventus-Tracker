import { headers } from "next/headers";
import { POSITION_LABELS } from "@/lib/types";
import BackButton from "@/components/BackButton";
import PlayerActions from "@/components/PlayerActions";

async function getPlayer(id: string) {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host");
  const res = await fetch(`${proto}://${host}/api/players/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function PlayerDetailPage({ params }: { params: { id: string } }) {
  const data = await getPlayer(params.id);
  if (!data) return <div className="p-8">Giocatore non trovato.</div>;
  const { player, history, avgRating } = data;
  const isGK = player.position === "GK";

  const totals = history.reduce(
    (acc: any, h: any) => {
      acc.minutes += h.minutes_played;
      acc.goals += h.goals;
      acc.assists += h.assists;
      acc.yellow += h.yellow_cards;
      acc.red += h.red_cards;
      acc.saves += h.saves;
      acc.goals_conceded += h.goals_conceded;
      return acc;
    },
    { minutes: 0, goals: 0, assists: 0, yellow: 0, red: 0, saves: 0, goals_conceded: 0 }
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <BackButton />

      <div className="flex items-center gap-4 mb-4">
        <div className="relative h-24 w-24 overflow-hidden rounded-full bg-ink/5 shrink-0">
          {player.photo_url && player.photo_url.trim() !== "" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={player.photo_url} alt={player.name} className="h-full w-full object-cover" />
          )}
        </div>
        <div>
          <h1 className="scoreboard text-2xl">{player.name}</h1>
          <p className="text-sm text-steel">
            #{player.shirt_number ?? "-"} · {POSITION_LABELS[player.position as keyof typeof POSITION_LABELS]}
            {player.nationality ? ` · ${player.nationality}` : ""}
          </p>
        </div>
      </div>

      <PlayerActions player={player} />

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
        <Stat label="Presenze" value={history.length} />
        <Stat label="Minuti" value={totals.minutes} />
        {isGK ? (
          <>
            <Stat label="Parate" value={totals.saves} />
            <Stat label="Gol subiti" value={totals.goals_conceded} />
          </>
        ) : (
          <>
            <Stat label="Gol" value={totals.goals} />
            <Stat label="Assist" value={totals.assists} />
          </>
        )}
        <Stat label="Gialli" value={totals.yellow} />
        <Stat label="Rossi" value={totals.red} />
      </div>

      {avgRating != null && (
        <div className="rounded-lg border border-line bg-white p-4 mb-8">
          <p className="text-xs uppercase tracking-wide text-steel">Media voti (le tue valutazioni)</p>
          <p className="scoreboard text-3xl">{avgRating.toFixed(2)}</p>
        </div>
      )}

      <h2 className="text-sm font-medium uppercase tracking-wide text-steel mb-3">Partita per partita</h2>
      <div className="overflow-x-auto rounded-lg border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase text-steel">
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Avversario</th>
              <th className="px-3 py-2">Min</th>
              {isGK ? (
                <>
                  <th className="px-3 py-2">Parate</th>
                  <th className="px-3 py-2">GS</th>
                </>
              ) : (
                <>
                  <th className="px-3 py-2">G</th>
                  <th className="px-3 py-2">A</th>
                </>
              )}
              <th className="px-3 py-2">Voto</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h: any) => (
              <tr key={h.id} className="border-b border-line last:border-0">
                <td className="px-3 py-2 text-steel">
                  {new Date(h.match.match_date).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })}
                </td>
                <td className="px-3 py-2">{h.match.opponent_name}</td>
                <td className="px-3 py-2">{h.minutes_played}′</td>
                {isGK ? (
                  <>
                    <td className="px-3 py-2">{h.saves}</td>
                    <td className="px-3 py-2">{h.goals_conceded}</td>
                  </>
                ) : (
                  <>
                    <td className="px-3 py-2">{h.goals}</td>
                    <td className="px-3 py-2">{h.assists}</td>
                  </>
                )}
                <td className="px-3 py-2 font-medium">{h.my_rating ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-line bg-white p-3 text-center">
      <p className="scoreboard text-xl">{value}</p>
      <p className="text-[10px] text-steel">{label}</p>
    </div>
  );
}
