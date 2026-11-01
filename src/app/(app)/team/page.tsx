import type { Metadata } from "next";
import { requireAdmin } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { removeMember, setMemberRole } from "../actions";
import { AddMemberForm, ResetPassword } from "./forms";

export const metadata: Metadata = { title: "Team" };

export default async function Team() {
  const me = await requireAdmin();
  const { data } = await admin().auth.admin.listUsers({ page: 1, perPage: 200 });
  const members = (data?.users ?? []).filter((u) => u.app_metadata?.member === true);
  const { data: counts } = await admin().from("inboxes").select("owner_id");
  const perUser = new Map<string, number>();
  (counts ?? []).forEach((r) => perUser.set(r.owner_id, (perUser.get(r.owner_id) ?? 0) + 1));

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-extrabold tracking-tight">Team</h1><p className="muted mt-1">Only people you add here can sign in. Everyone&apos;s mailboxes and mail stay private to them.</p></div>

      <section className="card"><h2 className="mb-4 font-extrabold">Add a teammate</h2><AddMemberForm /></section>

      <section className="card">
        <h2 className="font-extrabold">People ({members.length})</h2>
        <ul className="mt-3 divide-y divide-black/5">
          {members.map((u) => {
            const self = u.id === me.id;
            const role = u.app_metadata?.role === "admin" ? "admin" : "member";
            return (
              <li key={u.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                <div className="min-w-0">
                  <p className="truncate font-bold">{u.email} {self && <span className="muted font-normal">(you)</span>}</p>
                  <p className="muted text-sm"><span className="pill !py-0.5 capitalize">{role}</span> {perUser.get(u.id) ?? 0} inbox(es) · last sign-in {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "never"}</p>
                </div>
                {!self && (
                  <div className="flex flex-wrap items-start gap-2">
                    <form action={setMemberRole}><input type="hidden" name="id" value={u.id} /><input type="hidden" name="role" value={role === "admin" ? "member" : "admin"} /><button className="btn-ghost">Make {role === "admin" ? "member" : "admin"}</button></form>
                    <ResetPassword id={u.id} />
                    <form action={removeMember}><input type="hidden" name="id" value={u.id} /><button className="btn-danger" title="Deletes their account and all their data">Remove</button></form>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
