"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SeasonSwitcher from "./SeasonSwitcher";

// "short" = scritta breve per la barra in basso del cellulare (poco spazio)
const ITEMS = [
  { href: "/", label: "Dashboard", short: "Home", icon: "M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" },
  { href: "/partite", label: "Partite", short: "Partite", icon: "M4 5h16v14H4zM4 10h16M9 5v14" },
  { href: "/rosa", label: "Rosa", short: "Rosa", icon: "M16 11a4 4 0 10-8 0 4 4 0 008 0zM4 21c0-4 3.5-6 8-6s8 2 8 6" },
  { href: "/statistiche", label: "Statistiche", short: "Stats", icon: "M5 20V10M12 20V4M19 20v-7" },
  {
    href: "/impostazioni",
    label: "Impostazioni",
    short: "Impost.",
    icon: "M12 15a3 3 0 100-6 3 3 0 000 6zM19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 00-2-1.2L14 3h-4l-.6 2.6a7 7 0 00-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 002 1.2L10 21h4l.6-2.6a7 7 0 002-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z",
  },
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
        <div className="border-b border-white/10 px-6 py-3">
          <SeasonSwitcher className="justify-between" />
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
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex justify-around bg-chalk border-t border-white/10"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 px-0.5 pb-2 pt-2 text-center text-[10px] font-medium leading-none ${
              isActive(item.href) ? "text-gold border-t-2 border-gold" : "text-ink/50 border-t-2 border-transparent"
            }`}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d={item.icon} />
            </svg>
            <span className="block w-full truncate">{item.short}</span>
          </Link>
        ))}
      </nav>
    </>
  );
}
