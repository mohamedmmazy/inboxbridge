"use client";

import { useActionState } from "react";
import { createApiKey } from "../actions";
import { CopyField } from "../../components/copy";

const HELP: Record<string, string> = { read: "Read mail", write: "Organize & drafts", send: "Send (needs approval)" };

export function ApiKeyForm({ scopes }: { scopes: string[] }) {
  const [state, action, pending] = useActionState(createApiKey, undefined);
  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="name">What is this key for?</label>
        <input id="name" name="name" required className="input" placeholder="n8n automation" />
      </div>
      <fieldset className="flex flex-wrap gap-4">
        <legend className="label">Allow</legend>
        {scopes.map((s) => (
          <label key={s} className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" name="scope" value={s} defaultChecked={s === "read"} className="size-4 accent-[#5b1ff0]" />{HELP[s] ?? s}</label>
        ))}
      </fieldset>
      {state?.error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      {state?.secret && (
        <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold">{state.ok}</p><CopyField value={state.secret} /></div>
      )}
      <button className="btn" disabled={pending}>Create key</button>
    </form>
  );
}
