"use client";

import { useActionState } from "react";
import { createMember, resetMemberPassword } from "../actions";
import { CopyField } from "../../components/copy";

export function AddMemberForm() {
  const [state, action, pending] = useActionState(createMember, undefined);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div><label className="label" htmlFor="email">Work email</label><input id="email" name="email" type="email" required className="input" placeholder="teammate@company.com" /></div>
        <div><label className="label" htmlFor="role">Role</label><select id="role" name="role" className="input"><option value="member">Member</option><option value="admin">Admin</option></select></div>
      </div>
      {state?.error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{state.error}</p>}
      {state?.secret && <div className="space-y-2 rounded-2xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm font-semibold">{state.ok}</p><CopyField value={state.secret} /></div>}
      <button className="btn" disabled={pending}>Create account</button>
    </form>
  );
}

export function ResetPassword({ id }: { id: string }) {
  const [state, action, pending] = useActionState(resetMemberPassword, undefined);
  return (
    <form action={action} className="flex flex-col items-end gap-2">
      <input type="hidden" name="id" value={id} />
      <button className="btn-ghost" disabled={pending}>Reset password</button>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state?.secret && <div className="w-72"><CopyField value={state.secret} /></div>}
    </form>
  );
}
