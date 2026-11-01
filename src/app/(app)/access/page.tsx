import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { SCOPES } from "@/lib/oauth";
import { revokeApiKey, revokeOAuthSessions } from "../actions";
import { ApiKeyForm } from "./forms";

export const metadata: Metadata = { title: "Access" };

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString() : "never");

export default async function Access() {
  const user = await requireUser();
  const db = admin();
  const [keys, apps] = await Promise.all([
    db.from("api_keys").select("id,name,prefix,scopes,last_used_at").eq("owner_id", user.id).is("revoked_at", null).order("created_at", { ascending: false }),
    db.from("oauth_tokens").select("client:oauth_clients(client_name),created_at,expires_at").eq("owner_id", user.id).eq("kind", "refresh").is("revoked_at", null).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-extrabold tracking-tight">Access</h1><p className="muted mt-1">Which apps can use your mailboxes. Revoke anything you don&apos;t recognize.</p></div>

      <section className="card">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-extrabold">Connected AI apps</h2>
          {(apps.data?.length ?? 0) > 0 && <form action={revokeOAuthSessions}><button className="btn-danger">Disconnect all</button></form>}</div>
        {(apps.data?.length ?? 0) === 0 && <p className="muted mt-2 text-sm">No AI apps connected yet. Go to “Connect your AI”.</p>}
        <ul className="mt-3 divide-y divide-black/5">
          {(apps.data ?? []).map((a, i) => (
            <li key={i} className="flex items-center justify-between py-3 text-sm"><b>{(a.client as unknown as { client_name: string } | null)?.client_name ?? "App"}</b><span className="muted">connected {new Date(a.created_at).toLocaleDateString()}</span></li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2 className="font-extrabold">API keys</h2>
        <p className="muted mt-1 text-sm">For tools that can&apos;t sign in through a browser, like scripts and n8n.</p>
        <ul className="mt-3 divide-y divide-black/5">
          {(keys.data ?? []).map((k) => (
            <li key={k.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span><b>{k.name}</b> <code className="text-xs text-black/40">{k.prefix}…</code> <span className="pill !py-0.5">{(k.scopes as string[]).join(", ")}</span><span className="muted ml-2 text-xs">last used {fmt(k.last_used_at)}</span></span>
              <form action={revokeApiKey}><input type="hidden" name="id" value={k.id} /><button className="btn-danger">Revoke</button></form>
            </li>
          ))}
        </ul>
        <div className="mt-5 border-t border-black/5 pt-5"><ApiKeyForm scopes={[...SCOPES]} /></div>
      </section>
    </div>
  );
}
