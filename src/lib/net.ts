import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

export const IMAP_PORTS = [993, 143];
export const SMTP_PORTS = [465, 587, 2525, 25];

function privateV4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function privateV6(ip: string): boolean {
  const x = ip.toLowerCase();
  if (x === "::" || x === "::1") return true;
  if (x.startsWith("fc") || x.startsWith("fd") || x.startsWith("fe8") || x.startsWith("fe9") || x.startsWith("fea") || x.startsWith("feb")) return true;
  const mapped = x.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return mapped ? privateV4(mapped[1]) : false;
}

export const isPrivateIp = (ip: string) => (isIP(ip) === 4 ? privateV4(ip) : privateV6(ip));

/**
 * Users choose their own mail servers, so the server must never be tricked into dialing internal
 * addresses (SSRF). Resolve once, reject private/loopback/link-local ranges, and connect to the
 * resolved IP (TLS still verifies the original hostname via `servername`).
 */
export async function resolvePublicHost(host: string, port: number, allowedPorts: number[]) {
  if (!allowedPorts.includes(port)) throw new Error(`Port ${port} is not allowed. Use one of: ${allowedPorts.join(", ")}.`);
  const clean = host.trim().toLowerCase();
  if (!/^[a-z0-9.-]+$/.test(clean) || clean.length > 253) throw new Error("That server name doesn't look right.");
  if (isIP(clean)) {
    if (isPrivateIp(clean)) throw new Error("That address is not allowed.");
    return { ip: clean, servername: undefined as string | undefined };
  }
  const addrs = await lookup(clean, { all: true }).catch(() => {
    throw new Error(`We couldn't find a server called "${clean}". Check the spelling.`);
  });
  if (!addrs.length || addrs.some((a) => isPrivateIp(a.address))) throw new Error("That server resolves to a private address, which is not allowed.");
  return { ip: addrs[0].address, servername: clean as string | undefined };
}
