import { NextRequest, NextResponse } from "next/server";
import { runSync } from "@/lib/sync";

// Chiamata automaticamente ogni giorno da Vercel Cron (vedi vercel.json).
// Protetta da CRON_SECRET così nessun altro può invocarla e consumare le
// tue richieste giornaliere verso API-Football.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }
  const result = await runSync();
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
