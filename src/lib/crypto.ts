import { createCipheriv, createDecipheriv, createHash, hkdfSync, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "./env";

function masterKey(): Buffer {
  const k = Buffer.from(env.encryptionKey, "base64");
  if (k.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes, base64 encoded (run `npm run gen-key`).");
  return k;
}

/** Each user gets their own derived key: HKDF-SHA256(master, info = user id). */
function userKey(userId: string): Buffer {
  return Buffer.from(hkdfSync("sha256", masterKey(), "mcp-emails-free/v1", `user:${userId}`, 32));
}

/** AES-256-GCM with a per-user key. Output is base64(iv[12] | tag[16] | ciphertext). */
export function encrypt(plain: string, userId: string): string {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", userKey(userId), iv);
  const ct = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), ct]).toString("base64");
}

export function decrypt(blob: string, userId: string): string {
  const buf = Buffer.from(blob, "base64");
  const d = createDecipheriv("aes-256-gcm", userKey(userId), buf.subarray(0, 12));
  d.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([d.update(buf.subarray(28)), d.final()]).toString("utf8");
}

export function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

export function randomToken(prefix: string, bytes = 32): string {
  return `${prefix}_${randomBytes(bytes).toString("base64url")}`;
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
