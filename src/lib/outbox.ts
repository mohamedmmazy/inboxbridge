import { admin } from "./supabase/admin";
import { decrypt, encrypt } from "./crypto";
import { sendMail } from "./mail/smtp";
import { appendMessage } from "./mail/imap";
import type { InboxRow, OutgoingMail } from "./mail/types";

export type SendOutcome =
  | { status: "sent"; id: string; messageId: string }
  | { status: "scheduled"; id: string; sendAt: string }
  | { status: "pending_approval"; id: string; note: string }
  | { status: "duplicate"; id: string; previous: string };

const summary = (m: OutgoingMail) => `${m.to.join(", ")} · ${m.subject}`.slice(0, 300);

/**
 * Single entry point for every outgoing message. Applies, in order:
 * idempotency -> scheduling -> per-inbox approval hold -> immediate send.
 * `bypassApproval` is only used by the dashboard (the owner is the approver).
 */
export async function submitSend(
  inbox: InboxRow,
  mail: OutgoingMail,
  opts: { sendAt?: string; idempotencyKey?: string; bypassApproval?: boolean } = {},
): Promise<SendOutcome> {
  const db = admin();
  const future = opts.sendAt && new Date(opts.sendAt).getTime() > Date.now() + 30_000;
  const hold = inbox.require_approval && !opts.bypassApproval;
  const status = hold ? "pending_approval" : future ? "scheduled" : "sending";

  const { data, error } = await db
    .from("outbox")
    .insert({
      owner_id: inbox.owner_id,
      inbox_id: inbox.id,
      status,
      send_at: future ? new Date(opts.sendAt!).toISOString() : null,
      payload_enc: encrypt(JSON.stringify(mail), inbox.owner_id),
      summary: summary(mail),
      idempotency_key: opts.idempotencyKey ?? null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505" && opts.idempotencyKey) {
      const { data: prev } = await db.from("outbox").select("id,status").eq("owner_id", inbox.owner_id).eq("idempotency_key", opts.idempotencyKey).single();
      return { status: "duplicate", id: prev?.id ?? "", previous: prev?.status ?? "unknown" };
    }
    throw new Error(error.message);
  }

  if (status === "pending_approval") return { status, id: data.id, note: "Held for approval. Approve it in the dashboard under Outbox." };
  if (status === "scheduled") return { status, id: data.id, sendAt: new Date(opts.sendAt!).toISOString() };
  return deliver(data.id, inbox, mail);
}

async function deliver(id: string, inbox: InboxRow, mail: OutgoingMail): Promise<SendOutcome> {
  const db = admin();
  try {
    const { messageId, raw } = await sendMail(inbox, mail);
    // Gmail files its own copy in Sent; every other provider needs us to do it.
    if (inbox.provider !== "gmail") {
      await appendMessage(inbox, "sent", raw, ["\\Seen"]).catch(() => {});
    }
    await db.from("outbox").update({ status: "sent", payload_enc: "", error: null, updated_at: new Date().toISOString() }).eq("id", id);
    return { status: "sent", id, messageId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await db.from("outbox").update({ status: "failed", error: msg.slice(0, 500), updated_at: new Date().toISOString() }).eq("id", id);
    throw new Error(`Send failed: ${msg}`);
  }
}

/** Atomically claim a row so two workers never send the same message. */
async function claim(id: string, from: string[]) {
  const { data } = await admin()
    .from("outbox")
    .update({ status: "sending", updated_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", from)
    .select("*, inbox:inboxes(*)")
    .maybeSingle();
  return data as null | { id: string; payload_enc: string; inbox: InboxRow };
}

export async function approve(ownerId: string, id: string): Promise<SendOutcome> {
  const { data: row } = await admin().from("outbox").select("send_at,owner_id").eq("id", id).eq("owner_id", ownerId).maybeSingle();
  if (!row) throw new Error("Not found.");
  // Approved but scheduled for later: just release the hold.
  if (row.send_at && new Date(row.send_at).getTime() > Date.now() + 30_000) {
    await admin().from("outbox").update({ status: "scheduled", updated_at: new Date().toISOString() }).eq("id", id).eq("status", "pending_approval");
    return { status: "scheduled", id, sendAt: row.send_at };
  }
  const c = await claim(id, ["pending_approval"]);
  if (!c) throw new Error("Already handled.");
  return deliver(c.id, c.inbox, JSON.parse(decrypt(c.payload_enc, c.inbox.owner_id)));
}

export async function reject(ownerId: string, id: string) {
  await admin()
    .from("outbox")
    .update({ status: "rejected", payload_enc: "", updated_at: new Date().toISOString() })
    .eq("id", id).eq("owner_id", ownerId).in("status", ["pending_approval", "scheduled"]);
}

export async function cancel(ownerId: string, id: string) {
  await admin()
    .from("outbox")
    .update({ status: "cancelled", payload_enc: "", updated_at: new Date().toISOString() })
    .eq("id", id).eq("owner_id", ownerId).in("status", ["pending_approval", "scheduled"]);
}

export async function reschedule(ownerId: string, id: string, sendAt: string) {
  const { error } = await admin()
    .from("outbox")
    .update({ send_at: new Date(sendAt).toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id).eq("owner_id", ownerId).in("status", ["pending_approval", "scheduled"]);
  if (error) throw new Error(error.message);
}

export async function listOutbox(ownerId: string, statuses?: string[], limit = 50) {
  let q = admin().from("outbox").select("id,inbox_id,status,send_at,summary,error,created_at,inbox:inboxes(email)").eq("owner_id", ownerId).order("created_at", { ascending: false }).limit(limit);
  if (statuses?.length) q = q.in("status", statuses);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Sends everything that is due. Called by the cron endpoint. */
export async function dispatchDue(): Promise<{ sent: number; failed: number }> {
  const { data } = await admin()
    .from("outbox").select("id").eq("status", "scheduled").lte("send_at", new Date().toISOString()).limit(25);
  let sent = 0, failed = 0;
  for (const r of data ?? []) {
    const c = await claim(r.id, ["scheduled"]);
    if (!c) continue;
    try { await deliver(c.id, c.inbox, JSON.parse(decrypt(c.payload_enc, c.inbox.owner_id))); sent++; } catch { failed++; }
  }
  return { sent, failed };
}
