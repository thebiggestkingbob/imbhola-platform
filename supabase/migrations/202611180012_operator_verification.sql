-- Harden application submission; approval must occur via service-role-only atomic RPC.
create or replace function private.validate_organization_application()
returns trigger language plpgsql security definer set search_path=''
as $$
declare verified_email text;
begin
 select lower(trim(email)) into verified_email
 from auth.users where id=auth.uid() and email_confirmed_at is not null;
 if verified_email is null or NEW.requester_id is distinct from auth.uid()
    or NEW.contact_email is distinct from verified_email then
   raise exception 'A verified requester email is required';
 end if;
 if NEW.status <> 'pending' or NEW.reviewed_at is not null
    or NEW.reviewed_by is not null then
   raise exception 'Applications must begin pending';
 end if;
 return NEW;
end;$$;
create trigger organization_application_identity before insert on public.organization_applications
for each row execute function private.validate_organization_application();

create or replace function public.approve_organization_application(
 p_application_id uuid,p_operator_id uuid,p_verification_reference text
)
returns uuid language plpgsql security definer set search_path=''
as $$
declare application public.organization_applications%rowtype;
declare new_org uuid;
begin
 if auth.role() is distinct from 'service_role' then raise exception 'Forbidden'; end if;
 if length(trim(coalesce(p_verification_reference,'')))<8 or length(p_verification_reference)>600 then
   raise exception 'Verification reference required';
 end if;
 if not exists(select 1 from auth.users where id=p_operator_id and email_confirmed_at is not null) then
   raise exception 'Valid operator identity required';
 end if;
 select * into application from public.organization_applications
 where id=p_application_id and status='pending' for update;
 if not found then raise exception 'Application is not pending'; end if;
 if not exists(select 1 from auth.users
     where id=application.requester_id and email_confirmed_at is not null
       and lower(trim(email))=application.contact_email) then
   raise exception 'Requester identity not verified';
 end if;
 insert into public.organizations(legal_name,verified_at)
 values(application.legal_name,now())
 returning id into new_org;
 insert into public.organization_memberships(organization_id,user_id,role,status,approved_at)
 values(new_org,application.requester_id,'company_admin','active',now());
 update public.organization_applications set status='approved',reviewed_by=p_operator_id,
   reviewed_at=now(),review_note=p_verification_reference where id=application.id;
 insert into public.audit_events(organization_id,actor_user_id,event_type,target_type,target_id,event_metadata)
 values(new_org,p_operator_id,'verified_organization_approved','organization',new_org,
   jsonb_build_object('application_id',application.id));
 return new_org;
end;$$;
revoke all on function public.approve_organization_application(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.approve_organization_application(uuid,uuid,text) to service_role;
