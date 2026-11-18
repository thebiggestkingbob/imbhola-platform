-- IMBHOLA V3 / M3-M5 domain foundation.
-- No production employee data, no official SETA template, no public signup.
-- All tenant-scoped data requires active membership and approved role.
create table public.reporting_cycles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  reporting_year integer not null check (reporting_year between 2020 and 2100),
  status text not null default 'draft' check (status in ('draft','in_review','approved','locked','submitted_external','archived')),
  seta_adapter_id uuid,
  created_at timestamptz not null default now(),
  unique (organization_id, reporting_year),
  unique (organization_id,id)
);
create table public.employee_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_code text not null check (length(employee_code) between 1 and 80),
  given_name text not null,
  family_name text not null,
  job_title text,
  department text,
  status text not null default 'active' check (status in ('active','inactive')),
  ofo_code text,
  auth_user_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (organization_id,employee_code),
  unique (organization_id,id)
);
create index employee_profiles_auth_idx on public.employee_profiles(auth_user_id) where auth_user_id is not null;
create table public.ofo_reference_versions (
  id uuid primary key default gen_random_uuid(),
  version_name text not null unique,
  source_url text,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.ofo_occupations (
  version_id uuid not null references public.ofo_reference_versions(id),
  code text not null,
  title text not null,
  primary key (version_id,code)
);
create table public.training_programs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (length(trim(title)) between 3 and 220),
  description text,
  training_type text not null default 'unclassified' check (training_type in ('unclassified','pivotal','non_pivotal')),
  provider text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique(organization_id,id)
);
create index training_programs_org_idx on public.training_programs(organization_id);
create table public.training_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  program_id uuid not null,
  event_date date not null,
  participants_count integer not null default 0 check (participants_count>=0),
  actual_cost numeric(14,2) not null default 0 check (actual_cost>=0),
  status text not null default 'draft' check (status in ('draft','completed','cancelled')),
  recorded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  foreign key (organization_id,program_id) references public.training_programs(organization_id,id),
  unique (organization_id,id)
);
create table public.wsp_plan_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  cycle_id uuid not null,
  program_id uuid not null,
  planned_learners integer not null default 0 check (planned_learners>=0),
  planned_cost numeric(14,2) not null default 0 check (planned_cost>=0),
  quarter text check (quarter in ('Q1','Q2','Q3','Q4')),
  status text not null default 'draft' check (status in ('draft','reviewed','approved')),
  created_at timestamptz not null default now(),
  foreign key (organization_id,cycle_id) references public.reporting_cycles(organization_id,id),
  foreign key (organization_id,program_id) references public.training_programs(organization_id,id),
  unique (organization_id,id)
);
create table public.atr_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  cycle_id uuid not null,
  event_id uuid not null,
  evidence_state text not null default 'missing' check (evidence_state in ('missing','pending_review','verified')),
  status text not null default 'draft' check (status in ('draft','reviewed','approved')),
  created_at timestamptz not null default now(),
  foreign key (organization_id,cycle_id) references public.reporting_cycles(organization_id,id),
  foreign key (organization_id,event_id) references public.training_events(organization_id,id),
  unique (organization_id,cycle_id,event_id)
);
create table public.evidence_metadata (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  object_path text not null,
  original_filename text not null,
  content_sha256 text,
  mime_type text,
  scan_status text not null default 'pending' check (scan_status in ('pending','clean','rejected')),
  related_record_type text not null check (related_record_type in ('training_event','atr_record','approval','grant')),
  related_record_id uuid not null,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (organization_id,object_path)
);
create table public.review_decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  cycle_id uuid not null,
  decision text not null check (decision in ('requested_changes','approved','rejected')),
  reviewer_id uuid not null references auth.users(id),
  comment text,
  created_at timestamptz not null default now(),
  foreign key (organization_id,cycle_id) references public.reporting_cycles(organization_id,id)
);
create table public.grant_records (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  cycle_id uuid not null,
  grant_category text not null check (grant_category in ('mandatory','discretionary','other')),
  amount numeric(14,2) not null default 0 check (amount>=0),
  stage text not null check (stage in ('estimate','eligible_under_review','applied','approved','paid','reconciled','declined')),
  reference_number text,
  created_at timestamptz not null default now(),
  foreign key (organization_id,cycle_id) references public.reporting_cycles(organization_id,id)
);
create table public.workflow_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  cycle_id uuid,
  title text not null check (length(title) between 3 and 200),
  assigned_user_id uuid references auth.users(id),
  status text not null default 'open' check (status in ('open','in_progress','blocked','completed')),
  due_on date,
  created_at timestamptz not null default now(),
  foreign key (organization_id,cycle_id) references public.reporting_cycles(organization_id,id)
);
create index reporting_cycles_org_idx on public.reporting_cycles(organization_id);
create index employee_profiles_org_idx on public.employee_profiles(organization_id);
create index training_events_org_date_idx on public.training_events(organization_id,event_date);
create index wsp_plan_items_org_idx on public.wsp_plan_items(organization_id,cycle_id);
create index atr_records_org_idx on public.atr_records(organization_id,cycle_id);
create index evidence_metadata_org_idx on public.evidence_metadata(organization_id,created_at);
create index review_decisions_org_idx on public.review_decisions(organization_id,cycle_id);
create index grant_records_org_idx on public.grant_records(organization_id,cycle_id);
create index workflow_tasks_org_idx on public.workflow_tasks(organization_id,status);
-- RLS denies cross-org reads and all unauthorised writes.
alter table public.reporting_cycles enable row level security;
alter table public.employee_profiles enable row level security;
alter table public.ofo_reference_versions enable row level security;
alter table public.ofo_occupations enable row level security;
alter table public.training_programs enable row level security;
alter table public.training_events enable row level security;
alter table public.wsp_plan_items enable row level security;
alter table public.atr_records enable row level security;
alter table public.evidence_metadata enable row level security;
alter table public.review_decisions enable row level security;
alter table public.grant_records enable row level security;
alter table public.workflow_tasks enable row level security;
-- Select policies
create policy cycles_read on public.reporting_cycles for select to authenticated using (private.is_active_member(organization_id));
create policy employees_read on public.employee_profiles for select to authenticated using (
  private.has_org_role(organization_id,array['company_admin','hr_admin','training_admin','sdf','auditor']::public.imbhola_member_role[])
  or (auth_user_id = (select auth.uid()) and private.is_active_member(organization_id))
);
create policy ofo_versions_read on public.ofo_reference_versions for select to authenticated using (verified_at is not null);
create policy ofo_occupations_read on public.ofo_occupations for select to authenticated using (
  exists (select 1 from public.ofo_reference_versions v where v.id=version_id and v.verified_at is not null)
);
create policy programs_read on public.training_programs for select to authenticated using (private.is_active_member(organization_id));
create policy events_read on public.training_events for select to authenticated using (private.is_active_member(organization_id));
create policy plans_read on public.wsp_plan_items for select to authenticated using (private.has_org_role(organization_id,array['company_admin','hr_admin','training_admin','sdf','line_manager','committee_member','signatory','auditor','executive']::public.imbhola_member_role[]));
create policy atr_read on public.atr_records for select to authenticated using (private.has_org_role(organization_id,array['company_admin','hr_admin','training_admin','sdf','committee_member','signatory','auditor','executive']::public.imbhola_member_role[]));
create policy evidence_read on public.evidence_metadata for select to authenticated using (private.has_org_role(organization_id,array['company_admin','hr_admin','training_admin','sdf','auditor','signatory']::public.imbhola_member_role[]) and scan_status='clean');
create policy decisions_read on public.review_decisions for select to authenticated using (private.has_org_role(organization_id,array['company_admin','hr_admin','sdf','committee_member','signatory','auditor','executive']::public.imbhola_member_role[]));
create policy grants_read on public.grant_records for select to authenticated using (private.has_org_role(organization_id,array['company_admin','executive','hr_admin','sdf','auditor']::public.imbhola_member_role[]));
create policy tasks_read on public.workflow_tasks for select to authenticated using (private.has_org_role(organization_id,array['company_admin','hr_admin','training_admin','sdf','auditor']::public.imbhola_member_role[]) or (assigned_user_id=(select auth.uid()) and private.is_active_member(organization_id)));
-- Training programme writes require trusted active organization roles.
create policy programs_insert on public.training_programs for insert to authenticated
with check(private.has_org_role(organization_id,array['company_admin','hr_admin','training_admin','sdf']::public.imbhola_member_role[]) and created_by=(select auth.uid()));
create policy programs_update on public.training_programs for update to authenticated
using(private.has_org_role(organization_id,array['company_admin','hr_admin','training_admin','sdf']::public.imbhola_member_role[]))
with check(private.has_org_role(organization_id,array['company_admin','hr_admin','training_admin','sdf']::public.imbhola_member_role[]));
-- Deliberately no user-facing INSERT/UPDATE permissions for HR profiles, evidence,
-- submissions, grants, approvals, financial numbers or verified occupational codes yet.
-- Those require workflow-specific review, privacy assessment and audit-trail enforcement.
