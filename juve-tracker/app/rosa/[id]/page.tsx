import { headers } from "next/headers";
import { POSITION_LABELS } from "@/lib/types";
import BackButton from "@/components/BackButton";
import PlayerActions from "@/components/PlayerActions";
import { photoImgStyle } from "@/lib/photo";
import { PLAYER_EXTRA_GROUPS, ALL_EXTRA_KEYS, fmtStat } from "@/lib/statDefs";
import { ratingColors } from "@/lib/ratingColor";

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
  const { player, history, avgRating, coach } = data;
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

  // totali di tutte le statistiche extra + media voto dei siti
  const extraTotals: Record<string, number> = {};
  for (const k of ALL_EXTRA_KEYS) extraTotals[k] = history.reduce((a: number, h: any) => a + Number(h[k] || 0), 0);
  const siteRows = history.filter((h: any) => h.site_rating != null);
  const avgSite = siteRows.length
    ? siteRows.reduce((a: number, h: any) => a + Number(h.site_rating), 0) / siteRows.length
    : null;
  const shots = history.reduce((a: number, h: any) => a + (h.shots_total || 0), 0);
  const shotsOn = history.reduce((a: number, h: any) => a + (h.shots_on_target || 0), 0);
  const passes = history.reduce((a: number, h: any) => a + (h.passes_total || 0), 0);
  const passesKey = history.reduce((a: number, h: any) => a + (h.passes_key || 0), 0);
  const foulsC = history.reduce((a: number, h: any) => a + (h.fouls_committed || 0), 0);
  const foulsS = history.reduce((a: number, h: any) => a + (h.fouls_suffered || 0), 0);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-8">
      <BackButton />

      <div className="flex items-center gap-4 mb-4">
        <div className="relative h-24 w-24 overflow-hidden rounded-full bg-ink/5 shrink-0">
          {player.photo_url && player.photo_url.trim() !== "" && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={player.photo_url}
              alt={player.name}
              className="h-full w-full object-cover"
              style={photoImgStyle(player.photo_focus_y, player.photo_focus_x)}
            />
          )}
        </div>
        <div>
          <h1 className="scoreboard text-2xl">{player.name}</h1>
          <p className="text-sm text-steel">
            {player.position === "CO" ? "Allenatore" : `#${player.shirt_number ?? "-"} · ${POSITION_LABELS[player.position as keyof typeof POSITION_LABELS]}`}
            {player.nationality ? ` · ${player.nationality}` : ""}
          </p>
        </div>
      </div>

      <PlayerActions player={player} />

      {coach && (
        <>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
            <Stat label="Partite" value={coach.played} />
            <Stat label="Vittorie" value={coach.won} />
            <Stat label="Pareggi" value={coach.drawn} />
            <Stat label="Sconfitte" value={coach.lost} />
            <Stat label="% Vittorie" value={coach.played > 0 ? `${Math.round((coach.won / coach.played) * 100)}%` : "-"} />
            <Stat label="Gol fatti" value={coach.goals_for} />
            <Stat label="Gol subiti" value={coach.goals_against} />
            <Stat label="Punti a partita" value={coach.played > 0 ? ((coach.won * 3 + coach.drawn) / coach.played).toFixed(2) : "-"} />
          </div>
          {avgRating != null && (
            <div className="card p-4 mb-8">
              <p className="text-xs uppercase tracking-wide text-steel">Media voti (i tuoi)</p>
              <p className="scoreboard text-3xl">{avgRating.toFixed(2)}</p>
            </div>
          )}
          <h2 className="text-sm font-medium uppercase tracking-wide text-steel mb-3">Partita per partita</h2>
          <div className="overflow-x-auto card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase text-steel">
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Avversario</th>
                  <th className="px-3 py-2">Risultato</th>
                  <th className="px-3 py-2">Voto</th>
                </tr>
              </thead>
              <tbody>
                {coach.matches.map((m: any) => (
                  <tr key={m.id} className="border-b border-line last:border-0">
                    <td className="px-3 py-2 text-steel">
                      {new Date(m.match_date).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })}
                    </td>
                    <td className="px-3 py-2">{m.opponent_name}</td>
                    <td className="px-3 py-2">{m.juve_score}-{m.opponent_score}</td>
                    <td className="px-3 py-2 font-medium">{m.my_rating ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!coach && (<>
      <div className="grid grid-cols-3 sm:grid-cols-7 gap-3 mb-8">
        <Stat label="Presenze" value={history.length} />
        <Stat label="Minuti" value={totals.minutes} />
        <Stat label="Gol" value={totals.goals} />
        <Stat label="Assist" value={totals.assists} />
        {isGK && <Stat label="Parate" value={totals.saves} />}
        <Stat label="Gol subiti" value={totals.goals_conceded} />
        <Stat label="Gialli" value={totals.yellow} />
        <Stat label="Rossi" value={totals.red} />
      </div>

      {(avgRating != null || avgSite != null) && (
        <div className="grid grid-cols-2 gap-3 mb-8">
          {avgRating != null && (
            <div className="card p-4">
              <p className="text-xs uppercase tracking-wide text-steel">Media voti (i tuoi)</p>
              <p className="scoreboard text-3xl">{avgRating.toFixed(2)}</p>
            </div>
          )}
          {avgSite != null && (
            <div className="card p-4">
              <p className="text-xs uppercase tracking-wide text-steel">Media voti dei siti</p>
              <p className="scoreboard text-3xl">{avgSite.toFixed(2)}</p>
            </div>
          )}
        </div>
      )}

      <h2 className="text-sm font-medium uppercase tracking-wide text-steel mb-3">Statistiche generali</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-8">
        <Stat label="Tiri" value={shots} />
        <Stat label="Tiri in porta" value={shotsOn} />
        <Stat label="% Tiri in porta" value={shots > 0 ? `${Math.round((shotsOn / shots) * 100)}%` : "-"} />
        <Stat label="Passaggi" value={passes} />
        <Stat
          label="% Passaggi"
          value={passes > 0 && extraTotals.passes_accurate > 0 ? `${Math.round((extraTotals.passes_accurate / passes) * 100)}%` : "-"}
        />
        <Stat label="Passaggi chiave" value={passesKey} />
        <Stat label="Falli fatti" value={foulsC} />
        <Stat label="Falli subiti" value={foulsS} />
      </div>

      {PLAYER_EXTRA_GROUPS.map((g) => {
        const items = g.stats.filter((d) => (!d.gkOnly || isGK) && extraTotals[d.key] > 0);
        if (items.length === 0) return null;
        return (
          <div key={g.title} className="mb-8">
            <h2 className="text-sm font-medium uppercase tracking-wide text-steel mb-3">{g.title}</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {items.map((d) => (
                <Stat key={d.key} label={d.label} value={fmtStat(extraTotals[d.key], d.decimals)} />
              ))}
            </div>
          </div>
        );
      })}

      <h2 className="text-sm font-medium uppercase tracking-wide text-steel mb-3">Partita per partita</h2>
      <div className="overflow-x-auto card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase text-steel">
              <th className="px-3 py-2">Data</th>
              <th className="px-3 py-2">Avversario</th>
              <th className="px-3 py-2">Min</th>
              <th className="px-3 py-2">G</th>
              <th className="px-3 py-2">A</th>
              {isGK && (
                <>
                  <th className="px-3 py-2">Parate</th>
                  <th className="px-3 py-2">GS</th>
                </>
              )}
              <th className="px-3 py-2">Tiri</th>
              <th className="px-3 py-2">Pass.</th>
              <th className="px-3 py-2">xG</th>
              <th className="px-3 py-2">Voto siti</th>
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
                <td className="px-3 py-2">{h.goals}</td>
                <td className="px-3 py-2">{h.assists}</td>
                {isGK && (
                  <>
                    <td className="px-3 py-2">{h.saves}</td>
                    <td className="px-3 py-2">{h.goals_conceded}</td>
                  </>
                )}
                <td className="px-3 py-2">{h.shots_total ?? 0}</td>
                <td className="px-3 py-2">{h.passes_total ?? 0}</td>
                <td className="px-3 py-2">{h.xg != null ? Number(h.xg).toFixed(2) : "-"}</td>
                <td className="px-3 py-2">
                  {h.site_rating != null ? (
                    <span
                      className="rounded px-1.5 py-0.5 text-xs font-bold"
                      style={{ background: ratingColors(Number(h.site_rating)).bg, color: ratingColors(Number(h.site_rating)).text }}
                    >
                      {Number(h.site_rating).toFixed(1)}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-3 py-2 font-medium">{h.my_rating ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>)}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="card p-3 text-center">
      <p className="scoreboard text-xl">{value}</p>
      <p className="text-[10px] text-steel">{label}</p>
    </div>
  );
}
