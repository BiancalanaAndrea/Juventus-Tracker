import { createClient } from "@supabase/supabase-js";

// Client "server-side" con la service role key: usato solo dentro le API routes
// (mai esposto al browser). Serve per scrivere/leggere senza restrizioni RLS.
export function supabaseServer() {
  const url = process.env.SUPABASE_URL as string;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  if (!url || !key) {
    throw new Error(
      "Variabili SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY mancanti (vedi .env.example)"
    );
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
