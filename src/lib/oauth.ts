import { admin } from "./supabase/admin";
import { randomToken, sha256 } from "./crypto";
import { createHash, randomUUID } from "node:crypto";

export const SCOPES = ["read", "write", "send"] as const;
export type Scope = (typeof SCOPES)[number];

export const SCOPE_HELP: Record<Scope, string> = {
  read: "Read, list and search messages and folders",
  write: "Organize, move, flag, archive, delete, manage folders, drafts and schedule",
  send: "Send, reply to and forward email (subject to the per-inbox approval hold)",
};

export function parseScopes(raw: string | string[] | undefined | null): Scope[] {
  const list = Array.isArray(raw) ? raw : (raw ?? "").split(/[\s,]+/);
  const out = list.filter((s): s is Scope => (SCOPES as readonly string[]).includes(s));
  return out.length ? [...new Set(out)] : [...SCOPES];
}

const ACCESS_TTL_S = 3600;
const REFRESH_TTL_S = 60 * 60 * 24 * 30;
const CODE_TTL_S = 600;

const inSeconds = (s: number) => new Date(Date.now() + s * 1000).toISOString();

export function validRedirectUri(uri: string): boolean {
  try {
    const u = new URL(uri);
    if (["javascript:", "data:", "file:", "vbscript:", "blob:"].includes(u.protocol)) return false;
    if (u.protocol === "http:") return ["localhost", "127.0.0.1", "[::1]"].includes(u.hostname);
    return !u.hash;
  } catch {
    return false;
  }
}

export async function registerClient(name: string, redirectUris: string[]) {
  const client_id = `mcpc_${randomUUID()}`;
  const { error } = await admin().from("oauth_clients").insert({ client_id, client_name: name.slice(0, 100), redirect_uris: redirectUris });
  if (error) throw new Error(error.message);
  return client_id;
}

export async function getClient(clientId: string) {
  const { data } = await admin().from("oauth_clients").select("*").eq("client_id", clientId).maybeSingle();
  return data as null | { client_id: string; client_name: string; redirect_uris: string[] };
}

export async function createAuthCode(p: {
  clientId: string; ownerId: string; redirectUri: string; codeChallenge: string; scopes: Scope[];
}) {
  const code = randomToken("mcpa");
  const { error } = await admin().from("oauth_codes").insert({
    code_hash: sha256(code), client_id: p.clientId, owner_id: p.ownerId, redirect_uri: p.redirectUri,
    code_challenge: p.codeChallenge, scopes: p.scopes, expires_at: inSeconds(CODE_TTL_S),
  });
  if (error) throw new Error(error.message);
  return code;
}

async function issuePair(clientId: string, ownerId: string, scopes: string[], familyId: string) {
  const access = randomToken("mcpo");
  const refresh = randomToken("mcpr");
  const { error } = await admin().from("oauth_tokens").insert([
    { token_hash: sha256(access), kind: "access", client_id: clientId, owner_id: ownerId, scopes, family_id: familyId, expires_at: inSeconds(ACCESS_TTL_S) },
    { token_hash: sha256(refresh), kind: "refresh", client_id: clientId, owner_id: ownerId, scopes, family_id: familyId, expires_at: inSeconds(REFRESH_TTL_S) },
  ]);
  if (error) throw new Error(error.message);
  return { access_token: access, token_type: "Bearer", expires_in: ACCESS_TTL_S, refresh_token: refresh, scope: scopes.join(" ") };
}

export class OAuthError extends Error {
  constructor(public code: string, message: string, public status = 400) { super(message); }
}

export async function exchangeCode(p: { code: string; clientId: string; redirectUri: string; codeVerifier: string }) {
  const db = admin();
  // Single-use: mark used atomically, then validate.
  const { data: row } = await db.from("oauth_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("code_hash", sha256(p.code)).is("used_at", null)
    .select("*").maybeSingle();
  if (!row) throw new OAuthError("invalid_grant", "Unknown or already used code");
  if (new Date(row.expires_at).getTime() < Date.now()) throw new OAuthError("invalid_grant", "Code expired");
  if (row.client_id !== p.clientId || row.redirect_uri !== p.redirectUri) throw new OAuthError("invalid_grant", "Client or redirect_uri mismatch");
  const challenge = createHash("sha256").update(p.codeVerifier).digest("base64url");
  if (challenge !== row.code_challenge) throw new OAuthError("invalid_grant", "PKCE verification failed");
  return issuePair(row.client_id, row.owner_id, row.scopes, randomUUID());
}

export async function refresh(p: { refreshToken: string; clientId: string }) {
  const db = admin();
  const { data: row } = await db.from("oauth_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("token_hash", sha256(p.refreshToken)).eq("kind", "refresh").is("revoked_at", null)
    .select("*").maybeSingle();
  if (!row) {
    // Reuse of an already-rotated refresh token => assume theft, kill the whole family.
    const { data: used } = await db.from("oauth_tokens").select("family_id").eq("token_hash", sha256(p.refreshToken)).maybeSingle();
    if (used) await db.from("oauth_tokens").update({ revoked_at: new Date().toISOString() }).eq("family_id", used.family_id);
    throw new OAuthError("invalid_grant", "Invalid refresh token");
  }
  if (row.client_id !== p.clientId || new Date(row.expires_at).getTime() < Date.now()) throw new OAuthError("invalid_grant", "Refresh token expired or client mismatch");
  return issuePair(row.client_id, row.owner_id, row.scopes, row.family_id);
}

export async function revokeToken(token: string) {
  const db = admin();
  const { data } = await db.from("oauth_tokens").select("family_id").eq("token_hash", sha256(token)).maybeSingle();
  if (data) await db.from("oauth_tokens").update({ revoked_at: new Date().toISOString() }).eq("family_id", data.family_id);
}
