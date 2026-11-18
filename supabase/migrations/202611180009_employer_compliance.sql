-- Employer compliance and reference configuration.
-- Regulatory numbers and SETA associations are *draft* and unverified.
create table public.organization_compliance_profiles(
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  registration_number text,
  sdl_number text,
  seta_name text,
  industry text,
  profile_status text not null default 'draft' check (profile_status in ('draft','under_review','verified')),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
alter table public.organization_compliance_profiles enable row level security;
create policy compliance_profile_read on public.organization_compliance_profiles
  for select to authenticated using(
    private.has_org_role(organization_id,array['company_admin','executive','hr_admin','sdf','auditor']::public.imbhola_member_role[])
  );
create policy compliance_profile_insert on public.organization_compliance_profiles
  for insert to authenticated with check (
    profile_status='draft' and updated_by=(select auth.uid()) and
    private.has_org_role(organization_id,array['company_admin','hr_admin']::public.imbhola_member_role[])
  );
create policy compliance_profile_update on public.organization_compliance_profiles
  for update to authenticated using(
    profile_status='draft' and private.has_org_role(organization_id,array['company_admin','hr_admin']::public.imbhola_member_role[])
  ) with check (
    profile_status='draft' and updated_by=(select auth.uid()) and
    private.has_org_role(organization_id,array['company_admin','hr_admin']::public.imbhola_member_role[])
  );

create table public.levy_payment_records(
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  cycle_id uuid not null,
  levy_month date not null check (extract(day from levy_month)=1),
  amount_paid numeric(14,2) not null check(amount_paid>=0),
  payment_reference text,
  verification_status text not null default 'unverified' check (verification_status in ('unverified','verified')),
  recorded_by uuid not null references auth.users(id),
  recorded_at timestamptz not null default now(),
  foreign key(organization_id,cycle_id) references public.reporting_cycles(organization_id,id),
  unique(organization_id,cycle_id,levy_month)
);
create index levy_payment_records_org_idx on public.levy_payment_records(organization_id,cycle_id);
alter table public.levy_payment_records enable row level security;
create policy levy_read on public.levy_payment_records
  for select to authenticated using(
    private.has_org_role(organization_id,array['company_admin','executive','hr_admin','sdf','auditor']::public.imbhola_member_role[])
  );
create policy levy_insert_draft on public.levy_payment_records
  for insert to authenticated with check (
    verification_status='unverified' and recorded_by=(select auth.uid()) and
    private.has_org_role(organization_id,array['company_admin','hr_admin']::public.imbhola_member_role[])
  );

create table public.seta_adapter_versions(
  id uuid primary key default gen_random_uuid(),
  seta_code text not null,
  reporting_year integer not null,
  source_reference text,
  template_sha256 text,
  verified_by uuid references auth.users(id),
  approved_by uuid references auth.users(id),
  verified_at timestamptz,
  approved_at timestamptz,
  status text not null default 'unverified' check(status in ('unverified','reviewed','approved','retired')),
  created_at timestamptz not null default now(),
  unique(seta_code,reporting_year,template_sha256)
);
alter table public.seta_adapter_versions enable row level security;
create policy verified_seta_adapters_read on public.seta_adapter_versions
  for select to authenticated using(status='approved' and verified_at is not null and approved_at is not null);
-- No write policies: trusted platform admin backend must verify source fixtures.

create table public.employee_ofo_reviews(
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null,
  version_id uuid not null,
  code text not null,
  review_status text not null default 'pending' check(review_status in ('pending','verified','rejected')),
  override_reason text,
  reviewer_id uuid references auth.users(id),
  created_at timestamptz not null default now(),
  foreign key(organization_id,employee_id) references public.employee_profiles(organization_id,id),
  foreign key(version_id,code) references public.ofo_occupations(version_id,code)
);
create index employee_ofo_reviews_org_idx on public.employee_ofo_reviews(organization_id,employee_id);
alter table public.employee_ofo_reviews enable row level security;
create policy ofo_reviews_read on public.employee_ofo_reviews
  for select to authenticated using(private.has_org_role(organization_id,
    array['company_admin','hr_admin','training_admin','sdf','auditor']::public.imbhola_member_role[]));
-- No client write policies until reviewed OFO reference library and employees exist.

create trigger compliance_profile_audit after insert or update or delete on public.organization_compliance_profiles
  for each row execute function private.audit_tenant_change();
create trigger levy_record_audit after insert or update or delete on public.levy_payment_records
  for each row execute function private.audit_tenant_change();
create trigger ofo_reviews_audit after insert or update or delete on public.employee_ofo_reviews
  for each row execute function private.audit_tenant_change();
create trigger compliance_profile_org_immutable before update on public.organization_compliance_profiles
  for each row execute function private.prevent_org_move();
