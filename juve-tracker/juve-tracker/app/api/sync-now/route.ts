import { NextResponse } from "next/server";
import { runSync } from "@/lib/sync";

// Endpoint usato dal pulsante "Sincronizza ora" nella pagina Impostazioni.
// Non richiede il CRON_SECRET perché pensata per l'uso personale
// dell'app: esegue solo letture pubbliche di dati calcistici, senza
// esporre chiavi o dati sensibili.
export async function POST() {
  const result = await runSync();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
