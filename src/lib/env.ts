function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}`);
  return v;
}

export const env = {
  get supabaseUrl() { return req("NEXT_PUBLIC_SUPABASE_URL"); },
  get supabasePublishableKey() { return req("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"); },
  get supabaseSecretKey() { return req("SUPABASE_SECRET_KEY"); },
  /** The first admin. Further admins/members are managed from the Team page. */
  get adminEmail() { return req("OWNER_EMAIL").toLowerCase(); },
  get maxInboxesPerUser() { return Number(process.env.MAX_INBOXES_PER_USER ?? 5); },
  get encryptionKey() { return req("ENCRYPTION_KEY"); },
  get cronSecret() { return req("CRON_SECRET"); },
  /** Public origin, no trailing slash. Falls back to Vercel's URL if APP_URL is unset. */
  get appUrl() {
    const raw = process.env.APP_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
    if (!raw) throw new Error("Missing environment variable APP_URL");
    return raw.replace(/\/+$/, "");
  },
};
