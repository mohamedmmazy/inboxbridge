import { env } from "@/lib/env";
import { SCOPES } from "@/lib/oauth";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    resource: `${env.appUrl}/api/mcp`,
    authorization_servers: [env.appUrl],
    bearer_methods_supported: ["header"],
    scopes_supported: SCOPES,
  });
}
