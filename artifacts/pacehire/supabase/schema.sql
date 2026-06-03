-- =============================================================================
-- PaceHire Database Schema
-- Run this against your Supabase project via the SQL Editor.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. templates
-- ---------------------------------------------------------------------------
create table if not exists public.templates (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles (id) on delete cascade,
  name             text not null,
  description      text,
  total_duration   integer,                      -- stored in minutes
  sections         jsonb not null default '[]',  -- [{ id, name, duration_minutes, order }]
  is_public        boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. sessions
-- ---------------------------------------------------------------------------
create table if not exists public.sessions (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles (id) on delete cascade,
  template_id         uuid references public.templates (id) on delete set null,
  template_snapshot   jsonb,           -- full copy of template at session start
  started_at          timestamptz,
  ended_at            timestamptz,
  planned_duration    integer,         -- in minutes
  actual_duration     integer,         -- in seconds
  section_results     jsonb,           -- [{ section_id, name, planned_seconds, actual_seconds, skipped }]
  -- Candidate tracking
  candidate_name      text,
  role_name           text,
  candidate_email     text,
  -- Post-session scorecard
  overall_rating      integer check (overall_rating between 1 and 5),
  recommendation      text check (recommendation in ('strong_yes', 'yes', 'no', 'strong_no')),
  post_session_notes  text,
  created_at          timestamptz not null default now()
);

-- If you already applied the original schema, run these ALTER statements instead:
--
-- alter table public.sessions add column if not exists candidate_name     text;
-- alter table public.sessions add column if not exists role_name          text;
-- alter table public.sessions add column if not exists candidate_email    text;
-- alter table public.sessions add column if not exists overall_rating     integer check (overall_rating between 1 and 5);
-- alter table public.sessions add column if not exists recommendation     text check (recommendation in ('strong_yes', 'yes', 'no', 'strong_no'));
-- alter table public.sessions add column if not exists post_session_notes text;

-- ---------------------------------------------------------------------------
-- Trigger: keep templates.updated_at current
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger templates_updated_at
  before update on public.templates
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Trigger: auto-create a profile row when a user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles  enable row level security;
alter table public.templates enable row level security;
alter table public.sessions  enable row level security;

-- profiles: users can only see and edit their own row
create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles: delete own"
  on public.profiles for delete
  using (auth.uid() = id);

-- templates: owner has full access; public templates are readable by anyone
create policy "templates: select own"
  on public.templates for select
  using (auth.uid() = user_id or is_public = true);

create policy "templates: insert own"
  on public.templates for insert
  with check (auth.uid() = user_id);

create policy "templates: update own"
  on public.templates for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "templates: delete own"
  on public.templates for delete
  using (auth.uid() = user_id);

-- sessions: users can only see and edit their own sessions
create policy "sessions: select own"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "sessions: insert own"
  on public.sessions for insert
  with check (auth.uid() = user_id);

create policy "sessions: update own"
  on public.sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sessions: delete own"
  on public.sessions for delete
  using (auth.uid() = user_id);
