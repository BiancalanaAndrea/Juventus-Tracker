import type { Metadata, Viewport } from "next";
import { Oswald, Work_Sans } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";

const oswald = Oswald({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-display" });
const workSans = Work_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-body" });

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
    <html lang="it" className={`${oswald.variable} ${workSans.variable}`}>
      <body>
        <div className="flex min-h-screen flex-col md:flex-row">
          <Nav />
          <main className="flex-1 pb-20 md:pb-0 md:pl-64">{children}</main>
        </div>
      </body>
    </html>
  );
}
