export type InboxRow = {
  id: string;
  owner_id: string;
  email: string;
  label: string | null;
  provider: string;
  imap_host: string;
  imap_port: number;
  imap_secure: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  username: string;
  password_enc: string;
  signature: string;
  require_approval: boolean;
  last_error: string | null;
  created_at: string;
};

export type Address = { name?: string; address: string };

export type MessageSummary = {
  uid: number;
  folder: string;
  subject: string;
  from: string;
  to: string;
  date: string | null;
  seen: boolean;
  flagged: boolean;
  hasAttachments: boolean;
  snippet?: string;
};

export type OutgoingMail = {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  text?: string;
  html?: string;
  inReplyTo?: string;
  references?: string[];
  /** Raw `.eml` ready to be sent verbatim is not used; attachments are not supported for sends. */
};
