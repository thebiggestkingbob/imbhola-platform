-- Reference-backed OFO review and immutable snapshot preparation.
-- Do not load fabricated OFO code lists. No write access to official references.
alter table public.employee_ofo_reviews
  add column if not exists suggested_at timestamptz not null default now();
create index if not exists ofo_reviews_pending_idx on public.employee_ofo_reviews(organization_id,review_status,created_at desc);

-- A reviewer can approve an existing, verified OFO reference entry only.
-- This function intentionally does NOT suggest codes or grant employee edit rights.
create or replace function public.review_employee_ofo(
 p_org uuid,
 p_employee uuid,
 p_version uuid,
 p_code text,
 p_reason text
)
returns uuid language plpgsql security invoker set search_path=''
as $$
declare record_id uuid;
begin
 if auth.uid() is null then raise exception 'Not authenticated'; end if;
 if not private.has_org_role(p_org,
    array['company_admin','hr_admin','sdf']::public.imbhola_member_role[]) then
   raise exception 'Not authorised';
 end if;
 if p_code !~ '^[0-9]{6}$' or char_length(trim(coalesce(p_reason,'')))<8
    or char_length(p_reason)>1000 then
   raise exception 'Valid code and reviewer reason are required';
 end if;
 if not exists(select 1 from public.ofo_occupations o
    join public.ofo_reference_versions v on v.id=o.version_id
    where o.version_id=p_version and o.code=p_code and v.verified_at is not null) then
   raise exception 'Occupation code has no verified reference';
 end if;
 if not exists(select 1 from public.employee_profiles e
    where e.id=p_employee and e.organization_id=p_org) then
   raise exception 'Employee not found in this organisation';
 end if;
 insert into public.employee_ofo_reviews(
    organization_id,employee_id,version_id,code,review_status,override_reason,reviewer_id
 ) values(p_org,p_employee,p_version,p_code,'verified',p_reason,auth.uid())
 returning id into record_id;
 return record_id;
end;$$;

-- This RPC remains non-callable by browser users until audited insert permissions
-- and controlled reference loading are approved.
revoke all on function public.review_employee_ofo(uuid,uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.review_employee_ofo(uuid,uuid,uuid,text,text) to service_role;

-- Prevent accidental mutation of completed workforce snapshots, even for elevated clients.
create or replace function private.prevent_snapshot_mutation()
returns trigger language plpgsql set search_path=''
as $$
begin
 raise exception 'Workforce snapshot lines are immutable';
end;$$;
create trigger immutable_workforce_snapshot_lines before update or delete
  on public.workforce_snapshot_lines for each row
  execute function private.prevent_snapshot_mutation();

-- Do not allow committed batches to change status or content.
create or replace function private.prevent_committed_batch_mutation()
returns trigger language plpgsql set search_path=''
as $$
begin
 if OLD.status='committed' then
   raise exception 'Committed workforce batches are immutable';
 end if;
 return NEW;
end;$$;
create trigger immutable_committed_batches before update or delete
  on public.workforce_import_batches for each row
  execute function private.prevent_committed_batch_mutation();
