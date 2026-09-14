 "use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Home, Settings, Shield, Trophy } from "lucide-react";

const items = [
  ["/","Dashboard",Home],
  ["/squad","Rosa",Shield],
  ["/matches","Partite",CalendarDays],
  ["/stats","Statistiche",Trophy],
  ["/settings","Impostazioni",Settings],
];

export function Sidebar(){
  const path = usePathname();
  return <aside className="sidebar">
    <div className="brand">JUVENTUS <span>TRACKER</span></div>
    <nav className="nav">{items.map(([href,label,Icon])=><Link className={path===href ? "active":""} href={href as string} key={href as string}><Icon size={18}/>{label as string}</Link>)}</nav>
    <div className="sidebar-footer"><Settings size={15}/> Online · Supabase + API-Football</div>
  </aside>
}