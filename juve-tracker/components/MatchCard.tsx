import Link from "next/link";
import { matchOutcome, OUTCOME_STYLES, type Match } from "@/lib/types";

export default function MatchCard({ match }: { match: any }) {
  const outcome = matchOutcome(match);
  const opponent = match.is_home ? match.away_team : match.home_team;
  const date = new Date(match.match_date);

  return (
    <Link
      href={`/partite/${match.id}`}
      className={`block rounded-lg border px-4 py-3 transition-shadow hover:shadow-sm ${OUTCOME_STYLES[outcome]}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide opacity-70">
            {match.competition?.name} · {match.matchday}
          </p>
          <p className="truncate font-medium text-ink">
            {match.is_home ? "Juventus" : opponent?.name} vs {match.is_home ? opponent?.name : "Juventus"}
          </p>
          <p className="text-xs opacity-70">
            {date.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })}
            {" · "}
            {date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="scoreboard text-xl shrink-0">
          {match.status === "FINISHED"
            ? `${match.home_score}-${match.away_score}`
            : date.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })}
        </div>
      </div>
    </Link>
  );
}
