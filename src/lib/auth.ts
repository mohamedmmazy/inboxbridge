import { admin } from "./supabase/admin";
import { sha256 } from "./crypto";
import type { Scope } from "./oauth";

export type Principal = {
  ownerId: string;
  scopes: Scope[];
  source: "oauth" | "apikey";
  label: string;
};

/** Resolves a Bearer token (API key `mcpe_…` or OAuth access token `mcpo_…`) to a principal. */
export async function authenticate(token: string): Promise<Principal | null> {
  const hash = sha256(token);
  const db = admin();

  if (token.startsWith("mcpe_")) {
    const { data } = await db.from("api_keys").select("id,owner_id,name,scopes,revoked_at").eq("key_hash", hash).maybeSingle();
    if (!data || data.revoked_at) return null;
    void db.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id).then(() => {}, () => {});
    return { ownerId: data.owner_id, scopes: data.scopes, source: "apikey", label: data.name };
  }

  if (token.startsWith("mcpo_")) {
    const { data } = await db.from("oauth_tokens")
      .select("owner_id,scopes,expires_at,revoked_at,client:oauth_clients(client_name)")
      .eq("token_hash", hash).eq("kind", "access").maybeSingle();
    if (!data || data.revoked_at || new Date(data.expires_at).getTime() < Date.now()) return null;
    const client = data.client as unknown as { client_name: string } | null;
    return { ownerId: data.owner_id, scopes: data.scopes, source: "oauth", label: client?.client_name ?? "oauth" };
  }
  return null;
}
