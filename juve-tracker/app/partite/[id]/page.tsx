import { headers } from "next/headers";
import MatchDetailClient from "@/components/MatchDetailClient";

async function getMatch(id: string) {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("host");
  const res = await fetch(`${proto}://${host}/api/matches/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

export default async function MatchDetailPage({ params }: { params: { id: string } }) {
  const data = await getMatch(params.id);
  if (!data) return <div className="p-8">Partita non trovata.</div>;
  return <MatchDetailClient initial={data} />;
}
