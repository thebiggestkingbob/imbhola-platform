-- Applied to dedicated THE BIGGEST HQ Imbhola Supabase project (eu-west-2).
-- Add indexes for foreign keys and collapse multiple permissive membership SELECT policies.
create index if not exists audit_events_actor_user_idx on public.audit_events (actor_user_id);
create index if not exists organization_invitations_invited_by_idx on public.organization_invitations (invited_by);
drop policy if exists "Members may see their own memberships" on public.organization_memberships;
drop policy if exists "Authorized organization administrators may read memberships" on public.organization_memberships;
create policy "Members see their own and authorized organization memberships"
on public.organization_memberships for select to authenticated
using (
  user_id = (select auth.uid()) or
  private.has_org_role(
    organization_id,
    array['company_admin','hr_admin']::public.imbhola_member_role[]
  )
);
