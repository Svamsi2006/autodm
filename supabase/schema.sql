-- InstaFlow Supabase Schema
-- Run this SQL in the Supabase SQL Editor to create the automations table.

create extension if not exists "pgcrypto";

create table if not exists public.automations (
  id uuid primary key default gen_random_uuid(),
  post_id text not null unique,
  post_caption text,
  post_thumbnail text,
  trigger_keyword text not null,
  reply_comment_text text,
  button_text text not null default 'Send me the access',
  resource_url text not null,
  require_follow boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Index for fast webhook lookup by post_id and active status
create index if not exists idx_automations_post_id_active
  on public.automations (post_id, is_active);

-- Enable Row Level Security (backend uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS)
alter table public.automations enable row level security;

