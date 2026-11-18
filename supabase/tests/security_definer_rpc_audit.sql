-- IMBHOLA SECURITY DEFINER RPC audit (read-only).
-- Run on a staging Supabase database before pilot sign-off.
-- This checks structural controls only, NOT full authorization correctness.
WITH expected(name, needs_role) AS (
  VALUES
    ('accept_organization_invite', false),
    ('issue_organization_invite', true),
    ('request_reporting_cycle_changes', true),
    ('submit_reporting_cycle_for_review', true)
), actual AS (
 SELECT p.proname AS name, p.oid, p.prosecdef,
   p.proconfig,
   pg_get_functiondef(p.oid) AS definition
 FROM pg_proc p
 JOIN pg_namespace n ON n.oid=p.pronamespace
 WHERE n.nspname='public'
)
SELECT e.name,
       (a.oid IS NOT NULL) AS function_exists,
       coalesce(a.prosecdef,false) AS security_definer,
       coalesce(a.proconfig @> ARRAY['search_path=""']::text[],false) AS pinned_empty_search_path,
       CASE WHEN a.oid IS NULL THEN NULL ELSE NOT has_function_privilege('anon',a.oid,'EXECUTE') END AS anonymous_denied,
       CASE WHEN a.oid IS NULL THEN NULL ELSE has_function_privilege('authenticated',a.oid,'EXECUTE') END AS authenticated_allowed,
       coalesce(a.definition ILIKE '%auth.uid()%',false) AS identity_guard_present,
       CASE WHEN e.needs_role THEN coalesce(a.definition ILIKE '%private.has_org_role%',false)
            ELSE coalesce(a.definition ILIKE '%invitee_email is distinct from user_email%',false)
       END AS role_or_invitee_guard_present
FROM expected e
LEFT JOIN actual a ON a.name=e.name
ORDER BY e.name;
-- Manual negative tests still required: revoked/expired invite, wrong recipient,
-- unverified email, duplicate/replay, cross-tenant calls, role downgrade,
-- revoked membership, concurrent calls, and forged organization/cycle identifiers.
