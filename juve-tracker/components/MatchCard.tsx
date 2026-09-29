import Link from "next/link";
import { matchOutcome } from "@/lib/types";
import { getTheme, type CompetitionTheme } from "@/lib/competitionThemes";

const OUTCOME_COLOR: Record<string, string> = {
  win: "#2FBE72",
  draw: "#E0A61A",
  loss: "#E14B4B",
  upcoming: "#8A8A87",
};

export default function MatchCard({ match, theme, large }: { match: any; theme?: CompetitionTheme; large?: boolean }) {
  const outcome = matchOutcome(match);
  const date = new Date(match.match_date);
  const t = theme ?? getTheme("all");
  const outcomeColor = OUTCOME_COLOR[outcome];

  return (
    <Link
      href={`/partite/${match.id}`}
      className="block rounded-lg transition-transform hover:-translate-y-0.5"
      style={{ background: t.surface, border: `2px solid ${outcomeColor}` }}
    >
      <div className={`flex items-center justify-between gap-3 ${large ? "px-5 py-4" : "px-4 py-3"}`}>
        <div className="min-w-0">
          <p className={`uppercase tracking-wide ${large ? "text-xs" : "text-[11px]"}`} style={{ color: t.textMuted }}>
            {match.competition?.name} {match.matchday ? `· ${match.matchday}` : ""}
          </p>
          <p className={`truncate font-medium ${large ? "text-lg" : "text-sm"}`} style={{ color: t.text }}>
            {match.is_home ? "Juventus" : match.opponent_name} vs {match.is_home ? match.opponent_name : "Juventus"}
          </p>
          <p className={large ? "text-sm" : "text-xs"} style={{ color: t.textMuted }}>
            {date.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })}
            {" · "}
            {date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className={`scoreboard shrink-0 ${large ? "text-3xl" : "text-xl"}`} style={{ color: outcomeColor }}>
          {match.status === "FINISHED"
            ? `${match.juve_score}-${match.opponent_score}`
            : date.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })}
        </div>
      </div>
    </Link>
  );
}
