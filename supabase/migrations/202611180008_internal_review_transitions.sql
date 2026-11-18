-- IMBHOLA internal review workflow (not legal sign-off).
-- Privileged RPCs are tenant-checked and audited. No approval, lock or official export here.
create or replace function public.submit_reporting_cycle_for_review(p_org uuid,p_cycle uuid)
returns boolean
language plpgsql security definer set search_path=''
as $$
begin
 if auth.uid() is null or not private.has_org_role(
   p_org,array['company_admin','hr_admin','sdf']::public.imbhola_member_role[]) then
   raise exception 'Not authorized';
 end if;
 update public.reporting_cycles
 set status='in_review'
 where organization_id=p_org and id=p_cycle and status='draft';
 return found;
end;$$;

create or replace function public.request_reporting_cycle_changes(
 p_org uuid,p_cycle uuid,p_comment text
)
returns boolean
language plpgsql security definer set search_path=''
as $$
begin
 if auth.uid() is null or not private.has_org_role(
   p_org,array['company_admin','committee_member','signatory']::public.imbhola_member_role[]) then
   raise exception 'Not authorized';
 end if;
 if length(trim(coalesce(p_comment,''))) < 5 or length(p_comment)>2000 then
   raise exception 'A review explanation (5 to 2000 characters) is required';
 end if;
 update public.reporting_cycles
 set status='draft'
 where organization_id=p_org and id=p_cycle and status='in_review';
 if not found then return false; end if;
 insert into public.review_decisions(
  organization_id,cycle_id,decision,reviewer_id,comment
 ) values(p_org,p_cycle,'requested_changes',auth.uid(),p_comment);
 return true;
end;$$;
revoke all on function public.submit_reporting_cycle_for_review(uuid,uuid) from public;
revoke all on function public.request_reporting_cycle_changes(uuid,uuid,text) from public;
grant execute on function public.submit_reporting_cycle_for_review(uuid,uuid) to authenticated;
grant execute on function public.request_reporting_cycle_changes(uuid,uuid,text) to authenticated;
create trigger review_decisions_audit after insert or update or delete on public.review_decisions
for each row execute function private.audit_tenant_change();
