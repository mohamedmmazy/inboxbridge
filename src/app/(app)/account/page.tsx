import type { Metadata } from "next";
import { isAdmin, requireUser } from "@/lib/supabase/server";
import { signOut } from "../../(site)/login/actions";
import { PasswordForm } from "./form";

export const metadata: Metadata = { title: "Account" };

export default async function Account() {
  const user = await requireUser();
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-extrabold tracking-tight">Account</h1><p className="muted mt-1">{user.email} · {isAdmin(user) ? "Admin" : "Member"}</p></div>
      <section className="card"><h2 className="mb-4 font-extrabold">Change password</h2><PasswordForm /></section>
      <section className="card flex items-center justify-between"><div><h2 className="font-extrabold">Sign out</h2><p className="muted text-sm">End this session on this device.</p></div><form action={signOut}><button className="btn-ghost">Sign out</button></form></section>
    </div>
  );
}
