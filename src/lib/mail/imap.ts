import { ImapFlow, type FetchMessageObject, type MailboxObject } from "imapflow";
import { simpleParser, type ParsedMail, type AddressObject } from "mailparser";
import { decrypt } from "../crypto";
import { IMAP_PORTS, resolvePublicHost } from "../net";
import type { InboxRow, MessageSummary } from "./types";

export async function withImap<T>(inbox: InboxRow, fn: (c: ImapFlow) => Promise<T>): Promise<T> {
  const target = await resolvePublicHost(inbox.imap_host, inbox.imap_port, IMAP_PORTS);
  const client = new ImapFlow({
    host: target.ip,
    servername: target.servername,
    port: inbox.imap_port,
    secure: inbox.imap_secure,
    auth: { user: inbox.username, pass: decrypt(inbox.password_enc, inbox.owner_id) },
    logger: false,
    socketTimeout: 45_000,
    greetingTimeout: 15_000,
    connectionTimeout: 15_000,
  });
  client.on("error", () => {
    /* surfaced by the pending command; avoid unhandled 'error' event crash */
  });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    try { await client.logout(); } catch { client.close(); }
  }
}

function fmtAddr(a?: { name?: string; address?: string }[]): string {
  return (a ?? []).map((x) => (x.name ? `${x.name} <${x.address}>` : x.address ?? "")).join(", ");
}

function hasAttachment(m: FetchMessageObject): boolean {
  const walk = (n: any): boolean => {
    if (!n) return false;
    if (n.disposition === "attachment") return true;
    return (n.childNodes ?? []).some(walk);
  };
  return walk(m.bodyStructure);
}

function summarize(m: FetchMessageObject, folder: string): MessageSummary {
  return {
    uid: m.uid,
    folder,
    subject: m.envelope?.subject ?? "(no subject)",
    from: fmtAddr(m.envelope?.from),
    to: fmtAddr(m.envelope?.to),
    date: m.envelope?.date ? new Date(m.envelope.date).toISOString() : null,
    seen: m.flags?.has("\\Seen") ?? false,
    flagged: m.flags?.has("\\Flagged") ?? false,
    hasAttachments: hasAttachment(m),
  };
}

export async function listFolders(inbox: InboxRow) {
  return withImap(inbox, async (c) => {
    const boxes = await c.list({ statusQuery: { messages: true, unseen: true } });
    return boxes.map((b) => ({
      path: b.path,
      name: b.name,
      specialUse: b.specialUse ?? null,
      messages: b.status?.messages ?? null,
      unseen: b.status?.unseen ?? null,
    }));
  });
}

export type SearchQuery = {
  text?: string;
  from?: string;
  to?: string;
  subject?: string;
  since?: string;
  before?: string;
  unseen?: boolean;
  flagged?: boolean;
};

function toImapQuery(q: SearchQuery) {
  const query: Record<string, unknown> = {};
  if (q.text) query.body = q.text;
  if (q.from) query.from = q.from;
  if (q.to) query.to = q.to;
  if (q.subject) query.subject = q.subject;
  if (q.since) query.since = new Date(q.since);
  if (q.before) query.before = new Date(q.before);
  if (q.unseen) query.seen = false;
  if (q.flagged) query.flagged = true;
  return Object.keys(query).length ? query : { all: true };
}

export async function listMessages(
  inbox: InboxRow,
  folder: string,
  opts: { limit: number; offset: number; query?: SearchQuery },
) {
  return withImap(inbox, async (c) => {
    const lock = await c.getMailboxLock(folder, { readOnly: true });
    try {
      const uids = ((await c.search(toImapQuery(opts.query ?? {}), { uid: true })) || []).sort((a, b) => b - a);
      const page = uids.slice(opts.offset, opts.offset + opts.limit);
      const out: MessageSummary[] = [];
      if (page.length) {
        for await (const m of c.fetch(page, { uid: true, envelope: true, flags: true, bodyStructure: true }, { uid: true })) {
          out.push(summarize(m, folder));
        }
      }
      out.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
      return { total: uids.length, messages: out };
    } finally {
      lock.release();
    }
  });
}

export type FullMessage = MessageSummary & {
  cc: string;
  fromAddrs: string[];
  toAddrs: string[];
  ccAddrs: string[];
  replyToAddrs: string[];
  messageId: string | null;
  inReplyTo: string | null;
  references: string[];
  text: string;
  html: string | null;
  attachments: { filename: string | null; contentType: string; size: number }[];
};

function addrList(a: AddressObject | AddressObject[] | undefined): string[] {
  if (!a) return [];
  return (Array.isArray(a) ? a : [a]).flatMap((x) => x.value.map((v) => v.address ?? "").filter(Boolean));
}

function addrText(a: AddressObject | AddressObject[] | undefined): string {
  if (!a) return "";
  return (Array.isArray(a) ? a : [a]).map((x) => x.text).join(", ");
}

export async function readMessage(inbox: InboxRow, folder: string, uid: number, maxChars: number): Promise<FullMessage | null> {
  return withImap(inbox, async (c) => {
    const lock = await c.getMailboxLock(folder);
    try {
      const m = await c.fetchOne(String(uid), { uid: true, envelope: true, flags: true, bodyStructure: true, source: true }, { uid: true });
      if (!m || !m.source) return null;
      const p: ParsedMail = await simpleParser(m.source);
      const text = (p.text ?? "").trim();
      return {
        ...summarize(m, folder),
        cc: addrText(p.cc),
        fromAddrs: addrList(p.from),
        toAddrs: addrList(p.to),
        ccAddrs: addrList(p.cc),
        replyToAddrs: addrList(p.replyTo),
        messageId: p.messageId ?? null,
        inReplyTo: p.inReplyTo ?? null,
        references: Array.isArray(p.references) ? p.references : p.references ? [p.references] : [],
        text: text.length > maxChars ? text.slice(0, maxChars) + `\n…[truncated ${text.length - maxChars} chars]` : text,
        html: null,
        attachments: p.attachments.map((a) => ({ filename: a.filename ?? null, contentType: a.contentType, size: a.size })),
      };
    } finally {
      lock.release();
    }
  });
}

