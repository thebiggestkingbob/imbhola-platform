-- Enforce privileged MFA at the database policy boundary.
-- A direct Supabase API call must not bypass the UI's MFA requirement.
create or replace function private.has_org_role(org_id uuid, allowed_roles public.imbhola_member_role[])
returns boolean
language sql stable security definer set search_path=''
as $$
 select exists(
  select 1 from public.organization_memberships m
  where m.organization_id=org_id
    and m.user_id=(select auth.uid())
    and m.status='active'
    and m.role=any(allowed_roles)
    and (
      m.role not in ('company_admin','executive','hr_admin','training_admin','sdf','signatory','auditor')
      or coalesce((select auth.jwt()->>'aal'),'')='aal2'
    )
 );
$$;
revoke all on function private.has_org_role(uuid,public.imbhola_member_role[]) from public;
grant execute on function private.has_org_role(uuid,public.imbhola_member_role[]) to authenticated;
