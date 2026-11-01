import Link from "next/link";
import { getCurrentUser } from "@/lib/supabase/server";
import { Arrow, Logo } from "../components/ui";

const nav = [
  { href: "/#how", label: "How it works" },
  { href: "/providers", label: "Providers" },
  { href: "/#security", label: "Security" },
  { href: "/#faq", label: "FAQ" },
];

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser().catch(() => null);
  return (
    <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
      <header className="flex items-center justify-between rounded-full bg-white/70 px-4 py-2.5 backdrop-blur sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="rounded-full px-4 py-2 text-sm font-semibold text-black/60 transition hover:bg-lav hover:text-brand">{n.label}</Link>
          ))}
        </nav>
        <Link href={user ? "/dashboard" : "/login"} className="btn-soft">
          {user ? "Open dashboard" : "Sign in"} <Arrow />
        </Link>
      </header>
      {children}
      <footer className="mt-24 flex flex-col items-center justify-between gap-4 border-t border-black/5 py-8 text-sm muted sm:flex-row">
        <Logo />
        <p>Your mail is fetched live and never stored. Passwords are encrypted per user.</p>
      </footer>
    </div>
  );
}