/** Raw RFC822 source of a message, for `.eml` export. */
export async function rawMessage(inbox: InboxRow, folder: string, uid: number): Promise<Buffer | null> {
  return withImap(inbox, async (c) => {
    const lock = await c.getMailboxLock(folder, { readOnly: true });
    try {
      const m = await c.fetchOne(String(uid), { source: true }, { uid: true });
      return m && m.source ? m.source : null;
    } finally {
      lock.release();
    }
  });
}

export type Organize =
  | { op: "mark_read" | "mark_unread" | "flag" | "unflag" }
  | { op: "move" | "copy"; destination: string }
  | { op: "archive" }
  | { op: "trash" };

async function specialFolder(c: ImapFlow, use: "\\Archive" | "\\Trash" | "\\Drafts" | "\\Sent", fallbacks: string[]): Promise<string | null> {
  const boxes = await c.list();
  const bySpecial = boxes.find((b) => b.specialUse === use);
  if (bySpecial) return bySpecial.path;
  for (const f of fallbacks) {
    const hit = boxes.find((b) => b.path.toLowerCase() === f.toLowerCase() || b.name.toLowerCase() === f.toLowerCase());
    if (hit) return hit.path;
  }
  return null;
}

export const TRASH_FALLBACKS = ["Trash", "Deleted Messages", "Deleted Items", "Bin"];
export const ARCHIVE_FALLBACKS = ["Archive", "Archives", "All Mail"];
export const DRAFTS_FALLBACKS = ["Drafts", "Draft"];
export const SENT_FALLBACKS = ["Sent", "Sent Messages", "Sent Items"];

export async function organize(inbox: InboxRow, folder: string, uids: number[], action: Organize) {
  return withImap(inbox, async (c) => {
    const lock = await c.getMailboxLock(folder);
    try {
      const range = uids.join(",");
      switch (action.op) {
        case "mark_read": await c.messageFlagsAdd(range, ["\\Seen"], { uid: true }); break;
        case "mark_unread": await c.messageFlagsRemove(range, ["\\Seen"], { uid: true }); break;
        case "flag": await c.messageFlagsAdd(range, ["\\Flagged"], { uid: true }); break;
        case "unflag": await c.messageFlagsRemove(range, ["\\Flagged"], { uid: true }); break;
        case "move": await c.messageMove(range, action.destination, { uid: true }); break;
        case "copy": await c.messageCopy(range, action.destination, { uid: true }); break;
        case "archive": {
          const dest = await specialFolder(c, "\\Archive", ARCHIVE_FALLBACKS);
          if (!dest) throw new Error("No Archive folder found; use op=move with an explicit destination.");
          await c.messageMove(range, dest, { uid: true });
          break;
        }
        case "trash": {
          const dest = await specialFolder(c, "\\Trash", TRASH_FALLBACKS);
          if (!dest) throw new Error("No Trash folder found; use op=move with an explicit destination.");
          await c.messageMove(range, dest, { uid: true });
          break;
        }
      }
      return { affected: uids.length };
    } finally {
      lock.release();
    }
  });
}

/** Permanently removes messages (flag \\Deleted + expunge). */
export async function expunge(inbox: InboxRow, folder: string, uids: number[]) {
  return withImap(inbox, async (c) => {
    const lock = await c.getMailboxLock(folder);
    try {
      await c.messageDelete(uids.join(","), { uid: true });
      return { affected: uids.length };
    } finally {
      lock.release();
    }
  });
}

export async function createFolder(inbox: InboxRow, path: string) {
  return withImap(inbox, async (c) => (await c.mailboxCreate(path)).path);
}
export async function renameFolder(inbox: InboxRow, path: string, newPath: string) {
  return withImap(inbox, async (c) => (await c.mailboxRename(path, newPath)).newPath);
}
export async function deleteFolder(inbox: InboxRow, path: string) {
  return withImap(inbox, async (c) => (await c.mailboxDelete(path)).path);
}

/** Append a raw RFC822 message to a folder (drafts, sent copy). Returns the new UID when the server reports it. */
export async function appendMessage(inbox: InboxRow, folder: string | "drafts" | "sent", raw: Buffer, flags: string[]) {
  return withImap(inbox, async (c) => {
    let target = folder as string;
    if (folder === "drafts") target = (await specialFolder(c, "\\Drafts", DRAFTS_FALLBACKS)) ?? "Drafts";
    if (folder === "sent") target = (await specialFolder(c, "\\Sent", SENT_FALLBACKS)) ?? "Sent";
    const res = await c.append(target, raw, flags);
    return { folder: target, uid: res ? (res.uid ?? null) : null };
  });
}

export async function resolveSpecial(inbox: InboxRow, kind: "drafts" | "sent"): Promise<string> {
  return withImap(inbox, async (c) => {
    const found = kind === "drafts"
      ? await specialFolder(c, "\\Drafts", DRAFTS_FALLBACKS)
      : await specialFolder(c, "\\Sent", SENT_FALLBACKS);
    return found ?? (kind === "drafts" ? "Drafts" : "Sent");
  });
}

export async function verifyImap(inbox: InboxRow): Promise<MailboxObject | boolean> {
  return withImap(inbox, async (c) => c.mailbox ?? true);
}

export type { MailboxObject };
