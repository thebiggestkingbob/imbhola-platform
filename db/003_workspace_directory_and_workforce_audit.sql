-- Apply after the tenant access migration, using the migration owner.
begin;

create unique index employees_company_number_casefold on imbhola.employees(company_id,lower(employee_number));
create index memberships_actor_company on imbhola.memberships(user_id,company_id);
create index sdf_assignments_actor_company on imbhola.sdf_assignments(user_id,company_id)
  where revoked_at is null;

create function imbhola.current_company_roles()
returns table(company_id uuid, role text)
language sql stable security definer
set search_path = pg_catalog, pg_temp
as $$
  select m.company_id,m.role
  from imbhola.memberships m
  where m.user_id = nullif(current_setting('imbhola.actor_id',true),'')::uuid
    and m.starts_at <= statement_timestamp()
    and (m.expires_at is null or m.expires_at > statement_timestamp())
    and (m.role <> 'sdf' or exists (
      select 1 from imbhola.sdf_assignments a
      where a.company_id=m.company_id and a.user_id=m.user_id
        and a.starts_at <= statement_timestamp() and a.expires_at > statement_timestamp()
        and a.revoked_at is null
    ))
$$;
revoke all on function imbhola.current_company_roles() from public;

create or replace function imbhola.has_company_role(requested_company uuid, allowed_roles text[])
returns boolean
language sql stable security definer
set search_path = pg_catalog, pg_temp
as $$
  select coalesce(requested_company::text = current_setting('imbhola.company_id',true),false)
    and exists (
      select 1 from imbhola.current_company_roles() m
      where m.company_id=requested_company and m.role=any(allowed_roles)
    )
$$;

create function imbhola.available_workspaces(after_company uuid)
returns table(id uuid, legal_name text, roles text[])
language sql stable security definer
set search_path = pg_catalog, pg_temp
as $$
  select c.id,c.legal_name,array_agg(distinct m.role order by m.role)
  from imbhola.current_company_roles() m
  join imbhola.companies c on c.id=m.company_id
  where c.status not in ('suspended','archived') and (after_company is null or c.id > after_company)
  group by c.id,c.legal_name
  order by c.id
  limit 51
$$;
revoke all on function imbhola.available_workspaces(uuid) from public;
grant execute on function imbhola.available_workspaces(uuid) to imbhola_runtime;

create function imbhola.audit_employee_change()
returns trigger
language plpgsql security definer
set search_path = pg_catalog, pg_temp
as $$
begin
  insert into imbhola.audit_events(company_id,actor_id,action,entity_type,entity_id)
  values(new.company_id,nullif(current_setting('imbhola.actor_id',true),'')::uuid,
    case when TG_OP='INSERT' then 'employee.created' else 'employee.updated' end,
    'employee',new.id);
  return new;
end;
$$;
revoke all on function imbhola.audit_employee_change() from public;

create trigger employee_created after insert on imbhola.employees
for each row execute function imbhola.audit_employee_change();
create trigger employee_updated after update on imbhola.employees
for each row when (old is distinct from new) execute function imbhola.audit_employee_change();

commit;
