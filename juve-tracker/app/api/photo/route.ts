export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

// Scarica la foto dal sito originale al posto del browser, così funzionano anche
// i link che il browser da solo non riesce a mostrare (siti che bloccano le foto
// incollate altrove, link a una PAGINA che contiene la foto, ecc.).
// GET /api/photo?u=<indirizzo della foto o della pagina>

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const MAX_BYTES = 4 * 1024 * 1024; // oltre ~4,5 MB Vercel non restituisce la risposta

function isSafeUrl(raw: string): URL | null {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  const h = u.hostname.toLowerCase();
  if (
    h === "localhost" ||
    h.endsWith(".local") ||
    h.endsWith(".internal") ||
    /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
    h === "::1" ||
    h.startsWith("[")
  )
    return null;
  return u;
}

async function fetchLimited(url: URL, referer?: string) {
  return fetch(url.toString(), {
    redirect: "follow",
    headers: {
      "User-Agent": UA,
      Accept: "image/avif,image/webp,image/apng,image/*,text/html;q=0.8,*/*;q=0.5",
      ...(referer ? { Referer: referer } : {}),
    },
    signal: AbortSignal.timeout(10000),
  });
}

function findOgImage(html: string, base: URL): URL | null {
  const metas = html.match(/<meta[^>]+>/gi) || [];
  for (const m of metas) {
    if (/(property|name)=["'](og:image(:secure_url)?|twitter:image)["']/i.test(m)) {
      const c = m.match(/content=["']([^"']+)["']/i);
      if (c) {
        try {
          return new URL(c[1].replace(/&amp;/g, "&"), base);
        } catch {}
      }
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("u") || "";
  const start = isSafeUrl(raw.trim());
  if (!start) return NextResponse.json({ error: "Indirizzo non valido" }, { status: 400 });

  try {
    // 1° tentativo: senza Referer, poi con il Referer del sito stesso
    let res = await fetchLimited(start);
    if (!res.ok) res = await fetchLimited(start, start.origin + "/");
    if (!res.ok) return NextResponse.json({ error: `Il sito risponde ${res.status}` }, { status: 502 });

    let type = (res.headers.get("content-type") || "").toLowerCase();

    // il link è una pagina: cerca l'immagine principale indicata dalla pagina
    if (type.includes("text/html")) {
      const html = (await res.text()).slice(0, 400_000);
      const img = findOgImage(html, start);
      const safe = img && isSafeUrl(img.toString());
      if (!safe) return NextResponse.json({ error: "Nessuna immagine trovata nella pagina" }, { status: 404 });
      res = await fetchLimited(safe, start.origin + "/");
      if (!res.ok) return NextResponse.json({ error: `Il sito risponde ${res.status}` }, { status: 502 });
      type = (res.headers.get("content-type") || "").toLowerCase();
    }

    const buf = await res.arrayBuffer();
    // alcuni siti dichiarano un tipo generico: riconosci l'immagine dai primi byte
    if (!type.startsWith("image/")) {
      const b = new Uint8Array(buf.slice(0, 12));
      const hex = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
      const sniff = hex.startsWith("ffd8ff")
        ? "image/jpeg"
        : hex.startsWith("89504e47")
        ? "image/png"
        : hex.startsWith("47494638")
        ? "image/gif"
        : hex.startsWith("52494646") && hex.slice(16, 24) === "57454250"
        ? "image/webp"
        : null;
      if (!sniff) return NextResponse.json({ error: "Il link non è un'immagine" }, { status: 415 });
      type = sniff;
    }
    if (buf.byteLength > MAX_BYTES) return NextResponse.json({ error: "Immagine troppo grande" }, { status: 413 });

    return new NextResponse(buf, {
      headers: {
        "Content-Type": type,
        // la foto cambia di rado: il browser (e Vercel) la tengono per un po'
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Errore" }, { status: 502 });
  }
}
