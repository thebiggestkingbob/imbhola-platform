-- Run after migrations 001 through 003 in a fresh test database.
begin;
insert into imbhola.companies(id,legal_name,status) values
 ('00000000-0000-4000-8000-000000000001','Atlas','active'),
 ('00000000-0000-4000-8000-000000000002','Beacon','active'),
 ('00000000-0000-4000-8000-000000000003','Closed','suspended');
insert into imbhola.memberships(company_id,user_id,role,starts_at,expires_at) values
 ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','owner',now()-interval '1 day',null),
 ('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000101','sdf',now()-interval '1 day',null),
 ('00000000-0000-4000-8000-000000000003','00000000-0000-4000-8000-000000000101','owner',now()-interval '1 day',null),
 ('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000102','training',now()-interval '1 day',null);
set local role imbhola_runtime;
do $$
begin
  if exists (select from imbhola.available_workspaces(null)) then
    raise exception 'Directory exposed companies without identity';
  end if;
end;
$$;
select set_config('imbhola.actor_id','00000000-0000-4000-8000-000000000101',true);
do $$
begin
  if (select array_agg(legal_name) from imbhola.available_workspaces(null)) is distinct from array['Atlas'] then
    raise exception 'Directory included a suspended or unassigned company';
  end if;
  if exists (select from imbhola.available_workspaces('00000000-0000-4000-8000-000000000001')) then
    raise exception 'Directory did not respect pagination';
  end if;
end;
$$;
select set_config('imbhola.company_id','00000000-0000-4000-8000-000000000001',true);
insert into imbhola.employees(company_id,employee_number)
values('00000000-0000-4000-8000-000000000001','AT-001');
insert into imbhola.employees(company_id,employee_number)
values('00000000-0000-4000-8000-000000000001','at-001') on conflict do nothing;
update imbhola.employees set job_title='Coordinator' where employee_number='AT-001';
update imbhola.employees set job_title='Coordinator' where employee_number='AT-001';
select set_config('imbhola.actor_id','00000000-0000-4000-8000-000000000102',true);
select set_config('imbhola.company_id','00000000-0000-4000-8000-000000000002',true);
do $$
begin
  begin
    insert into imbhola.employees(company_id,employee_number)
      values('00000000-0000-4000-8000-000000000002','BE-001');
    raise exception 'Read-only staff wrote workforce data';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
do $$
begin
  if (select array_agg(action order by action) from imbhola.audit_events
      where company_id='00000000-0000-4000-8000-000000000001' and actor_id='00000000-0000-4000-8000-000000000101')
     is distinct from array['employee.created','employee.updated'] then
    raise exception 'Workforce audit did not record each actual change';
  end if;
end;
$$;
rollback;
