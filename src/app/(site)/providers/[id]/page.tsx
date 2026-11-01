import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProvider, PROVIDERS } from "@/lib/providers";
import { Arrow, Check, ProviderMark } from "../../../components/ui";

export function generateStaticParams() {
  return PROVIDERS.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const p = getProvider((await params).id);
  return { title: p ? `Connect ${p.name}` : "Provider" };
}

export default async function ProviderGuide({ params }: { params: Promise<{ id: string }> }) {
  const p = getProvider((await params).id);
  if (!p) notFound();

  return (
    <article className="mx-auto mt-10 max-w-4xl">
      <Link href="/providers" className="text-sm font-semibold text-brand">← All providers</Link>
      <header className="mt-4 flex flex-wrap items-center gap-5">
        <ProviderMark p={p} size="lg" />
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Connect {p.name}</h1>
          <p className="muted mt-1">{p.tagline}</p>
        </div>
      </header>

      {p.status === "unsupported" ? (
        <div className="card mt-8 border-amber-200 bg-amber-50/60">
          <h2 className="text-lg font-bold">Not supported yet</h2>
          <p className="mt-2">{p.unsupportedReason}</p>
          <Link href="/providers" className="btn-soft mt-5">Pick another provider</Link>
        </div>
      ) : (
        <>
          <section className="card mt-8">
            <h2 className="font-bold">Before you start</h2>
            <ul className="mt-3 space-y-2">
              {p.needs.map((n) => (
                <li key={n} className="flex gap-2.5 text-sm"><span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-lav text-brand"><Check className="size-3" /></span>{n}</li>
              ))}
            </ul>
          </section>

          <section className="mt-6">
            <h2 className="text-2xl font-extrabold">Step by step</h2>
            <ol className="mt-5 space-y-3">
              {p.steps.map((s, i) => (
                <li key={s.title} className="card flex gap-4 !p-5">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand font-bold text-white">{i + 1}</span>
                  <div><h3 className="font-bold">{s.title}</h3><p className="muted mt-1 text-sm">{s.body}</p></div>
                </li>
              ))}
            </ol>
            {p.link && <a href={p.link.url} target="_blank" rel="noopener noreferrer" className="btn-soft mt-5">{p.link.label} <Arrow /></a>}
          </section>

          <section className="card mt-8">
            <h2 className="font-bold">Server settings</h2>
            <p className="muted mt-1 text-sm">{p.variants ? "These are typical values. Your hosting panel has the exact ones." : "These are filled in for you automatically."}</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              {[
                ["Incoming (IMAP) server", p.imapHost || "mail.yourdomain.com"],
                ["IMAP port", `${p.imapPort} · SSL/TLS`],
                ["Outgoing (SMTP) server", p.smtpHost || "mail.yourdomain.com"],
                ["SMTP port", `${p.smtpPort} · ${p.smtpSecure ? "SSL/TLS" : "STARTTLS"}`],
                ["Username", p.usernameHint],
                ["Password", p.passwordLabel],
              ].map(([k, v]) => (
                <div key={k} className="rounded-2xl bg-mist p-3"><dt className="text-xs font-semibold text-black/50">{k}</dt><dd className="mt-0.5 font-semibold">{v}</dd></div>
              ))}
            </dl>
            {p.variants && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs text-black/50"><tr><th className="py-2 pr-4">Host</th><th className="pr-4">IMAP</th><th>SMTP</th></tr></thead>
                  <tbody>
                    {p.variants.filter((v) => v.imapHost).map((v) => (
                      <tr key={v.id} className="border-t border-black/5"><td className="py-2 pr-4 font-semibold">{v.name}</td><td className="pr-4">{v.imapHost}:{v.imapPort}</td><td>{v.smtpHost}:{v.smtpPort}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <div className="card mt-8 flex flex-wrap items-center justify-between gap-4 !bg-ink text-white">
            <div><h2 className="text-xl font-extrabold">Ready? Add your {p.name} inbox.</h2><p className="mt-1 text-sm text-white/60">You&apos;ll be asked to sign in first.</p></div>
            <Link href={`/inboxes/new?provider=${p.id}`} className="btn">Add this inbox <Arrow /></Link>
          </div>

          <section className="mt-10">
            <h2 className="text-2xl font-extrabold">Common questions</h2>
            <div className="mt-4 space-y-3">
              {p.faq.map((f) => (
                <details key={f.q} className="card group cursor-pointer !p-5">
                  <summary className="flex list-none items-center justify-between font-bold">{f.q}<span className="text-brand transition group-open:rotate-45">+</span></summary>
                  <p className="muted mt-3 text-sm">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </>
      )}
    </article>
  );
}
