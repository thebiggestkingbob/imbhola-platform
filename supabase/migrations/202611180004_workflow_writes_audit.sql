-- Reviewed development-stage writing paths with DB audit.
-- Do NOT enable employer registration or collect real employee personal data.
create or replace function private.audit_tenant_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  target_org uuid;
  target_uuid uuid;
begin
  if TG_OP = 'DELETE' then
    target_org := OLD.organization_id;
    target_uuid := OLD.id;
  else
    target_org := NEW.organization_id;
    target_uuid := NEW.id;
  end if;
  insert into public.audit_events(organization_id, actor_user_id, event_type, target_type, target_id, event_metadata)
  values(target_org, auth.uid(), 'record_' || lower(TG_OP), TG_TABLE_NAME, target_uuid,
    jsonb_build_object('operation',TG_OP));
  if TG_OP = 'DELETE' then return OLD; end if;
  return NEW;
end;$$;

-- Prevent user-controlled rows from moving between organisations.
create or replace function private.prevent_org_move()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if NEW.organization_id is distinct from OLD.organization_id then
    raise exception 'Organization cannot change';
  end if;
  return NEW;
end;$$;

create policy cycles_insert on public.reporting_cycles for insert to authenticated
with check(status='draft' and seta_adapter_id is null and
  private.has_org_role(organization_id,array['company_admin','hr_admin','sdf']::public.imbhola_member_role[]));
create policy events_insert on public.training_events for insert to authenticated
with check(status='draft' and recorded_by=(select auth.uid()) and
  private.has_org_role(organization_id,array['company_admin','hr_admin','training_admin','sdf']::public.imbhola_member_role[]));
create policy plans_insert on public.wsp_plan_items for insert to authenticated
with check(status='draft' and
  private.has_org_role(organization_id,array['company_admin','hr_admin','training_admin','sdf']::public.imbhola_member_role[]));
create policy atr_insert on public.atr_records for insert to authenticated
with check(status='draft' and evidence_state='missing' and
  private.has_org_role(organization_id,array['company_admin','hr_admin','training_admin','sdf']::public.imbhola_member_role[]));
create policy tasks_insert on public.workflow_tasks for insert to authenticated
with check(status='open' and
  private.has_org_role(organization_id,array['company_admin','hr_admin','training_admin','sdf']::public.imbhola_member_role[]));

create trigger reporting_cycles_audit after insert or update or delete on public.reporting_cycles
for each row execute function private.audit_tenant_change();
create trigger training_programs_audit after insert or update or delete on public.training_programs
for each row execute function private.audit_tenant_change();
create trigger training_events_audit after insert or update or delete on public.training_events
for each row execute function private.audit_tenant_change();
create trigger wsp_plan_items_audit after insert or update or delete on public.wsp_plan_items
for each row execute function private.audit_tenant_change();
create trigger atr_records_audit after insert or update or delete on public.atr_records
for each row execute function private.audit_tenant_change();
create trigger workflow_tasks_audit after insert or update or delete on public.workflow_tasks
for each row execute function private.audit_tenant_change();

create trigger reporting_cycles_org_immutable before update on public.reporting_cycles
for each row execute function private.prevent_org_move();
create trigger training_programs_org_immutable before update on public.training_programs
for each row execute function private.prevent_org_move();
create trigger training_events_org_immutable before update on public.training_events
for each row execute function private.prevent_org_move();
create trigger wsp_plan_items_org_immutable before update on public.wsp_plan_items
for each row execute function private.prevent_org_move();
create trigger atr_records_org_immutable before update on public.atr_records
for each row execute function private.prevent_org_move();
create trigger workflow_tasks_org_immutable before update on public.workflow_tasks
for each row execute function private.prevent_org_move();
