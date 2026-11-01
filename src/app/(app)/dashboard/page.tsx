import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { CopyField } from "../../components/copy";
import { Arrow, Check } from "../../components/ui";

export const metadata: Metadata = { title: "Home" };

const prompts = [
  "Summarize my unread email from today and tell me what needs a reply.",
  "Find the invoice from last month and draft a reply asking for the PDF.",
  "Archive all newsletters older than a week.",
  "Reply to the latest message from my manager: “Thursday works for me.”",
];

export default async function Dashboard() {
  const user = await requireUser();
  const db = admin();
  const dayAgo = new Date(Date.now() - 864e5).toISOString();
  const [inboxes, waiting, calls, tokens, keys] = await Promise.all([
    db.from("inboxes").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
    db.from("outbox").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("status", "pending_approval"),
    db.from("audit_log").select("id", { count: "exact", head: true }).eq("owner_id", user.id).gte("created_at", dayAgo),
    db.from("oauth_tokens").select("id", { count: "exact", head: true }).eq("owner_id", user.id).eq("kind", "refresh").is("revoked_at", null),
    db.from("api_keys").select("id", { count: "exact", head: true }).eq("owner_id", user.id).is("revoked_at", null),
  ]);
  const hasInbox = (inboxes.count ?? 0) > 0;
  const hasAi = (tokens.count ?? 0) + (keys.count ?? 0) > 0;
  const used = (calls.count ?? 0) > 0;
  const name = (user.email ?? "").split("@")[0];

  const todo = [
    { done: hasInbox, t: "Add your first inbox", d: "Pick your provider and paste an app password.", href: "/inboxes/new", cta: "Add inbox" },
    { done: hasAi, t: "Connect your AI", d: "Copy one link into Claude, ChatGPT or Cursor.", href: "/connect", cta: "Show me how" },
    { done: used, t: "Ask your first question", d: "Try one of the examples below in your AI app.", href: "/connect", cta: "See examples" },
  ];

  return (
    <div className="space-y-6">
      <div className="card !bg-gradient-to-br from-brand to-[#8f5cff] !text-white">
        <p className="text-sm font-semibold text-white/70">Welcome</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight">Hi {name} 👋</h1>
        <p className="mt-2 max-w-xl text-white/80">Your AI can read and organize your email once you connect a mailbox and an AI app. Sending always waits for your approval.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ["Inboxes connected", inboxes.count ?? 0, "/inboxes"],
          ["Waiting for approval", waiting.count ?? 0, "/outbox"],
          ["AI actions (24h)", calls.count ?? 0, "/activity"],
        ].map(([l, v, h]) => (
          <Link key={l as string} href={h as string} className="card transition hover:-translate-y-0.5">
            <p className="text-4xl font-extrabold">{v}</p>
            <p className="muted mt-1 text-sm">{l}</p>
          </Link>
        ))}
      </div>

      <section className="card">
        <h2 className="text-lg font-extrabold">Get started</h2>
        <ol className="mt-4 space-y-3">
          {todo.map((s, i) => (
            <li key={s.t} className="flex flex-wrap items-center gap-4 rounded-2xl bg-mist p-4">
              <span className={`grid size-9 place-items-center rounded-full font-bold ${s.done ? "bg-emerald-500 text-white" : "bg-white text-brand ring-1 ring-black/10"}`}>{s.done ? <Check /> : i + 1}</span>
              <div className="min-w-0 flex-1"><p className="font-bold">{s.t}</p><p className="muted text-sm">{s.d}</p></div>
              {!s.done && <Link href={s.href} className="btn">{s.cta} <Arrow /></Link>}
            </li>
          ))}
        </ol>
      </section>

      <section className="card space-y-4">
        <h2 className="text-lg font-extrabold">Your connection link</h2>
        <CopyField value={`${env.appUrl}/api/mcp`} />
        <Link href="/connect" className="btn-soft">Step-by-step setup <Arrow /></Link>
      </section>

      <section className="card">
        <h2 className="text-lg font-extrabold">Try asking</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {prompts.map((p) => <li key={p} className="rounded-2xl bg-peach p-4 text-sm font-medium">“{p}”</li>)}
        </ul>
      </section>
    </div>
  );
}
