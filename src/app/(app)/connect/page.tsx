import type { Metadata } from "next";
import { requireUser } from "@/lib/supabase/server";
import { env } from "@/lib/env";
import { CopyField } from "../../components/copy";

export const metadata: Metadata = { title: "Connect your AI" };

export default async function Connect() {
  await requireUser();
  const url = `${env.appUrl}/api/mcp`;
  const clients = [
    {
      name: "Claude (website & desktop app)", badge: "Easiest",
      steps: ["Open Claude → Settings → Connectors.", "Click “Add custom connector”.", "Name it InboxBridge and paste your link below.", "Click Add, then Connect. A page from this site opens: sign in and press Approve."],
      field: url,
    },
    {
      name: "ChatGPT",
      steps: ["Open ChatGPT → Settings → Connectors → Advanced, and turn on Developer mode.", "Click Create (or Add connector) and choose a custom MCP server.", "Paste your link, set authentication to OAuth, and save.", "Press Connect, sign in here, and Approve."],
      field: url,
    },
    {
      name: "Claude Code (terminal)",
      steps: ["Run this command once:"],
      field: `claude mcp add --transport http inboxbridge ${url}`,
      after: "Then type /mcp inside Claude Code and choose Authenticate.",
    },
    {
      name: "Cursor",
      steps: ["Open Cursor → Settings → MCP → Add new MCP server.", "Paste this into the config file and save, then click Connect and approve:"],
      field: JSON.stringify({ mcpServers: { inboxbridge: { url } } }),
    },
    {
      name: "VS Code (Copilot)",
      steps: ["Create the file .vscode/mcp.json in your project with this content:"],
      field: JSON.stringify({ servers: { inboxbridge: { type: "http", url } } }),
      after: "Click “Start” above the server entry, then sign in and approve.",
    },
    {
      name: "Apps that use an API key (Cline, n8n, scripts)",
      steps: ["Create a key on the Access page.", "Use your link as the server URL and send the key in this header:"],
      field: url,
      after: "Authorization: Bearer YOUR_KEY",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Connect your AI</h1>
        <p className="muted mt-1 max-w-2xl">Give your AI app this one link. The first time, it opens a sign-in page here where you approve what it can do. You can disconnect anytime under Access.</p>
      </div>
      <div className="card"><CopyField label="Your connection link" value={url} /></div>
      <div className="grid gap-4 xl:grid-cols-2">
        {clients.map((c) => (
          <section key={c.name} className="card space-y-4">
            <div className="flex items-center justify-between gap-2"><h2 className="font-extrabold">{c.name}</h2>{c.badge && <span className="pill">{c.badge}</span>}</div>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm">{c.steps.map((s) => <li key={s}>{s}</li>)}</ol>
            <CopyField value={c.field} />
            {c.after && <p className="muted text-sm">{c.after}</p>}
          </section>
        ))}
      </div>
    </div>
  );
}
