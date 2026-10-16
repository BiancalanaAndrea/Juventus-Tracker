import Link from "next/link";
import { matchOutcome } from "@/lib/types";
import { getTheme, type CompetitionTheme } from "@/lib/competitionThemes";

const OUTCOME_COLOR: Record<string, string> = {
  win: "#2FBE72",
  draw: "#E0A61A",
  loss: "#E14B4B",
  upcoming: "#8A8A87",
};

const PHASE_COLOR: Record<number, string> = { 1: "#8A8A87", 2: "#F5C518", 3: "#2FBE72" };
const PHASE_LABEL: Record<number, string> = {
  1: "Fase 1/3: partita creata",
  2: "Fase 2/3: giocatori e voti inseriti",
  3: "Fase 3/3: statistiche importate",
};

function PhaseIcon({ phase }: { phase: number }) {
  const color = PHASE_COLOR[phase] ?? PHASE_COLOR[1];
  return (
    <span title={PHASE_LABEL[phase] ?? PHASE_LABEL[1]} aria-label={PHASE_LABEL[phase] ?? PHASE_LABEL[1]} className="inline-flex">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill={color} />
        {phase >= 3 && (
          <path d="M7.5 12.5l3 3 6-6.5" stroke="#0A0A0A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </span>
  );
}

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
      <div className={`flex items-center justify-between gap-3 ${large ? "px-5 py-4" : "px-4 py-3.5"}`}>
        <div className="min-w-0">
          <p className={`uppercase tracking-wide ${large ? "text-xs" : "text-xs"}`} style={{ color: t.textMuted }}>
            {match.competition?.name} {match.matchday ? `· ${match.matchday}` : ""}
          </p>
          <p className={`truncate font-medium ${large ? "text-lg" : "text-base"}`} style={{ color: t.text }}>
            {match.is_home ? "Juventus" : match.opponent_name} vs {match.is_home ? match.opponent_name : "Juventus"}
          </p>
          <p className={large ? "text-sm" : "text-sm"} style={{ color: t.textMuted }}>
            {date.toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric" })}
            {" · "}
            {date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <div className={`scoreboard ${large ? "text-3xl" : "text-2xl"}`} style={{ color: outcomeColor }}>
            {match.status === "FINISHED"
              ? `${match.juve_score}-${match.opponent_score}`
              : date.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })}
          </div>
          <PhaseIcon phase={match.phase ?? 1} />
        </div>
      </div>
    </Link>
  );
}
