import { z } from "zod";
import { registerClient, validRedirectUri } from "@/lib/oauth";

export const dynamic = "force-dynamic";

const Body = z.object({
  client_name: z.string().min(1).max(100).default("MCP client"),
  redirect_uris: z.array(z.string()).min(1).max(10),
});

const cors = { "Access-Control-Allow-Origin": "*" };

/** RFC 7591 dynamic client registration for public (PKCE) clients. Consent still requires the owner to log in. */
export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !parsed.data.redirect_uris.every(validRedirectUri)) {
    return Response.json({ error: "invalid_client_metadata", error_description: "Valid redirect_uris are required (https, or http on localhost)." }, { status: 400, headers: cors });
  }
  const client_id = await registerClient(parsed.data.client_name, parsed.data.redirect_uris);
  return Response.json(
    {
      client_id,
      client_name: parsed.data.client_name,
      redirect_uris: parsed.data.redirect_uris,
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
    },
    { status: 201, headers: cors },
  );
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: { ...cors, "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
}
