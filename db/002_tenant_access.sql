-- Apply after 001_foundation.sql as the migration owner, never as the app login.
begin;

create role imbhola_runtime nologin nosuperuser nocreatedb nocreaterole noinherit nobypassrls;
grant usage on schema imbhola to imbhola_runtime;

-- Link provider identities to internal actors through a trusted provisioning flow.
-- Identity is the verified issuer/subject pair. Email is not an identity key.
create table imbhola.user_identities (
  issuer text not null check (length(issuer) between 1 and 512),
  subject text not null check (length(subject) between 1 and 512),
  actor_id uuid not null,
  revoked_at timestamptz,
  primary key (issuer, subject)
);
alter table imbhola.user_identities enable row level security;
revoke all on imbhola.user_identities from public;

create function imbhola.actor_for_identity(provider_issuer text, provider_subject text)
returns uuid
language sql stable security definer
set search_path = pg_catalog, pg_temp
as $$
  select actor_id from imbhola.user_identities
  where issuer = provider_issuer and subject = provider_subject and revoked_at is null
$$;

-- Set both values transaction-locally after verifying the identity. The runtime
-- role and its database credentials are only for the trusted application server.
create function imbhola.has_company_role(requested_company uuid, allowed_roles text[])
returns boolean
language sql stable security definer
set search_path = pg_catalog, pg_temp
as $$
  select case when requested_company::text = current_setting('imbhola.company_id', true)
    then exists (
      select 1 from imbhola.memberships m
      where m.company_id = requested_company
        and m.user_id::text = current_setting('imbhola.actor_id', true)
        and m.role = any (allowed_roles)
        and m.starts_at <= statement_timestamp()
        and (m.expires_at is null or m.expires_at > statement_timestamp())
        and (m.role <> 'sdf' or exists (
          select 1 from imbhola.sdf_assignments a
          where a.company_id = m.company_id and a.user_id = m.user_id
            and a.starts_at <= statement_timestamp() and a.expires_at > statement_timestamp()
            and a.revoked_at is null
        ))
    ) else false end
$$;

revoke all on function imbhola.actor_for_identity(text,text) from public;
revoke all on function imbhola.has_company_role(uuid,text[]) from public;
grant execute on function imbhola.actor_for_identity(text,text) to imbhola_runtime;
grant execute on function imbhola.has_company_role(uuid,text[]) to imbhola_runtime;

grant select on imbhola.companies, imbhola.reporting_periods, imbhola.employees,
  imbhola.workforce_snapshots, imbhola.submission_versions to imbhola_runtime;
grant insert (company_id, employee_number, job_title, department, employment_status),
  update (employee_number, job_title, department, employment_status)
  on imbhola.employees to imbhola_runtime;

create policy company_read on imbhola.companies for select to imbhola_runtime
  using (imbhola.has_company_role(id,array['owner','hr','training','sdf','committee','signatory','finance']));

create policy reporting_period_read on imbhola.reporting_periods for select to imbhola_runtime
  using (imbhola.has_company_role(company_id,array['owner','hr','training','sdf','committee','signatory','finance']));

create policy employee_read on imbhola.employees for select to imbhola_runtime
  using (imbhola.has_company_role(company_id,array['owner','hr','training','sdf']));

create policy employee_insert on imbhola.employees for insert to imbhola_runtime
  with check (imbhola.has_company_role(company_id,array['owner','hr','sdf']));

create policy employee_update on imbhola.employees for update to imbhola_runtime
  using (imbhola.has_company_role(company_id,array['owner','hr','sdf']))
  with check (imbhola.has_company_role(company_id,array['owner','hr','sdf']));

create policy workforce_snapshot_read on imbhola.workforce_snapshots for select to imbhola_runtime
  using (imbhola.has_company_role(company_id,array['owner','hr','sdf','committee','signatory']));

create policy submission_read on imbhola.submission_versions for select to imbhola_runtime
  using (imbhola.has_company_role(company_id,array['owner','sdf','committee','signatory']));

commit;
