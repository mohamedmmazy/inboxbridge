import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { listInboxes } from "@/lib/db";
import { getProvider } from "@/lib/providers";
import { Arrow, ProviderMark } from "../../components/ui";
import { removeInbox, setApproval } from "../actions";

export const metadata: Metadata = { title: "My inboxes" };

export default async function Inboxes({ searchParams }: { searchParams: Promise<{ connected?: string }> }) {
  const user = await requireUser();
  const { connected } = await searchParams;
  const inboxes = await listInboxes(user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-3xl font-extrabold tracking-tight">My inboxes</h1><p className="muted mt-1">The mailboxes your AI can use.</p></div>
        <Link href="/inboxes/new" className="btn">Add inbox <Arrow /></Link>
      </div>

      {connected && <p role="status" className="rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">🎉 Connected! Next, <Link href="/connect" className="underline">connect your AI</Link>.</p>}

      {inboxes.length === 0 ? (
        <div className="card text-center">
          <p className="text-lg font-bold">No inboxes yet</p>
          <p className="muted mt-1 text-sm">Add your first mailbox. It takes about two minutes.</p>
          <Link href="/inboxes/new" className="btn mt-5">Add your first inbox</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {inboxes.map((i) => {
            const p = getProvider(i.provider);
            return (
              <li key={i.id} className="card flex flex-wrap items-center gap-4">
                {p && <ProviderMark p={p} />}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{i.email}</p>
                  <p className="muted text-sm">{p?.name ?? i.provider} · {i.require_approval ? "Sends need your approval" : "Sends go out without approval"}</p>
                </div>
                <form action={setApproval}>
                  <input type="hidden" name="id" value={i.id} />
                  <input type="hidden" name="value" value={String(!i.require_approval)} />
                  <button className="btn-ghost" title="When on, the AI can only queue emails; you approve them in Outbox.">Approval: {i.require_approval ? "ON" : "OFF"}</button>
                </form>
                <form action={removeInbox}><input type="hidden" name="id" value={i.id} /><button className="btn-danger">Remove</button></form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
