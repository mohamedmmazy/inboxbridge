# InboxBridge

Private, multi-user **email MCP server**. It lets Claude, ChatGPT, Cursor, VS Code and any MCP client read, search,
organize, draft, schedule and send email from **iCloud, Gmail, Yahoo, Fastmail, Zoho, Yandex, AOL and any
IMAP/SMTP webmail**. An open alternative in the spirit of [mcpemails.com](https://mcpemails.com), built for a team
or company: invite-only accounts, per-user encryption, approval before anything is sent.

**Stack:** Next.js 16 (App Router) · Node.js · Supabase (Postgres + Auth) · hosted on Vercel.
Mail is fetched live over IMAP and never stored.

## Features

- **MCP endpoint** (`/api/mcp`, Streamable HTTP, stateless) with 16 tools: inbox/folder listing, read & search
  (including across all inboxes), organize, delete (to Trash by default), send/reply/forward, drafts, scheduled sends,
  signatures, contact search.
- **Auth for AI apps:** OAuth 2.1 with dynamic client registration + PKCE (Claude, ChatGPT, Cursor, ...) and scoped
  API keys for scripts. Scopes: `read`, `write`, `send`.
- **Easy for non-developers:** guided onboarding, per-provider connection guides (`/providers`), plain-language errors,
  copy-paste setup for each AI app.
- **Team ready:** invite-only. Admins add people on the Team page (one-time password shown), reset passwords, change roles
  and remove people (their data is deleted).
- **Safety:** sends wait in an Outbox until the user approves (per-inbox switch); deletes are recoverable by default;
  bulk operations default to dry-run; email bodies are flagged as untrusted for the model.

## Security model

| Concern | How it is handled |
|---|---|
| Mailbox passwords | AES-256-GCM, key derived per user with HKDF from `ENCRYPTION_KEY` |
| Data isolation | Every query is scoped to the signed-in user; all tables are RLS deny-all, only the server key can read them |
| Who can sign in | Only accounts created by an admin (`app_metadata.member`), which users cannot edit themselves |
| SSRF | Mail servers are resolved first; private/loopback/link-local addresses and unusual ports are rejected |
| Tokens | API keys and OAuth tokens are stored as SHA-256 hashes; refresh tokens rotate with reuse detection |
| Logs | Activity records tool name, result and timing only, never email content |

## Setup

1. **Supabase:** create a project and run `supabase/migrations/0001_init.sql` in the SQL editor.
   Optional but recommended: Authentication → Sign In / Providers → turn off "Allow new users to sign up".
2. **Env:** copy `.env.example` to `.env.local` and fill it in (`npm run gen-key` makes the encryption key).
3. **First admin:** `npm run create-owner` (reads `OWNER_EMAIL` and `OWNER_PASSWORD` from `.env.local`).
4. **Run:** `npm install && npm run dev` → http://localhost:3000.

## Deploy to Vercel

1. Import the repo in Vercel (framework: Next.js).
2. Add the env vars from `.env.example` (mark `SUPABASE_SECRET_KEY`, `ENCRYPTION_KEY`, `CRON_SECRET` as sensitive).
   Set `APP_URL` to the production URL with no trailing slash.
3. Make sure **Vercel Authentication** is off for production, otherwise AI apps hit a Vercel login wall.
4. Deploy. The MCP URL is `https://<your-app>/api/mcp`.

> Vercel's free Hobby plan is for personal, non-commercial use. Company use needs Pro.

### Scheduled sends

Vercel Hobby cron runs once a day (`vercel.json`). For per-minute dispatch use Supabase `pg_cron` + `pg_net`:

```sql
create extension if not exists pg_cron; create extension if not exists pg_net;
select cron.schedule('dispatch-outbox', '* * * * *', $$
  select net.http_get('https://<your-app>/api/cron/dispatch',
    headers := jsonb_build_object('Authorization','Bearer <CRON_SECRET>'));
$$);
```

## Connecting AI apps

Open **Connect your AI** in the app for step-by-step instructions. Short version: add `https://<your-app>/api/mcp` as a
custom connector / remote MCP server, sign in, and approve. Claude Code:
`claude mcp add --transport http inboxbridge https://<your-app>/api/mcp`.

## Not supported

- **Outlook / Hotmail / Microsoft 365:** Microsoft disabled password sign-in for IMAP/SMTP. Needs an OAuth integration.
- **Proton Mail:** only reachable through the Proton Bridge desktop app.
- Reminders/snooze, automations and attachment text extraction.

## Layout

```
src/app/(site)     public landing, provider guides, login
src/app/(app)      signed-in app: home, inboxes, connect, outbox, access, activity, team, account
src/app/api        /mcp, /oauth/*, /cron/dispatch
src/lib/mcp        MCP tools
src/lib/mail       IMAP / SMTP layer
src/lib/*          crypto, auth, OAuth, outbox, SSRF guard, provider data
supabase/migrations
```

License: AGPL-3.0-only.
