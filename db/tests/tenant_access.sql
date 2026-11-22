-- Run in an empty test database after 001_foundation.sql and 002_tenant_access.sql.
-- Roll back all fixtures, even after a successful run.
begin;

insert into imbhola.companies(id, legal_name) values
 ('00000000-0000-4000-8000-000000000001','Sample A'),
 ('00000000-0000-4000-8000-000000000002','Sample B');
insert into imbhola.user_identities(issuer,subject,actor_id,revoked_at) values
 ('https://identity.example.test','employer','00000000-0000-4000-8000-000000000101',null),
 ('https://identity.example.test','consultant','00000000-0000-4000-8000-000000000102',null),
 ('https://identity.example.test','reviewer','00000000-0000-4000-8000-000000000103',null),
 ('https://identity.example.test','revoked','00000000-0000-4000-8000-000000000104',now());
insert into imbhola.memberships(company_id,user_id,role,starts_at,expires_at) values
 ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','owner',now() - interval '1 day',null),
 ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000102','sdf',now() - interval '1 day',null),
 ('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000102','sdf',now() - interval '1 day',null),
 ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000103','committee',now() - interval '2 day',now() - interval '1 day');
insert into imbhola.sdf_assignments(company_id,user_id,starts_at,expires_at,revoked_at) values
 ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000102',now() - interval '1 day',now() + interval '1 day',null),
 ('00000000-0000-4000-8000-000000000002','00000000-0000-4000-8000-000000000102',now() - interval '1 day',now() + interval '1 day',now());
insert into imbhola.employees(company_id,employee_number) values
 ('00000000-0000-4000-8000-000000000001','A-001'),
 ('00000000-0000-4000-8000-000000000002','B-001');

set local role imbhola_runtime;

do $$
begin
  if (select count(*) from imbhola.employees) <> 0 then
    raise exception 'Missing transaction context exposed workers';
  end if;
  if imbhola.actor_for_identity('https://identity.example.test','employer')
       is distinct from '00000000-0000-4000-8000-000000000101'::uuid
    or imbhola.actor_for_identity('https://another.example.test','employer') is not null
    or imbhola.actor_for_identity('https://identity.example.test','revoked') is not null then
    raise exception 'Identity lookup is not scoped to active issuer/subject pairs';
  end if;
end;
$$;

select set_config('imbhola.actor_id','00000000-0000-4000-8000-000000000101',true);
select set_config('imbhola.company_id','00000000-0000-4000-8000-000000000001',true);

do $$
begin
  if (select array_agg(employee_number) from imbhola.employees) is distinct from array['A-001'] then
    raise exception 'Owner employee view crossed company boundary';
  end if;
  insert into imbhola.employees(company_id,employee_number)
    values('00000000-0000-4000-8000-000000000001','A-002');
  update imbhola.employees set job_title='Sample coordinator' where employee_number='A-002';
  if not found then raise exception 'In-scope employee update was blocked'; end if;
  begin
    insert into imbhola.employees(company_id,employee_number)
      values('00000000-0000-4000-8000-000000000002','B-002');
    raise exception 'Cross-company insert unexpectedly succeeded';
  exception when insufficient_privilege then null;
  end;
  begin
    execute 'select * from imbhola.evidence_files';
    raise exception 'Runtime role could read evidence before the scan workflow';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('imbhola.actor_id','00000000-0000-4000-8000-000000000102',true);
do $$
begin
  if (select count(*) from imbhola.employees) <> 2 then
    raise exception 'Active SDF appointment did not allow assigned company';
  end if;
  perform set_config('imbhola.company_id','00000000-0000-4000-8000-000000000002',true);
  if (select count(*) from imbhola.employees) <> 0 then
    raise exception 'Revoked SDF appointment retained company access';
  end if;
  perform set_config('imbhola.company_id','00000000-0000-4000-8000-000000000001',true);
  perform set_config('imbhola.actor_id','00000000-0000-4000-8000-000000000103',true);
  if (select count(*) from imbhola.companies) <> 0 then
    raise exception 'Expired membership retained company access';
  end if;
end;
$$;

rollback;
