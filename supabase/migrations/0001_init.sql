-- MCP Emails Free: single-owner schema.
-- All access goes through the server using the secret (service_role) key.
-- RLS is enabled with no policies and anon/authenticated are revoked => deny by default.

create extension if not exists pgcrypto;

create table public.inboxes (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references auth.users(id) on delete cascade,
  email         text not null,
  label         text,
  provider      text not null default 'imap',
  imap_host     text not null,
  imap_port     int  not null default 993,
  imap_secure   boolean not null default true,
  smtp_host     text not null,
  smtp_port     int  not null default 587,
  smtp_secure   boolean not null default false,   -- true = implicit TLS (465), false = STARTTLS (587)
  username      text not null,
  password_enc  text not null,                    -- AES-256-GCM, base64(iv|tag|ciphertext)
  signature     text not null default '',
  require_approval boolean not null default true, -- hold agent sends for dashboard approval
  last_error    text,
  created_at    timestamptz not null default now(),
  unique (owner_id, email)
);

create table public.api_keys (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  prefix       text not null,
  key_hash     text not null unique,
  scopes       text[] not null default '{read}',
  last_used_at timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);

create table public.oauth_clients (
  client_id     text primary key,
  client_name   text not null,
  redirect_uris text[] not null,
  created_at    timestamptz not null default now()
);

create table public.oauth_codes (
  code_hash      text primary key,
  client_id      text not null references public.oauth_clients(client_id) on delete cascade,
  owner_id       uuid not null references auth.users(id) on delete cascade,
  redirect_uri   text not null,
  code_challenge text not null,
  scopes         text[] not null,
  expires_at     timestamptz not null,
  used_at        timestamptz
);

create table public.oauth_tokens (
  id          uuid primary key default gen_random_uuid(),
  token_hash  text not null unique,
  kind        text not null check (kind in ('access','refresh')),
  client_id   text not null references public.oauth_clients(client_id) on delete cascade,
  owner_id    uuid not null references auth.users(id) on delete cascade,
  scopes      text[] not null,
  family_id   uuid not null,
  expires_at  timestamptz not null,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index oauth_tokens_family_idx on public.oauth_tokens (family_id);

-- Messages waiting to leave: scheduled sends and sends held for approval.
create table public.outbox (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users(id) on delete cascade,
  inbox_id    uuid not null references public.inboxes(id) on delete cascade,
  status      text not null check (status in ('pending_approval','scheduled','sending','sent','failed','cancelled','rejected')),
  send_at     timestamptz,                 -- null = send as soon as approved
  payload_enc text not null,               -- encrypted JSON of the message
  summary     text not null default '',    -- "to · subject" for listing (non-sensitive preview)
  error       text,
  idempotency_key text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (owner_id, idempotency_key)
);
create index outbox_due_idx on public.outbox (status, send_at);

-- Tool-call activity. Never stores email content.
create table public.audit_log (
  id         bigint generated always as identity primary key,
  owner_id   uuid not null references auth.users(id) on delete cascade,
  inbox_id   uuid references public.inboxes(id) on delete set null,
  source     text not null,
  tool       text not null,
  action     text,
  ok         boolean not null,
  ms         int,
  error      text,
  created_at timestamptz not null default now()
);
create index audit_log_created_idx on public.audit_log (created_at desc);

alter table public.inboxes       enable row level security;
alter table public.api_keys      enable row level security;
alter table public.oauth_clients enable row level security;
alter table public.oauth_codes   enable row level security;
alter table public.oauth_tokens  enable row level security;
alter table public.outbox        enable row level security;
alter table public.audit_log     enable row level security;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;
