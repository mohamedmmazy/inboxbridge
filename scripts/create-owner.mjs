// Creates (or updates) the first admin account in Supabase Auth.
// Usage: OWNER_PASSWORD='...' npm run create-owner
// Further members are added from the in-app Team page.
import { createClient } from "@supabase/supabase-js";

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SECRET_KEY: key, OWNER_EMAIL: email, OWNER_PASSWORD: password } = process.env;
if (!url || !key || !email || !password) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY, OWNER_EMAIL and OWNER_PASSWORD (min 12 chars).");
  process.exit(1);
}
if (password.length < 12) {
  console.error("OWNER_PASSWORD must be at least 12 characters.");
  process.exit(1);
}
const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
if (listErr) throw listErr;
const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
const app_metadata = { role: "admin", member: true };
if (existing) {
  const { error } = await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true, app_metadata });
  if (error) throw error;
  console.log(`Updated admin ${email}`);
} else {
  const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, app_metadata });
  if (error) throw error;
  console.log(`Created admin ${email}`);
}
