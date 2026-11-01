"use server";

import { redirect } from "next/navigation";
import { sessionClient } from "@/lib/supabase/server";

export async function signIn(_: { error?: string } | undefined, form: FormData) {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/dashboard");

  const sb = await sessionClient();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: "That email or password isn't right." };

  // Only accounts created by an admin may use the app.
  if (data.user.app_metadata?.member !== true) {
    await sb.auth.signOut();
    return { error: "This account hasn't been set up for access. Ask your admin to add you." };
  }
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
}

export async function signOut() {
  const sb = await sessionClient();
  await sb.auth.signOut();
  redirect("/login");
}
