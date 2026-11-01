import { requireUser, isAdmin } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { Logo } from "../components/ui";
import { signOut } from "../(site)/login/actions";
import { NavLinks, type NavItem } from "./nav";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const { count } = await admin().from("outbox").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("status", "pending_approval");

  const items: NavItem[] = [
    { href: "/dashboard", label: "Home" },
    { href: "/inboxes", label: "My inboxes" },
    { href: "/connect", label: "Connect your AI" },
    { href: "/outbox", label: "Outbox", badge: count ?? 0 },
    { href: "/access", label: "Access" },
    { href: "/activity", label: "Activity" },
    ...(isAdmin(user) ? [{ href: "/team", label: "Team" }] : []),
    { href: "/account", label: "Account" },
  ];

  return (
    <div className="mx-auto max-w-7xl gap-6 px-4 py-4 sm:px-6 lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-[2rem] bg-white/80 p-4 backdrop-blur">
          <div className="flex items-center justify-between px-2 pb-3 lg:pb-5"><Logo href="/dashboard" /></div>
          <NavLinks items={items} />
          <div className="mt-4 hidden border-t border-black/5 px-2 pt-4 lg:block">
            <p className="truncate text-xs font-semibold">{user.email}</p>
            <p className="muted text-xs">{isAdmin(user) ? "Admin" : "Member"}</p>
            <form action={signOut} className="mt-3"><button className="btn-ghost w-full">Sign out</button></form>
          </div>
        </div>
      </aside>
      <main className="mt-4 min-w-0 pb-16 lg:mt-0">{children}</main>
    </div>
  );
}
