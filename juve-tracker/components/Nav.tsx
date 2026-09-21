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
      {/* Desktop: sidebar fissa */}
      <aside className="hidden md:flex md:fixed md:inset-y-0 md:left-0 md:w-64 md:flex-col border-r border-line bg-white">
        <div className="px-6 py-8">
          <span className="scoreboard text-2xl">JUVE TRACKER</span>
        </div>
        <nav className="flex flex-col gap-1 px-3">
          {ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive(item.href) ? "bg-ink text-chalk" : "text-steel hover:bg-ink/5"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Mobile: barra in basso, con safe-area per le tacche dei telefoni */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex justify-around border-t border-line bg-white"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex-1 py-3 text-center text-xs font-medium ${
              isActive(item.href) ? "text-ink border-t-2 border-ink" : "text-steel border-t-2 border-transparent"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
