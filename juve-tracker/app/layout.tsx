import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import SeasonProvider from "@/components/SeasonProvider";
import SeasonSwitcher from "@/components/SeasonSwitcher";

export const metadata: Metadata = {
  title: "Juve Tracker",
  description: "Tutte le partite, la rosa e le statistiche della Juventus, stagione per stagione.",
  manifest: "/manifest.json",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/icon-192.png" },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Work+Sans:wght@400;500;600&display=swap"
        />
      </head>
      <body>
        <SeasonProvider>
          <div className="flex min-h-screen w-full max-w-full flex-col md:flex-row">
            <Nav />
            <main className="min-w-0 flex-1 pb-24 md:pb-0 md:pl-64">
              {/* cellulare: barra in alto con il cambio stagione */}
              <div
                className="flex items-center justify-between gap-3 border-b border-white/10 bg-chalk px-4 py-2 md:hidden"
                style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top, 0px))" }}
              >
                <span className="scoreboard text-base tracking-wide">
                  JUVE <span className="text-gold">TRACKER</span>
                </span>
                <SeasonSwitcher />
              </div>
              {children}
            </main>
          </div>
        </SeasonProvider>
      </body>
    </html>
  );
}
