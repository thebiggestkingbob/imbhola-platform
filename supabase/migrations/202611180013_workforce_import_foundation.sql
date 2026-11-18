-- Workforce import foundation; audit/history structures only.
-- No user-initiated writes until POPIA, duplicate and atomic import acceptance tests.
create table public.workforce_import_batches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  reporting_cycle_id uuid not null,
  source_sha256 text not null check(source_sha256 ~ '^[0-9a-f]{64}$'),
  source_filename text not null,
  snapshot_date date not null,
  row_count integer not null check(row_count between 1 and 50000),
  status text not null default 'pending' check(status in ('pending','validated','committed','rejected')),
  initiated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  committed_at timestamptz,
  foreign key(organization_id, reporting_cycle_id) references public.reporting_cycles(organization_id,id),
  unique(organization_id, reporting_cycle_id, source_sha256),
  unique(organization_id,id)
);
create index workforce_import_batches_org_idx on public.workforce_import_batches(organization_id,created_at desc);
create index workforce_import_batches_user_idx on public.workforce_import_batches(initiated_by);

create table public.workforce_snapshot_lines(
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  import_batch_id uuid not null,
  employee_code text not null check(char_length(trim(employee_code)) between 1 and 80),
  job_title text,
  department text,
  ofo_code text,
  created_at timestamptz not null default now(),
  foreign key (organization_id,import_batch_id) references public.workforce_import_batches(organization_id,id),
  unique(organization_id,import_batch_id,employee_code)
);
create index workforce_snapshot_lines_batch_idx on public.workforce_snapshot_lines(organization_id,import_batch_id);

alter table public.workforce_import_batches enable row level security;
alter table public.workforce_snapshot_lines enable row level security;
create policy workforce_batches_read on public.workforce_import_batches for select to authenticated
using(private.has_org_role(organization_id,array['company_admin','hr_admin','sdf','auditor']::public.imbhola_member_role[]));
create policy workforce_lines_read on public.workforce_snapshot_lines for select to authenticated
using(private.has_org_role(organization_id,array['company_admin','hr_admin','sdf','auditor']::public.imbhola_member_role[]));

-- No INSERT, UPDATE or DELETE policies. Snapshots are immutable by default.
-- Commit requires separate server-owned transactional workflow after privacy approval.
