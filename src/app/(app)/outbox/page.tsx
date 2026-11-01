import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/server";
import { listOutbox } from "@/lib/outbox";
import { decideSend } from "../actions";

export const metadata: Metadata = { title: "Outbox" };

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "as soon as approved");
const label: Record<string, string> = { pending_approval: "Needs your approval", scheduled: "Scheduled", sending: "Sending…", sent: "Sent", failed: "Failed", cancelled: "Cancelled", rejected: "Rejected" };

export default async function Outbox() {
  const user = await requireUser();
  const rows = await listOutbox(user.id, undefined, 60);
  const waiting = rows.filter((r) => r.status === "pending_approval" || r.status === "scheduled");
  const history = rows.filter((r) => !waiting.includes(r));

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-extrabold tracking-tight">Outbox</h1><p className="muted mt-1">Emails your AI wrote wait here until you approve them.</p></div>

      <section className="card">
        <h2 className="font-extrabold">Waiting</h2>
        {waiting.length === 0 && <p className="muted mt-2 text-sm">Nothing waiting. You&apos;re all caught up.</p>}
        <ul className="mt-3 divide-y divide-black/5">
          {waiting.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div className="min-w-0">
                <p className="truncate font-bold">{o.summary}</p>
                <p className="muted text-sm"><span className="pill !py-0.5">{label[o.status]}</span> From {(o.inbox as unknown as { email: string } | null)?.email} · sends {fmt(o.send_at)}</p>
              </div>
              <form action={decideSend} className="flex gap-2">
                <input type="hidden" name="id" value={o.id} />
                {o.status === "pending_approval" && <button name="decision" value="approve" className="btn">Approve & send</button>}
                <button name="decision" value={o.status === "pending_approval" ? "reject" : "cancel"} className="btn-danger">{o.status === "pending_approval" ? "Reject" : "Cancel"}</button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="font-extrabold">History</h2>
        {history.length === 0 && <p className="muted mt-2 text-sm">No sent messages yet.</p>}
        <ul className="mt-3 divide-y divide-black/5">
          {history.map((o) => (
            <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span className="min-w-0 truncate font-semibold">{o.summary}</span>
              <span className={o.status === "failed" ? "text-red-600" : "muted"} title={o.error ?? ""}>{label[o.status]} · {new Date(o.created_at).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
