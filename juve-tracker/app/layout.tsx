import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";

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
        <div className="flex min-h-screen flex-col md:flex-row">
          <Nav />
          <main className="flex-1 pb-20 md:pb-0 md:pl-64">{children}</main>
        </div>
      </body>
    </html>
  );
}
