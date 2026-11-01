import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "../env";

export async function sessionClient() {
  const store = await cookies();
  return createServerClient(env.supabaseUrl, env.supabasePublishableKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Called from a Server Component; the proxy refreshes the session instead.
        }
      },
    },
  });
}

export const isAdmin = (u: User) => u.app_metadata?.role === "admin";

/**
 * The signed-in user, or null. The JWT is verified with Supabase (never trusted from the cookie alone).
 * Only accounts an admin created (app_metadata.member === true, which users cannot edit themselves)
 * are accepted, so a stray self-signup against the Supabase Auth API gets nowhere.
 */
export async function getCurrentUser(): Promise<User | null> {
  const sb = await sessionClient();
  const { data } = await sb.auth.getUser();
  const user = data.user;
  if (!user || user.app_metadata?.member !== true) return null;
  return user;
}

export async function requireUser(next = "/dashboard") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireAdmin() {
  const user = await requireUser("/team");
  if (!isAdmin(user)) redirect("/dashboard");
  return user;
}
