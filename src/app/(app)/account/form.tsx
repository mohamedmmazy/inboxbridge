"use client";

import { useActionState } from "react";
import { changePassword } from "../actions";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, undefined);
  return (
    <form action={action} className="max-w-md space-y-4">
      <div><label className="label" htmlFor="password">New password</label><input id="password" name="password" type="password" minLength={12} required autoComplete="new-password" className="input" /><p className="muted mt-1 text-xs">At least 12 characters. A few random words works well.</p></div>
      <div><label className="label" htmlFor="confirm">Repeat it</label><input id="confirm" name="confirm" type="password" required autoComplete="new-password" className="input" /></div>
      {state?.error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      {state?.ok && <p role="status" className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{state.ok}</p>}
      <button className="btn" disabled={pending}>Update password</button>
    </form>
  );
}
