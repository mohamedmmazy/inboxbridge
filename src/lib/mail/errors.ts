/** Turns low-level IMAP/SMTP failures into messages a non-technical person can act on. */
export function friendlyMailError(e: unknown, which: "IMAP" | "SMTP", providerName: string): string {
  const err = e as { message?: string; code?: string; responseText?: string; authenticationFailed?: boolean; response?: string };
  const text = `${err.message ?? ""} ${err.responseText ?? ""} ${err.response ?? ""} ${err.code ?? ""}`.toLowerCase();

  if (err.authenticationFailed || /authenticat|invalid credentials|login failed|535|auth.*fail|application-specific|app.?password|web login required/.test(text)) {
    return `${providerName} said no to this email and password. Use an app password (not your normal password) and double-check the username. The guide above shows how to create one.`;
  }
  if (/enotfound|eai_again|couldn't find a server/.test(text)) return `We couldn't find the ${which} server. Check the server name for typos.`;
  if (/etimedout|timeout|econnrefused|ehostunreach|econnreset/.test(text)) return `We couldn't reach the ${which} server. Check the server name and port, and that IMAP/SMTP access is turned on for this mailbox.`;
  if (/certificate|self.signed|altnames|ssl|tls/.test(text)) return `The ${which} server's security certificate didn't check out. Double-check the server name matches your provider's.`;
  if (/not allowed|private address|port \d+/.test(text)) return err.message ?? "That server isn't allowed.";
  return `${which} connection failed: ${err.message ?? "unknown error"}`;
}
