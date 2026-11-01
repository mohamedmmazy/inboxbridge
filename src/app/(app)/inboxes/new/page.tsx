import type { Metadata } from "next";
import Link from "next/link";
import { PROVIDERS, getProvider } from "@/lib/providers";
import { Arrow, ProviderMark } from "../../../components/ui";
import { AddInboxForm } from "./form";

export const metadata: Metadata = { title: "Add an inbox" };

export default async function NewInbox({ searchParams }: { searchParams: Promise<{ provider?: string }> }) {
  const { provider: id } = await searchParams;
  const p = id ? getProvider(id) : undefined;

  if (!p || p.status !== "ready") {
    return (
      <div className="space-y-6">
        <div><h1 className="text-3xl font-extrabold tracking-tight">Add an inbox</h1><p className="muted mt-1">Step 1 of 2 · Who provides your email?</p></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {PROVIDERS.map((x) =>
            x.status === "ready" ? (
              <Link key={x.id} href={`/inboxes/new?provider=${x.id}`} className="card flex items-center gap-4 transition hover:-translate-y-0.5">
                <ProviderMark p={x} /><span className="min-w-0 flex-1"><b className="block">{x.name}</b><span className="muted block truncate text-xs">{x.tagline}</span></span><Arrow />
              </Link>
            ) : (
              <Link key={x.id} href={`/providers/${x.id}`} className="card flex items-center gap-4 opacity-70">
                <ProviderMark p={x} /><span className="min-w-0 flex-1"><b className="block">{x.name}</b><span className="block text-xs text-amber-700">Not supported yet</span></span>
              </Link>
            ),
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/inboxes/new" className="text-sm font-semibold text-brand">← Choose a different provider</Link>
        <div className="mt-3 flex items-center gap-4"><ProviderMark p={p} /><div><h1 className="text-3xl font-extrabold tracking-tight">Connect {p.name}</h1><p className="muted">Step 2 of 2 · Follow the steps, then fill in the form.</p></div></div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card">
          <h2 className="font-extrabold">How to get your password</h2>
          <ol className="mt-4 space-y-4">
            {p.steps.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-lav text-sm font-bold text-brand">{i + 1}</span>
                <div><p className="text-sm font-bold">{s.title}</p><p className="muted text-sm">{s.body}</p></div>
              </li>
            ))}
          </ol>
          {p.link && <a href={p.link.url} target="_blank" rel="noopener noreferrer" className="btn-soft mt-5">{p.link.label} <Arrow /></a>}
          <Link href={`/providers/${p.id}`} className="mt-3 block text-sm font-semibold text-brand">Troubleshooting and more help →</Link>
        </section>
        <section className="card"><h2 className="mb-4 font-extrabold">Your details</h2><AddInboxForm provider={p} /></section>
      </div>
    </div>
  );
}
