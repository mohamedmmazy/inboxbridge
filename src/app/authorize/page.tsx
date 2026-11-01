import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/server";
import { getClient, parseScopes, SCOPE_HELP, type Scope } from "@/lib/oauth";
import { Logo } from "../components/ui";
import { decide } from "./actions";

type P = Record<string, string | undefined>;

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="mx-auto max-w-md px-4 pt-16">
    <div className="mb-6 flex justify-center"><Logo href="/dashboard" /></div>
    {children}
  </div>
);

export default async function Authorize({ searchParams }: { searchParams: Promise<P> }) {
  const p = await searchParams;

  const bad = (msg: string) => (
    <Shell><div className="card"><h1 className="text-lg font-bold">Can&apos;t connect this app</h1><p className="muted mt-2 text-sm">{msg}</p></div></Shell>
  );

  if (p.response_type !== "code" || !p.client_id || !p.redirect_uri) return bad("The request from the app was incomplete. Go back and try connecting again.");
  if (p.code_challenge_method !== "S256" || !p.code_challenge) return bad("This app didn't use a secure connection method (PKCE), so we blocked it.");
  const client = await getClient(p.client_id);
  if (!client || !client.redirect_uris.includes(p.redirect_uri)) return bad("We don't recognize this app or where it wants to send you back.");

  const user = await getCurrentUser();
  if (!user) {
    const back = `/authorize?${new URLSearchParams(Object.entries(p).filter(([, v]) => v !== undefined) as [string, string][])}`;
    redirect(`/login?next=${encodeURIComponent(back)}`);
  }

  const scopes = parseScopes(p.scope);
  const dest = new URL(p.redirect_uri);
  const destLabel = dest.protocol === "http:" || dest.protocol === "https:" ? dest.host : `${dest.protocol}//`;

  return (
    <Shell>
      <form action={decide} className="card space-y-5 !p-8">
        <div>
          <span className="pill">{user.email}</span>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Connect {client.client_name}?</h1>
          <p className="muted mt-2 text-sm">
            This app wants to use your mailboxes through InboxBridge. After you approve, you&apos;ll be sent back to <b className="text-ink">{destLabel}</b>.
          </p>
        </div>
        <fieldset className="space-y-3">
          <legend className="label">What it can do</legend>
          {(Object.keys(SCOPE_HELP) as Scope[]).map((s) => (
            <label key={s} className="flex cursor-pointer items-start gap-3 rounded-2xl bg-mist p-3 text-sm">
              <input type="checkbox" name="scope" value={s} defaultChecked={scopes.includes(s)} className="mt-1 size-4 accent-[#5b1ff0]" />
              <span><b className="capitalize">{s}</b><span className="muted block">{SCOPE_HELP[s]}</span></span>
            </label>
          ))}
        </fieldset>
        {["client_id", "redirect_uri", "state", "code_challenge"].map((k) => <input key={k} type="hidden" name={k} value={p[k] ?? ""} />)}
        <div className="flex gap-3">
          <button name="decision" value="approve" className="btn flex-1 py-3">Approve</button>
          <button name="decision" value="deny" className="btn-ghost flex-1 !py-3 !text-sm">Deny</button>
        </div>
        <p className="muted text-center text-xs">You can disconnect this app anytime under Access.</p>
      </form>
    </Shell>
  );
}
