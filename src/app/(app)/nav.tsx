"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { href: string; label: string; badge?: number };

export function NavLinks({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col">
      {items.map((i) => {
        const active = path === i.href || path.startsWith(i.href + "/");
        return (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center justify-between gap-3 rounded-full px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition ${active ? "bg-brand text-white" : "text-black/60 hover:bg-lav hover:text-brand"}`}
          >
            {i.label}
            {!!i.badge && <span className={`grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] ${active ? "bg-white/25" : "bg-brand text-white"}`}>{i.badge}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
