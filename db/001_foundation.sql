-- IMBHOLA V3.3 foundation schema (PostgreSQL). Not applied to production.
begin;

create schema imbhola;
revoke all on schema imbhola from public;
set local search_path = imbhola, pg_catalog;
create table companies (
 id uuid primary key default gen_random_uuid(), legal_name text not null,
 registration_number text, sdl_number text, seta_code text not null default 'SERVICES',
 status text not null default 'draft' check(status in ('draft','verified','active','suspended','archived')),
 created_at timestamptz not null default now()
);
create table memberships (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id),
 user_id uuid not null, role text not null check(role in ('owner','hr','training','sdf','committee','signatory','finance')),
 starts_at timestamptz not null default now(), expires_at timestamptz,
 check(expires_at is null or expires_at > starts_at),
 unique(company_id,user_id,role)
);
create table sdf_assignments (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id),
 user_id uuid not null, appointment_file_id uuid, starts_at timestamptz not null,
 expires_at timestamptz not null, revoked_at timestamptz,
 check(expires_at > starts_at)
);
create table reporting_periods (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id),
 reporting_year integer not null check(reporting_year between 2020 and 2100),
 seta_code text not null, status text not null default 'draft',
 unique(company_id,reporting_year,seta_code),
 unique(company_id,id)
);
create table employees (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id),
 employee_number text not null, job_title text, department text, employment_status text not null default 'active',
 created_at timestamptz not null default now(), unique(company_id,employee_number)
);
create table workforce_snapshots (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id),
 reporting_period_id uuid not null,
 snapshot_date date not null, content_hash text not null, snapshot_json jsonb not null,
 frozen_at timestamptz not null default now(),
 foreign key (company_id,reporting_period_id) references reporting_periods(company_id,id)
);
create table rule_versions (
 id uuid primary key default gen_random_uuid(), seta_code text not null, reporting_year integer not null,
 source_uri text not null, content_hash text not null, status text not null default 'draft',
 approved_by uuid, reviewed_by uuid, published_at timestamptz,
 check(status <> 'published' or (approved_by is not null and reviewed_by is not null and approved_by <> reviewed_by))
);
create table submission_versions (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id),
 reporting_period_id uuid not null,
 version_number integer not null, content_hash text not null, frozen_payload jsonb not null,
 rule_version_id uuid references rule_versions(id), approved_at timestamptz,
 check(version_number > 0),
 unique(reporting_period_id,version_number),
 foreign key (company_id,reporting_period_id) references reporting_periods(company_id,id)
);
create table evidence_files (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references companies(id),
 storage_key text not null unique, sha256 text not null, classification text not null,
 uploaded_by uuid not null, created_at timestamptz not null default now()
);
create table audit_events (
 id uuid primary key default gen_random_uuid(), company_id uuid references companies(id),
 actor_id uuid, action text not null, entity_type text not null, entity_id uuid,
 metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
-- Enable RLS by default. No policies are installed until auth identity mapping is reviewed.
-- This intentionally denies client access to these tables until verified policies are added.
alter table companies enable row level security;
alter table memberships enable row level security;
alter table sdf_assignments enable row level security;
alter table reporting_periods enable row level security;
alter table employees enable row level security;
alter table workforce_snapshots enable row level security;
alter table rule_versions enable row level security;
alter table submission_versions enable row level security;
alter table evidence_files enable row level security;
alter table audit_events enable row level security;

revoke all on all tables in schema imbhola from public;

create function reject_frozen_record_change() returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  raise exception '% is append-only', TG_TABLE_NAME;
end;
$$;

create trigger workforce_snapshots_append_only
before update or delete or truncate on workforce_snapshots
for each statement execute function reject_frozen_record_change();

create trigger audit_events_append_only
before update or delete or truncate on audit_events
for each statement execute function reject_frozen_record_change();

create trigger approved_submission_versions_append_only
before update or delete on submission_versions
for each row when (old.approved_at is not null)
execute function reject_frozen_record_change();

create trigger submission_versions_no_truncate
before truncate on submission_versions
for each statement execute function reject_frozen_record_change();

commit;
