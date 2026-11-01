"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { env } from "@/lib/env";
import { requireAdmin, requireUser, sessionClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { encrypt, randomToken, sha256 } from "@/lib/crypto";
import { verifyImap } from "@/lib/mail/imap";
import { verifySmtp } from "@/lib/mail/smtp";
import { friendlyMailError } from "@/lib/mail/errors";
import type { InboxRow } from "@/lib/mail/types";
import { IMAP_PORTS, SMTP_PORTS } from "@/lib/net";
import { getProvider } from "@/lib/providers";
import { parseScopes } from "@/lib/oauth";
import { approve, cancel, reject } from "@/lib/outbox";

export type FormState = { error?: string; ok?: string; secret?: string } | undefined;

const InboxForm = z.object({
  provider: z.string().min(1),
  email: z.string().trim().email(),
  label: z.string().max(80).optional(),
  username: z.string().trim().min(1),
  password: z.string().min(1),
  imap_host: z.string().trim().min(1),
  imap_port: z.coerce.number().int().refine((n) => IMAP_PORTS.includes(n), "IMAP port must be 993 or 143"),
  smtp_host: z.string().trim().min(1),
  smtp_port: z.coerce.number().int().refine((n) => SMTP_PORTS.includes(n), "SMTP port must be 465, 587, 2525 or 25"),
  smtp_secure: z.enum(["true", "false"]).transform((v) => v === "true"),
});

export async function addInbox(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = InboxForm.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Please fill in every field: " + parsed.error.issues.map((i) => i.message).join("; ") };
  const d = parsed.data;
  const provider = getProvider(d.provider);
  if (!provider || provider.status !== "ready") return { error: "That provider isn't supported." };

  const db = admin();
  const { count } = await db.from("inboxes").select("id", { count: "exact", head: true }).eq("owner_id", user.id);
  const { data: already } = await db.from("inboxes").select("id").eq("owner_id", user.id).eq("email", d.email.toLowerCase()).maybeSingle();
  if (!already && (count ?? 0) >= env.maxInboxesPerUser) return { error: `You can connect up to ${env.maxInboxesPerUser} inboxes. Remove one first.` };

  const candidate: InboxRow = {
    id: "", owner_id: user.id, email: d.email.toLowerCase(), label: d.label || null, provider: d.provider,
    imap_host: d.imap_host.toLowerCase(), imap_port: d.imap_port, imap_secure: d.imap_port === 993,
    smtp_host: d.smtp_host.toLowerCase(), smtp_port: d.smtp_port, smtp_secure: d.smtp_secure,
    username: d.username, password_enc: encrypt(d.password.replace(/\s+/g, ""), user.id), signature: "", require_approval: true,
    last_error: null, created_at: "",
  };

  // Verify both logins before saving anything.
  try { await verifyImap(candidate); } catch (e) { return { error: friendlyMailError(e, "IMAP", provider.name) }; }
  try { await verifySmtp(candidate); } catch (e) { return { error: friendlyMailError(e, "SMTP", provider.name) }; }

  const { id: _id, created_at: _c, ...row } = candidate;
  const { error } = await db.from("inboxes").upsert(row, { onConflict: "owner_id,email" });
  if (error) return { error: "Couldn't save the inbox. Please try again." };
  revalidatePath("/", "layout");
  redirect("/inboxes?connected=1");
}

export async function removeInbox(form: FormData) {
  const user = await requireUser();
  await admin().from("inboxes").delete().eq("id", String(form.get("id"))).eq("owner_id", user.id);
  revalidatePath("/", "layout");
}

export async function setApproval(form: FormData) {
  const user = await requireUser();
  await admin().from("inboxes").update({ require_approval: form.get("value") === "true" }).eq("id", String(form.get("id"))).eq("owner_id", user.id);
  revalidatePath("/inboxes");
}

export async function createApiKey(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const name = String(form.get("name") ?? "").trim().slice(0, 60);
  if (!name) return { error: "Give the key a name so you remember what it's for." };
  const scopes = parseScopes(form.getAll("scope").map(String));
  const key = randomToken("mcpe");
  const { error } = await admin().from("api_keys").insert({ owner_id: user.id, name, prefix: key.slice(0, 10), key_hash: sha256(key), scopes });
  if (error) return { error: "Couldn't create the key. Please try again." };
  revalidatePath("/access");
  return { ok: "Copy this key now. For your safety it will never be shown again.", secret: key };
}

export async function revokeApiKey(form: FormData) {
  const user = await requireUser();
  await admin().from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", String(form.get("id"))).eq("owner_id", user.id);
  revalidatePath("/access");
}

export async function revokeOAuthSessions() {
  const user = await requireUser();
  await admin().from("oauth_tokens").update({ revoked_at: new Date().toISOString() }).eq("owner_id", user.id).is("revoked_at", null);
  revalidatePath("/access");
}

export async function decideSend(form: FormData) {
  const user = await requireUser();
  const id = String(form.get("id"));
  const d = form.get("decision");
  try {
    if (d === "approve") await approve(user.id, id);
    else if (d === "reject") await reject(user.id, id);
    else await cancel(user.id, id);
  } finally {
    revalidatePath("/outbox");
    revalidatePath("/dashboard");
  }
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  await requireUser();
  const pw = String(form.get("password") ?? "");
  if (pw.length < 12) return { error: "Use at least 12 characters." };
  if (pw !== String(form.get("confirm") ?? "")) return { error: "The two passwords don't match." };
  const sb = await sessionClient();
  const { error } = await sb.auth.updateUser({ password: pw });
  if (error) return { error: error.message };
  return { ok: "Password updated." };
}

// ---------------- Team (admin only) ----------------

const newPassword = () => randomBytes(12).toString("base64url");

export async function createMember(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const email = z.string().trim().toLowerCase().email().safeParse(form.get("email"));
  if (!email.success) return { error: "Enter a valid email address." };
  const role = form.get("role") === "admin" ? "admin" : "member";
  const password = newPassword();
  const { error } = await admin().auth.admin.createUser({
    email: email.data, password, email_confirm: true, app_metadata: { member: true, role },
  });
  if (error) return { error: /already|exists|registered/i.test(error.message) ? "That email already has an account." : error.message };
  revalidatePath("/team");
  return { ok: `Account created for ${email.data}. Send them this temporary password. It is shown only once.`, secret: password };
}

export async function resetMemberPassword(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const id = String(form.get("id"));
  if (id === me.id) return { error: "Use the Account page to change your own password." };
  const password = newPassword();
  const { error } = await admin().auth.admin.updateUserById(id, { password });
  if (error) return { error: error.message };
  return { ok: "New temporary password (shown once):", secret: password };
}

export async function removeMember(form: FormData) {
  const me = await requireAdmin();
  const id = String(form.get("id"));
  if (id === me.id) return;
  // Deleting the auth user cascades to their inboxes, keys, tokens, outbox and logs.
  await admin().auth.admin.deleteUser(id);
  revalidatePath("/team");
}

export async function setMemberRole(form: FormData) {
  const me = await requireAdmin();
  const id = String(form.get("id"));
  if (id === me.id) return;
  await admin().auth.admin.updateUserById(id, { app_metadata: { member: true, role: form.get("role") === "admin" ? "admin" : "member" } });
  revalidatePath("/team");
}
