-- Supabase grants function EXECUTE to anon by default on creation.
-- Internal auth checks alone are insufficient: revoke anonymous execution explicitly.
revoke all on function public.accept_organization_invite(text) from anon,public;
revoke all on function public.issue_organization_invite(uuid,text,public.imbhola_member_role,text,timestamptz) from anon,public;
revoke all on function public.request_reporting_cycle_changes(uuid,uuid,text) from anon,public;
revoke all on function public.submit_reporting_cycle_for_review(uuid,uuid) from anon,public;

-- These four RPCs are intentionally executable by authenticated users; each
-- has identity, verified membership, role, MFA and transaction-specific checks.
grant execute on function public.accept_organization_invite(text) to authenticated;
grant execute on function public.issue_organization_invite(uuid,text,public.imbhola_member_role,text,timestamptz) to authenticated;
grant execute on function public.request_reporting_cycle_changes(uuid,uuid,text) to authenticated;
grant execute on function public.submit_reporting_cycle_for_review(uuid,uuid) to authenticated;
