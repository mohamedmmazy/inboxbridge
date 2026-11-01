"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { createAuthCode, getClient, parseScopes } from "@/lib/oauth";

export async function decide(form: FormData) {
  const user = await requireUser("/dashboard");
  const clientId = String(form.get("client_id"));
  const redirectUri = String(form.get("redirect_uri"));
  const state = String(form.get("state") ?? "");
  const challenge = String(form.get("code_challenge"));
  const scopes = parseScopes(form.getAll("scope").map(String));

  // Re-validate everything server-side; the hidden fields are attacker-controllable.
  const client = await getClient(clientId);
  if (!client || !client.redirect_uris.includes(redirectUri) || !challenge) throw new Error("Invalid authorization request");

  const target = new URL(redirectUri);
  if (form.get("decision") !== "approve") {
    target.searchParams.set("error", "access_denied");
  } else {
    const code = await createAuthCode({ clientId, ownerId: user.id, redirectUri, codeChallenge: challenge, scopes });
    target.searchParams.set("code", code);
  }
  if (state) target.searchParams.set("state", state);
  redirect(target.toString());
}
