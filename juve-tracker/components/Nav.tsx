"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/partite", label: "Partite" },
  { href: "/rosa", label: "Rosa" },
  { href: "/statistiche", label: "Statistiche" },
  { href: "/impostazioni", label: "Impostazioni" },
];

export default function Nav() {
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      {/* Desktop: sidebar fissa, nera con accento oro */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-64 md:flex-col bg-chalk text-ink">
        <div className="px-6 pt-8 pb-6 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-ink">
              <span className="scoreboard text-lg font-bold text-chalk">J</span>
            </span>
            <div>
              <p className="scoreboard text-lg leading-none tracking-wide">JUVE</p>
              <p className="scoreboard text-lg leading-none tracking-wide text-gold">TRACKER</p>
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-1 px-3 py-4">
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(item.href) ? "bg-white/10 text-ink" : "text-ink/60 hover:bg-white/5 hover:text-ink"
              }`}
            >
              {isActive(item.href) && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 bg-gold rounded-full" />
              )}
              <span className="pl-2">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="mt-auto px-6 py-4 stripes-bianconere h-10 opacity-80" />
      </aside>

      {/* Mobile: barra in basso, nera */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex justify-around bg-chalk"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 py-3 text-center text-xs font-medium ${
              isActive(item.href) ? "text-gold border-t-2 border-gold" : "text-ink/50 border-t-2 border-transparent"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
