import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Activity" };

export default async function Activity() {
  const user = await requireUser();
  const { data } = await admin().from("audit_log").select("id,source,tool,action,ok,ms,error,created_at").eq("owner_id", user.id).order("created_at", { ascending: false }).limit(100);
  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-extrabold tracking-tight">Activity</h1><p className="muted mt-1">What your AI apps did. We log the action and result, never the content of your email.</p></div>
      <section className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-black/50"><tr><th className="py-2 pr-4">When</th><th className="pr-4">App</th><th className="pr-4">Action</th><th>Result</th></tr></thead>
          <tbody>
            {(data ?? []).map((r) => (
              <tr key={r.id} className="border-t border-black/5">
                <td className="py-2.5 pr-4 whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                <td className="pr-4">{r.source.split(":")[1] ?? r.source}</td>
                <td className="pr-4 font-semibold">{r.tool}{r.action ? ` · ${r.action}` : ""}</td>
                <td className={r.ok ? "text-emerald-600" : "text-red-600"} title={r.error ?? ""}>{r.ok ? "OK" : "Failed"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {(data ?? []).length === 0 && <p className="muted py-4 text-sm">Nothing yet. Activity shows up here once your AI starts working.</p>}
      </section>
    </div>
  );
}
