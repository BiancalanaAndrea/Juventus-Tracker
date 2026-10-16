import { supabaseServer } from "@/lib/supabase";
import { seasonBounds } from "@/lib/season";

// Restituisce l'elenco di id-partita per una competizione (short_name) e/o una
// stagione, oppure null se non è stato richiesto alcun filtro (= tutte le partite).
export async function resolveMatchIds(
  db: ReturnType<typeof supabaseServer>,
  competitionShortName: string | null,
  season: number | null = null
): Promise<number[] | null> {
  if (!competitionShortName && season === null) return null;

  let query = db.from("matches").select("id");

  if (competitionShortName) {
    const { data: comp } = await db
      .from("competitions")
      .select("id")
      .eq("short_name", competitionShortName)
      .maybeSingle();
    if (!comp) return [];
    query = query.eq("competition_id", comp.id);
  }
  if (season !== null) {
    const { from, to } = seasonBounds(season);
    query = query.gte("match_date", from).lt("match_date", to);
  }

  const { data: matches } = await query;
  return (matches || []).map((m: any) => m.id);
}
