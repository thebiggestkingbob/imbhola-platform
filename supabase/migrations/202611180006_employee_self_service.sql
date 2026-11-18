-- IMBHOLA M3 employee self-service and narrower information access.
drop policy if exists cycles_read on public.reporting_cycles;
create policy cycles_read on public.reporting_cycles for select to authenticated
using (private.has_org_role(organization_id,
  array['company_admin','executive','hr_admin','training_admin','sdf','line_manager','committee_member','signatory','auditor']::public.imbhola_member_role[]));
drop policy if exists events_read on public.training_events;
create policy events_read on public.training_events for select to authenticated
using(private.has_org_role(organization_id,
  array['company_admin','executive','hr_admin','training_admin','sdf','line_manager','committee_member','signatory','auditor']::public.imbhola_member_role[]));

create table public.training_participations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  event_id uuid not null,
  employee_id uuid not null,
  status text not null default 'scheduled' check(status in ('scheduled','attended','completed','withdrawn')),
  created_at timestamptz not null default now(),
  foreign key (organization_id,event_id) references public.training_events(organization_id,id),
  foreign key (organization_id,employee_id) references public.employee_profiles(organization_id,id),
  unique(organization_id,event_id,employee_id)
);
create index participations_employee_idx on public.training_participations(organization_id,employee_id);
create index participations_event_idx on public.training_participations(organization_id,event_id);
alter table public.training_participations enable row level security;
create policy participations_read on public.training_participations for select to authenticated
using(
  private.has_org_role(organization_id,array['company_admin','hr_admin','training_admin','sdf','auditor']::public.imbhola_member_role[])
  or exists(
    select 1 from public.employee_profiles e
    where e.id=employee_id and e.organization_id=organization_id
      and e.auth_user_id=(select auth.uid())
      and private.is_active_member(organization_id)
  )
);

create table public.employee_training_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null,
  program_id uuid,
  request_note text not null check(char_length(trim(request_note)) between 5 and 1000),
  status text not null default 'submitted' check(status in ('submitted','under_review','approved','declined','completed')),
  created_at timestamptz not null default now(),
  foreign key (organization_id,employee_id) references public.employee_profiles(organization_id,id),
  foreign key (organization_id,program_id) references public.training_programs(organization_id,id)
);
create index employee_training_requests_org_idx on public.employee_training_requests(organization_id,created_at);
create index employee_training_requests_employee_idx on public.employee_training_requests(organization_id,employee_id);
alter table public.employee_training_requests enable row level security;
create policy training_requests_read on public.employee_training_requests for select to authenticated
using(private.has_org_role(organization_id,array['company_admin','hr_admin','training_admin','sdf','line_manager']::public.imbhola_member_role[])
 or exists (
   select 1 from public.employee_profiles e
   where e.id=employee_id and e.organization_id=organization_id
     and e.auth_user_id=(select auth.uid())
     and private.is_active_member(organization_id)
 ));
create policy training_requests_insert_own on public.employee_training_requests for insert to authenticated
with check(status='submitted' and private.is_active_member(organization_id)
 and exists (
   select 1 from public.employee_profiles e
   where e.id=employee_id and e.organization_id=organization_id
     and e.auth_user_id=(select auth.uid())
 ));
create trigger training_requests_audit after insert or update or delete on public.employee_training_requests
for each row execute function private.audit_tenant_change();
create trigger participations_audit after insert or update or delete on public.training_participations
for each row execute function private.audit_tenant_change();
