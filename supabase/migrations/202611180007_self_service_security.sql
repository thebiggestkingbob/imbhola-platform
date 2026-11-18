-- Employee-only access to their own registered training event details.
drop policy if exists events_read on public.training_events;
create policy events_read on public.training_events for select to authenticated
using(
  private.has_org_role(organization_id,
    array['company_admin','executive','hr_admin','training_admin','sdf','line_manager','committee_member','signatory','auditor']::public.imbhola_member_role[])
  or exists(
    select 1 from public.training_participations p
    join public.employee_profiles e
      on e.id=p.employee_id and e.organization_id=p.organization_id
    where p.organization_id=training_events.organization_id
      and p.event_id=training_events.id
      and e.auth_user_id=(select auth.uid())
      and private.is_active_member(training_events.organization_id)
  )
);
-- Prevent a single account from flooding requests even within verified membership.
create or replace function private.rate_limit_training_requests()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 if (select count(*) from public.employee_training_requests r
      where r.employee_id=new.employee_id and r.organization_id=new.organization_id
      and r.created_at > now()- interval '24 hours') >= 5 then
   raise exception 'Daily training request limit reached';
 end if;
 return NEW;
end;$$;
create trigger training_requests_daily_limit before insert on public.employee_training_requests
for each row execute function private.rate_limit_training_requests();
