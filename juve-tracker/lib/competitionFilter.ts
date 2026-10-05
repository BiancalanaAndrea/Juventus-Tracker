import { supabaseServer } from "@/lib/supabase";

// Restituisce l'elenco di id-partita per una competizione (short_name), oppure
// null se non è stato richiesto alcun filtro (= considera tutte le partite).
export async function resolveMatchIds(
  db: ReturnType<typeof supabaseServer>,
  competitionShortName: string | null
): Promise<number[] | null> {
  if (!competitionShortName) return null;

  const { data: comp } = await db
    .from("competitions")
    .select("id")
    .eq("short_name", competitionShortName)
    .maybeSingle();
  if (!comp) return [];

  const { data: matches } = await db.from("matches").select("id").eq("competition_id", comp.id);
  return (matches || []).map((m) => m.id);
}
