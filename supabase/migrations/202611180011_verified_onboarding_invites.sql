-- M2 controlled onboarding; verified employer approval remains operator-only.
create table public.organization_applications(
 id uuid primary key default gen_random_uuid(),
 requester_id uuid not null references auth.users(id),
 legal_name text not null check(length(trim(legal_name)) between 2 and 250),
 registration_number text,
 contact_email text not null,
 status text not null default 'pending' check(status in ('pending','under_review','approved','rejected')),
 reviewed_by uuid references auth.users(id),
 review_note text,
 reviewed_at timestamptz,
 created_at timestamptz not null default now()
);
create index organization_applications_requester_idx on public.organization_applications(requester_id,created_at);
alter table public.organization_applications enable row level security;
create policy own_applications_read on public.organization_applications for select to authenticated
using(requester_id=(select auth.uid()));
create policy own_applications_insert on public.organization_applications for insert to authenticated
with check(status='pending' and requester_id=(select auth.uid()));
-- No user-level update/delete policies. Operator verification is a separate process.
create or replace function private.limit_organization_applications()
returns trigger language plpgsql security definer set search_path=''
as $$
begin
 if (select count(*) from public.organization_applications
      where requester_id=NEW.requester_id and created_at > now()-interval '30 days') >= 3 then
   raise exception 'Application frequency limit exceeded';
 end if;
 return NEW;
end;$$;
create trigger organization_application_limit before insert on public.organization_applications
for each row execute function private.limit_organization_applications();

create or replace function public.issue_organization_invite(
 p_org uuid,p_email text,p_role public.imbhola_member_role,p_token_hash text,p_expires_at timestamptz
)
returns uuid
language plpgsql security definer set search_path=''
as $$
declare new_id uuid;
begin
 if auth.uid() is null or not private.has_org_role(
   p_org,array['company_admin']::public.imbhola_member_role[]) then
   raise exception 'Not authorized';
 end if;
 if not exists(select 1 from public.organizations where id=p_org and verified_at is not null) then
   raise exception 'Organization must be verified';
 end if;
 if p_role in ('company_admin','signatory') then
   raise exception 'Privileged roles require separate approval';
 end if;
 if p_email is null or length(p_email)>254
    or p_email<>lower(trim(p_email))
    or p_email not like '%@%.%' then
   raise exception 'Invalid recipient email';
 end if;
 if p_token_hash !~ '^[0-9a-f]{64}$' then raise exception 'Invalid token hash'; end if;
 if p_expires_at<=now() or p_expires_at>now()+interval '7 days' then
   raise exception 'Invalid expiration';
 end if;
 if (select count(*) from public.organization_invitations
      where organization_id=p_org and invited_by=auth.uid()
      and created_at>now()-interval '24 hours')>=20 then
   raise exception 'Invitation limit reached';
 end if;
 insert into public.organization_invitations(
   organization_id,invitee_email,role,token_hash,invited_by,expires_at
 ) values(p_org,p_email,p_role,p_token_hash,auth.uid(),p_expires_at)
 returning id into new_id;
 return new_id;
end;$$;
revoke all on function public.issue_organization_invite(uuid,text,public.imbhola_member_role,text,timestamptz) from public;
grant execute on function public.issue_organization_invite(uuid,text,public.imbhola_member_role,text,timestamptz) to authenticated;

create or replace function public.accept_organization_invite(p_token_hash text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare
  invitation public.organization_invitations%rowtype;
  user_email text;
  verified timestamptz;
begin
 if auth.uid() is null or p_token_hash !~ '^[0-9a-f]{64}$' then
   raise exception 'Invitation unavailable';
 end if;
 select lower(trim(email)),email_confirmed_at into user_email,verified
 from auth.users where id=auth.uid();
 if verified is null then raise exception 'Verified email required'; end if;
 select * into invitation from public.organization_invitations
 where token_hash=p_token_hash and accepted_at is null
   and revoked_at is null and expires_at>now()
 for update;
 if not found or invitation.invitee_email is distinct from user_email then
   raise exception 'Invitation unavailable';
 end if;
 if not exists(select 1 from public.organizations
    where id=invitation.organization_id and verified_at is not null) then
    raise exception 'Organization unavailable';
 end if;
 insert into public.organization_memberships(organization_id,user_id,role,status,approved_at)
 values(invitation.organization_id,auth.uid(),invitation.role,'active',now())
 on conflict (organization_id,user_id,role) do update
 set status='active',approved_at=now(),updated_at=now();
 update public.organization_invitations set accepted_at=now() where id=invitation.id;
 return invitation.organization_id;
end;$$;
revoke all on function public.accept_organization_invite(text) from public;
grant execute on function public.accept_organization_invite(text) to authenticated;

create trigger memberships_audit after insert or update or delete on public.organization_memberships
for each row execute function private.audit_tenant_change();
create trigger invitations_audit after insert or update or delete on public.organization_invitations
for each row execute function private.audit_tenant_change();
