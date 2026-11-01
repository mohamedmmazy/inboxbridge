import nodemailer from "nodemailer";
import MailComposer from "nodemailer/lib/mail-composer";
import { decrypt } from "../crypto";
import { resolvePublicHost, SMTP_PORTS } from "../net";
import type { InboxRow, OutgoingMail } from "./types";

async function transport(inbox: InboxRow) {
  const target = await resolvePublicHost(inbox.smtp_host, inbox.smtp_port, SMTP_PORTS);
  return nodemailer.createTransport({
    host: target.ip,
    tls: target.servername ? { servername: target.servername } : undefined,
    port: inbox.smtp_port,
    secure: inbox.smtp_secure,
    requireTLS: !inbox.smtp_secure,
    auth: { user: inbox.username, pass: decrypt(inbox.password_enc, inbox.owner_id) },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 45_000,
  });
}

function withSignature(inbox: InboxRow, m: OutgoingMail): OutgoingMail {
  if (!inbox.signature.trim()) return m;
  return { ...m, text: `${m.text ?? ""}\n\n-- \n${inbox.signature}` };
}

function mailOptions(inbox: InboxRow, m: OutgoingMail) {
  const s = withSignature(inbox, m);
  return {
    from: inbox.label ? { name: inbox.label, address: inbox.email } : inbox.email,
    to: s.to,
    cc: s.cc,
    bcc: s.bcc,
    subject: s.subject,
    text: s.text,
    html: s.html,
    inReplyTo: s.inReplyTo,
    references: s.references,
  };
}

export async function sendMail(inbox: InboxRow, m: OutgoingMail): Promise<{ messageId: string; raw: Buffer }> {
  const opts = mailOptions(inbox, m);
  const info = await (await transport(inbox)).sendMail(opts);
  // Rebuild the exact message for the Sent folder copy.
  const raw = await new MailComposer({ ...opts, messageId: info.messageId }).compile().build();
  return { messageId: info.messageId, raw };
}

export async function buildRaw(inbox: InboxRow, m: OutgoingMail): Promise<Buffer> {
  return new MailComposer(mailOptions(inbox, m)).compile().build();
}

export async function verifySmtp(inbox: InboxRow): Promise<void> {
  await (await transport(inbox)).verify();
}
