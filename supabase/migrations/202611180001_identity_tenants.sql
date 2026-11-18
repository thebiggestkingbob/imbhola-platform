-- IMBHOLA V3.0 — initial tenancy and identity foundation
-- NOT APPLIED TO ANY LIVE SUPABASE PROJECT.
-- Requires security review before application to a new dedicated Imbhola project.
-- No public registration/tenant-claiming policies, no official SETA exports.

create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.imbhola_member_role as enum (
  'company_admin', 'executive', 'hr_admin', 'training_admin',
  'sdf', 'line_manager', 'committee_member', 'signatory',
  'employee', 'auditor'
);
create type public.imbhola_member_status as enum ('invited', 'active', 'suspended', 'revoked');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null check (char_length(trim(legal_name)) between 2 and 250),
  display_name text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.imbhola_member_role not null,
  status public.imbhola_member_status not null default 'invited',
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id, role),
  constraint approved_active_memberships check (status <> 'active' or approved_at is not null)
);

create index organization_memberships_user_org_idx
  on public.organization_memberships (user_id, organization_id)
  where status = 'active';
create index organization_memberships_org_idx
  on public.organization_memberships (organization_id);

-- Never store raw invitation tokens. Hashing occurs on the trusted server.
create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  invitee_email text not null,
  role public.imbhola_member_role not null,
  token_hash text not null unique,
  invited_by uuid not null references auth.users(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint valid_invite_email check (invitee_email = lower(trim(invitee_email))),
  constraint valid_invite_expiry check (expires_at > created_at)
);
create index organization_invitations_org_idx on public.organization_invitations (organization_id);

create table public.audit_events (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations(id),
  actor_user_id uuid references auth.users(id),
  event_type text not null check (char_length(event_type) between 3 and 120),
  target_type text,
  target_id uuid,
  event_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_events_org_time_idx on public.audit_events (organization_id, created_at desc);

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.organization_invitations enable row level security;
alter table public.audit_events enable row level security;

-- A SECURITY DEFINER lookup avoids recursive membership policies.
-- All functions force schema lookup and use auth.uid() rather than user input.
create or replace function private.is_active_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1 from public.organization_memberships m
    where m.organization_id = org_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  );
$$;

create or replace function private.has_org_role(org_id uuid, allowed_roles public.imbhola_member_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1 from public.organization_memberships m
    where m.organization_id = org_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and m.role = any(allowed_roles)
  );
$$;

revoke all on function private.is_active_member(uuid) from public;
revoke all on function private.has_org_role(uuid, public.imbhola_member_role[]) from public;
grant execute on function private.is_active_member(uuid) to authenticated;
grant execute on function private.has_org_role(uuid, public.imbhola_member_role[]) to authenticated;

create policy "Members may read verified organizations they belong to"
  on public.organizations for select to authenticated
  using (verified_at is not null and private.is_active_member(id));

create policy "Members may see their own memberships"
  on public.organization_memberships for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Authorized organization administrators may read memberships"
  on public.organization_memberships for select to authenticated
  using (private.has_org_role(organization_id,
    array['company_admin','hr_admin']::public.imbhola_member_role[]));

create policy "Authorized administrators may read organization audit records"
  on public.audit_events for select to authenticated
  using (private.has_org_role(organization_id,
    array['company_admin','auditor']::public.imbhola_member_role[]));

-- Intentionally NO INSERT/UPDATE/DELETE policies for untrusted users.
-- Invitations, membership approval, role changes and audit writes must go through
-- separately reviewed, authenticated and rate-limited server-side workflows.
-- Never expose service_role credentials in a browser or NEXT_PUBLIC variable.
