import Link from "next/link";
import Image from "next/image";
import { headers } from "next/headers";
import { POSITION_ORDER, POSITION_LABELS } from "@/lib/types";

async function getPlayers() {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host");
  const res = await fetch(`${proto}://${host}/api/players`, { cache: "no-store" });
  return res.json();
}

export default async function RosaPage() {
  const { players } = await getPlayers();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <h1 className="scoreboard text-3xl mb-6">Rosa</h1>

      {(players || []).length === 0 && (
        <p className="text-sm text-steel">
          Rosa non ancora sincronizzata. Verrà popolata automaticamente al prossimo aggiornamento giornaliero.
        </p>
      )}

      <div className="space-y-8">
        {POSITION_ORDER.map((pos) => {
          const group = (players || []).filter((p: any) => p.position === pos);
          if (group.length === 0) return null;
          return (
            <section key={pos}>
              <h2 className="text-sm font-medium uppercase tracking-wide text-steel mb-3">
                {POSITION_LABELS[pos]}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {group.map((p: any) => (
                  <Link
                    key={p.id}
                    href={`/rosa/${p.id}`}
                    className="rounded-lg border border-line bg-white p-3 hover:shadow-sm transition-shadow"
                  >
                    <div className="relative h-20 w-20 mx-auto mb-2 overflow-hidden rounded-full bg-ink/5">
                      {p.photo_url && (
                        <Image src={p.photo_url} alt={p.name} fill sizes="80px" className="object-cover" />
                      )}
                    </div>
                    <p className="text-center text-sm font-medium truncate">{p.name}</p>
                    <p className="text-center text-xs text-steel mb-2">#{p.shirt_number ?? "-"}</p>
                    <div className="flex justify-center gap-3 text-xs text-steel">
                      <span>{p.season_stats.matches_played} PG</span>
                      {pos === "GK" ? (
                        <span>{p.season_stats.goals_conceded} GS</span>
                      ) : (
                        <span>{p.season_stats.goals} G</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
