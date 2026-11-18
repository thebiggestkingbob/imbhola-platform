-- Allow domain tables whose primary key is organization_id, not id, in audit triggers.
create or replace function private.audit_tenant_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  row_json jsonb;
  target_org uuid;
  target_uuid uuid;
begin
  if TG_OP = 'DELETE' then row_json:=to_jsonb(OLD); else row_json:=to_jsonb(NEW); end if;
  target_org := (row_json->>'organization_id')::uuid;
  target_uuid := coalesce((row_json->>'id')::uuid,target_org);
  insert into public.audit_events(organization_id,actor_user_id,event_type,target_type,target_id,event_metadata)
  values(target_org,auth.uid(),'record_'||lower(TG_OP),TG_TABLE_NAME,target_uuid,
    jsonb_build_object('operation',TG_OP));
  if TG_OP='DELETE' then return OLD; end if;
  return NEW;
end;$$;
