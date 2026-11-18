-- Reviewed workflow transition: a training event may move from draft to completed
-- without allowing modification of organisation identity or captured figures.
create or replace function private.enforce_event_completion()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if OLD.status <> 'draft' or NEW.status <> 'completed' then
    raise exception 'Only draft training events can be marked completed';
  end if;
  if (to_jsonb(NEW) - 'status') is distinct from (to_jsonb(OLD) - 'status') then
    raise exception 'Completion cannot edit training event values';
  end if;
  return NEW;
end;$$;
create trigger training_events_only_completion before update on public.training_events
for each row execute function private.enforce_event_completion();
create policy events_complete on public.training_events for update to authenticated
using(status='draft' and private.has_org_role(organization_id,
  array['company_admin','hr_admin','training_admin','sdf']::public.imbhola_member_role[]))
with check(status='completed' and private.has_org_role(organization_id,
  array['company_admin','hr_admin','training_admin','sdf']::public.imbhola_member_role[]));
