import { admin } from "./supabase/admin";
import type { InboxRow } from "./mail/types";

export async function listInboxes(ownerId: string): Promise<InboxRow[]> {
  const { data, error } = await admin().from("inboxes").select("*").eq("owner_id", ownerId).order("created_at");
  if (error) throw new Error(error.message);
  return (data ?? []) as InboxRow[];
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Resolve an inbox by id or email. With no selector, succeeds only when exactly one inbox exists. */
export async function resolveInbox(ownerId: string, selector?: string): Promise<InboxRow> {
  const all = await listInboxes(ownerId);
  if (all.length === 0) throw new Error("No inboxes connected. Add one in the dashboard.");
  if (!selector) {
    if (all.length === 1) return all[0];
    throw new Error(`Several inboxes are connected; pass \`inbox\` (id or email). Options: ${all.map((i) => `${i.email} (${i.id})`).join(", ")}`);
  }
  const hit = all.find((i) => (UUID.test(selector) ? i.id === selector : i.email.toLowerCase() === selector.toLowerCase()));
  if (!hit) throw new Error(`Unknown inbox "${selector}". Options: ${all.map((i) => `${i.email} (${i.id})`).join(", ")}`);
  return hit;
}

export async function audit(row: {
  owner_id: string; inbox_id?: string | null; source: string; tool: string; action?: string | null;
  ok: boolean; ms: number; error?: string | null;
}) {
  // Logging must never break a tool call.
  await admin().from("audit_log").insert({ ...row, error: row.error?.slice(0, 500) ?? null }).then(() => {}, () => {});
}
