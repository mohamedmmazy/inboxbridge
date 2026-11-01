"use client";

import { useActionState, useState } from "react";
import { addInbox } from "../../actions";
import type { Provider } from "@/lib/providers";

export function AddInboxForm({ provider }: { provider: Provider }) {
  const [state, action, pending] = useActionState(addInbox, undefined);
  const [v, setV] = useState(provider.variants?.[0]);
  const cfg = v ?? provider;
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="provider" value={provider.id} />

      {provider.variants && (
        <div>
          <label className="label">Who hosts your email?</label>
          <select className="input" value={v?.id} onChange={(e) => setV(provider.variants!.find((x) => x.id === e.target.value))}>
            {provider.variants.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </div>
      )}

      <div>
        <label className="label" htmlFor="email">Email address</label>
        <input id="email" name="email" type="email" required className="input" placeholder="you@example.com" autoComplete="off" />
      </div>
      <div>
        <label className="label" htmlFor="username">Username <span className="font-normal text-black/40">({provider.usernameHint})</span></label>
        <input id="username" name="username" required className="input" autoComplete="off" />
      </div>
      <div>
        <label className="label" htmlFor="password">{provider.passwordLabel}</label>
        <input id="password" name="password" type="password" required className="input" autoComplete="off" />
      </div>
      <div>
        <label className="label" htmlFor="label">Your name on sent emails <span className="font-normal text-black/40">(optional)</span></label>
        <input id="label" name="label" className="input" placeholder="Alex Johnson" />
      </div>

      <details open={!cfg.imapHost} className="rounded-2xl bg-mist p-4">
        <summary className="cursor-pointer text-sm font-semibold">Server settings {cfg.imapHost ? "(filled in for you)" : "(required)"}</summary>
        {/* key remounts the inputs so defaults refresh when the host changes */}
        <div key={v?.id ?? "p"} className="mt-4 grid gap-3 sm:grid-cols-4">
          <div className="sm:col-span-3"><label className="label">IMAP server</label><input name="imap_host" defaultValue={cfg.imapHost} required className="input" placeholder="mail.yourdomain.com" /></div>
          <div><label className="label">Port</label><input name="imap_port" defaultValue={cfg.imapPort} required className="input" inputMode="numeric" /></div>
          <div className="sm:col-span-2"><label className="label">SMTP server</label><input name="smtp_host" defaultValue={cfg.smtpHost} required className="input" placeholder="mail.yourdomain.com" /></div>
          <div><label className="label">Port</label><input name="smtp_port" defaultValue={cfg.smtpPort} required className="input" inputMode="numeric" /></div>
          <div>
            <label className="label">Security</label>
            <select name="smtp_secure" defaultValue={String(cfg.smtpSecure)} className="input">
              <option value="true">SSL/TLS</option>
              <option value="false">STARTTLS</option>
            </select>
          </div>
        </div>
      </details>

      {state?.error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      <button className="btn w-full py-3" disabled={pending}>{pending ? "Testing your login…" : "Test & connect"}</button>
      <p className="muted text-center text-xs">We log in to both incoming and outgoing servers before saving anything.</p>
    </form>
  );
}
