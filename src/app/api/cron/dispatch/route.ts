import { env } from "@/lib/env";
import { safeEqual } from "@/lib/crypto";
import { dispatchDue } from "@/lib/outbox";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Sends due scheduled messages. Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; pg_cron can do the same. */
export async function GET(req: Request) {
  const given = (req.headers.get("authorization") ?? "").replace(/^Bearer /i, "");
  if (!given || !safeEqual(given, env.cronSecret)) return new Response("Unauthorized", { status: 401 });
  return Response.json(await dispatchDue());
}
