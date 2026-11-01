import Link from "next/link";
import { READY_PROVIDERS } from "@/lib/providers";
import { Arrow, Check, ProviderMark } from "../components/ui";

const steps = [
  { n: "1", t: "Add your mailbox", d: "Pick your provider, follow the short guide, paste an app password. We test the login before saving." },
  { n: "2", t: "Connect your AI", d: "Copy one link into Claude, ChatGPT or Cursor and approve it on your private sign-in page." },
  { n: "3", t: "Just ask", d: "“Summarize unread mail from clients” or “Reply to Sam and say Thursday works.” You approve before anything is sent." },
];

const security = [
  ["Encrypted per user", "Mailbox passwords are locked with AES-256-GCM using a separate key for every person."],
  ["Mail is never stored", "Messages are fetched live from your provider each time and never saved here."],
  ["You approve every send", "Replies and new emails wait in your Outbox until you click Approve."],
  ["Invite-only accounts", "Only people your admin adds can sign in. No public sign-up."],
  ["Revoke anytime", "Disconnect any AI app or key in one click, and remove a mailbox instantly."],
  ["Private by design", "Other users can never see your mailboxes, mail, or activity."],
];

const faqs = [
  ["Do I need to know how to code?", "No. You copy a link, paste a password, and chat with your AI as usual. Every provider has a step-by-step guide."],
  ["Which AI apps work?", "Claude (web, desktop, Code), ChatGPT, Cursor, VS Code, and anything that supports MCP."],
  ["Does it work when my computer is off?", "Yes. It runs on a cloud server, so your AI can reach your mail anywhere, any time."],
  ["Can the AI send mail without asking me?", "Not by default. Sends wait for your approval. You can switch this per mailbox."],
  ["What about Outlook or Microsoft 365?", "Microsoft no longer allows password-based connections, so these are not supported yet. See the Providers page for details."],
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="mt-6 grid items-center gap-10 rounded-[2.5rem] bg-white/80 p-6 shadow-[0_30px_80px_-30px_rgba(91,31,240,.25)] sm:p-10 lg:grid-cols-2 lg:p-14">
        <div>
          <span className="pill">🔒 Private · Encrypted · Always on</span>
          <h1 className="h1 mt-5">
            Your <span className="relative inline-block">Email<svg className="absolute -bottom-2 left-0 w-full text-brand" viewBox="0 0 200 10" fill="none"><path d="M2 7c40-6 120-6 196-1" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg></span> Connected To Any AI
          </h1>
          <p className="muted mt-6 max-w-lg text-lg">
            Let Claude, ChatGPT or Cursor read, search, organize and draft your email from iCloud, Gmail, webmail and more. Nothing is sent until you say so.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="btn px-6 py-3">Get started <Arrow /></Link>
            <Link href="/providers" className="btn-soft px-6 py-3">See how to connect</Link>
          </div>
          <p className="muted mt-6 text-sm">Works on a cloud server, so it keeps working when your computer is off.</p>
        </div>

        {/* Collage */}
        <div className="relative mx-auto h-[420px] w-full max-w-[520px]" aria-hidden>
          <div className="absolute top-2 left-0 w-44 rounded-3xl bg-ink p-4 text-white shadow-xl">
            <p className="text-4xl font-extrabold">16<span className="text-lg text-white/60"> tools</span></p>
            <p className="mt-1 text-[11px] text-white/60">Read, search, organize, draft, send</p>
            <div className="mt-3 flex h-16 items-end gap-1.5">
              {[40, 65, 30, 80, 55, 95, 70].map((h, i) => <span key={i} className="flex-1 rounded-md bg-brand" style={{ height: `${h}%` }} />)}
            </div>
          </div>
          <div className="absolute top-0 right-0 w-[78%] overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-[#8f5cff] p-4 text-white shadow-xl">
            <div className="flex items-center justify-between text-xs font-semibold text-white/80"><span>Inbox · 3 unread</span><span>●●●</span></div>
            <ul className="mt-3 space-y-2">
              {[["Sam Carter", "Contract ready for review"], ["Apple", "Your receipt from Apple"], ["Nadia", "Thursday works for me"]].map(([a, b]) => (
                <li key={a} className="flex items-center gap-3 rounded-2xl bg-white/15 p-2.5">
                  <span className="grid size-8 place-items-center rounded-full bg-white/25 text-xs font-bold">{a[0]}</span>
                  <span className="min-w-0 text-xs"><b className="block">{a}</b><span className="block truncate text-white/75">{b}</span></span>
                </li>
              ))}
            </ul>
            <p className="mt-3 rounded-2xl bg-white p-3 text-xs font-medium text-ink">✨ “3 new messages. Nadia confirmed Thursday. Want me to reply?”</p>
          </div>
          <div className="absolute bottom-3 left-6 w-52 rounded-3xl bg-white p-4 shadow-xl ring-1 ring-black/5">
            <p className="text-xs text-black/50">Before sending</p>
            <p className="text-lg font-extrabold">You approve</p>
            <span className="mt-2 inline-grid size-9 place-items-center rounded-xl bg-emerald-500 text-white"><Check /></span>
          </div>
          <div className="absolute right-4 bottom-0 flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold shadow-lg ring-1 ring-black/5">
            <span className="grid size-6 place-items-center rounded-full bg-brand text-white"><Arrow /></span>How it works
          </div>
        </div>
      </section>

      {/* Provider strip */}
      <section className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 px-4 opacity-70">
        {READY_PROVIDERS.filter((p) => p.id !== "google-workspace").map((p) => (
          <Link key={p.id} href={`/providers/${p.id}`} className="text-xl font-extrabold tracking-tight text-black/50 transition hover:text-brand">{p.mark}</Link>
        ))}
      </section>

      {/* How it works */}
      <section id="how" className="mt-24 scroll-mt-24">
        <h2 className="h2 text-center">Three steps. No code.</h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="card">
              <span className="grid size-10 place-items-center rounded-2xl bg-lav text-lg font-extrabold text-brand">{s.n}</span>
              <h3 className="mt-4 text-xl font-bold">{s.t}</h3>
              <p className="muted mt-2">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Providers */}
      <section className="mt-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="h2">Pick your provider</h2>
            <p className="muted mt-2">Each one has its own step-by-step guide.</p>
          </div>
          <Link href="/providers" className="btn-soft">All guides <Arrow /></Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {READY_PROVIDERS.slice(0, 6).map((p) => (
            <Link key={p.id} href={`/providers/${p.id}`} className="card flex items-center gap-4 transition hover:-translate-y-0.5">
              <ProviderMark p={p} />
              <span><b className="block">{p.name}</b><span className="muted text-sm">{p.steps.length} easy steps</span></span>
            </Link>
          ))}
        </div>
      </section>

      {/* Security */}
      <section id="security" className="mt-24 scroll-mt-24">
        <h2 className="h2 text-center">Built so your mail stays yours</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {security.map(([t, d]) => (
            <div key={t} className="card">
              <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><Check /></span>
              <h3 className="mt-3 font-bold">{t}</h3>
              <p className="muted mt-1 text-sm">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto mt-24 max-w-3xl scroll-mt-24">
        <h2 className="h2 text-center">Questions</h2>
        <div className="mt-8 space-y-3">
          {faqs.map(([q, a]) => (
            <details key={q} className="card group cursor-pointer !p-5">
              <summary className="flex list-none items-center justify-between font-bold">{q}<span className="text-brand transition group-open:rotate-45">+</span></summary>
              <p className="muted mt-3">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-24 rounded-[2.5rem] bg-ink p-10 text-center text-white">
        <h2 className="text-3xl font-extrabold sm:text-4xl">Ready to let AI handle the inbox?</h2>
        <p className="mx-auto mt-3 max-w-md text-white/60">Sign in with the account your admin created for you.</p>
        <Link href="/login" className="btn mt-6 px-7 py-3">Sign in <Arrow /></Link>
      </section>
    </>
  );
}
