import Link from "next/link";
import MatchCard from "@/components/MatchCard";
import { headers } from "next/headers";

const TABS = [
  { key: "", label: "Tutte" },
  { key: "serie_a", label: "Serie A" },
  { key: "europa_league", label: "Europa League" },
  { key: "coppa_italia", label: "Coppa Italia" },
];

async function getMatches(competition: string) {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host");
  const qs = competition ? `?competition=${competition}` : "";
  const res = await fetch(`${proto}://${host}/api/matches${qs}`, { cache: "no-store" });
  return res.json();
}

export default async function PartitePage({ searchParams }: { searchParams: { c?: string } }) {
  const active = searchParams.c || "";
  const { matches } = await getMatches(active);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <h1 className="scoreboard text-3xl mb-6">Partite</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key ? `/partite?c=${tab.key}` : "/partite"}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium border ${
              active === tab.key ? "bg-ink text-chalk border-ink" : "border-line text-steel hover:bg-ink/5"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {(matches || []).length === 0 && (
          <p className="text-sm text-steel">Nessuna partita trovata per questa competizione.</p>
        )}
        {(matches || []).map((m: any) => (
          <MatchCard key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}
