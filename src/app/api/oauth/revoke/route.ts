import { revokeToken } from "@/lib/oauth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const token = (form?.get("token") ?? "").toString();
  if (token) await revokeToken(token);
  // RFC 7009: always 200, even for unknown tokens.
  return new Response(null, { status: 200, headers: { "Access-Control-Allow-Origin": "*" } });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}
