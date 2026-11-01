import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { authenticate } from "@/lib/auth";
import { env } from "@/lib/env";
import { createMcpServer } from "@/lib/mcp/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function unauthorized(message: string) {
  return Response.json(
    { jsonrpc: "2.0", error: { code: -32001, message }, id: null },
    {
      status: 401,
      headers: {
        "WWW-Authenticate": `Bearer resource_metadata="${env.appUrl}/.well-known/oauth-protected-resource"`,
      },
    },
  );
}

export async function POST(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) return unauthorized("Missing bearer token");
  const principal = await authenticate(token);
  if (!principal) return unauthorized("Invalid or expired token");

  // Stateless: a fresh server + transport per request, JSON responses (no SSE needed on serverless).
  const server = createMcpServer(principal);
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  await server.connect(transport);
  const res = await transport.handleRequest(req);
  return res;
}

const methodNotAllowed = () =>
  new Response(null, { status: 405, headers: { Allow: "POST, OPTIONS" } });

export const GET = methodNotAllowed;
export const DELETE = methodNotAllowed;

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, Mcp-Session-Id, Mcp-Protocol-Version, Accept",
    },
  });
}
