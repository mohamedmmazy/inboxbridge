import { exchangeCode, OAuthError, refresh } from "@/lib/oauth";

export const dynamic = "force-dynamic";

const headers = { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store", Pragma: "no-cache" };

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  const get = (k: string) => (form?.get(k) ?? "").toString();
  try {
    const grant = get("grant_type");
    if (grant === "authorization_code") {
      const body = await exchangeCode({
        code: get("code"), clientId: get("client_id"), redirectUri: get("redirect_uri"), codeVerifier: get("code_verifier"),
      });
      return Response.json(body, { headers });
    }
    if (grant === "refresh_token") {
      return Response.json(await refresh({ refreshToken: get("refresh_token"), clientId: get("client_id") }), { headers });
    }
    return Response.json({ error: "unsupported_grant_type" }, { status: 400, headers });
  } catch (e) {
    if (e instanceof OAuthError) return Response.json({ error: e.code, error_description: e.message }, { status: e.status, headers });
    return Response.json({ error: "server_error" }, { status: 500, headers });
  }
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: { ...headers, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}
