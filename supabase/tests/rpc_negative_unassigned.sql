-- IMBHOLA negative RPC authorization tests.
-- Staging-only test. Uses no real users and does not insert employee data.
-- All calls are inside a transaction and rolled back.
-- Run with an administrator connection on an isolated staging clone.
BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','99999999-9999-4999-8999-999999999999',true);
DO $$
DECLARE
  denied boolean;
  fake_org uuid := '88888888-8888-4888-8888-888888888888';
  fake_cycle uuid := '77777777-7777-4777-8777-777777777777';
BEGIN
  -- A signed-in identity with no organization membership must not issue invites.
  denied := false;
  BEGIN
    PERFORM public.issue_organization_invite(
      fake_org,'synthetic@invalid.example','sdf'::public.imbhola_member_role,
      repeat('a',64),now()+interval '1 day'
    );
  EXCEPTION WHEN OTHERS THEN
    denied := SQLSTATE = 'P0001' AND SQLERRM = 'Not authorized';
  END;
  IF NOT denied THEN RAISE EXCEPTION 'SECURITY FAIL: unassigned user could issue invite'; END IF;

  -- Review submission must fail before touching another organization's cycle.
  denied := false;
  BEGIN
    PERFORM public.submit_reporting_cycle_for_review(fake_org,fake_cycle);
  EXCEPTION WHEN OTHERS THEN
    denied := SQLSTATE = 'P0001' AND SQLERRM = 'Not authorized';
  END;
  IF NOT denied THEN RAISE EXCEPTION 'SECURITY FAIL: unassigned user could submit cycle'; END IF;

  denied := false;
  BEGIN
    PERFORM public.request_reporting_cycle_changes(fake_org,fake_cycle,'Synthetic review comment');
  EXCEPTION WHEN OTHERS THEN
    denied := SQLSTATE = 'P0001' AND SQLERRM = 'Not authorized';
  END;
  IF NOT denied THEN RAISE EXCEPTION 'SECURITY FAIL: unassigned user could request changes'; END IF;

  -- An unverified/unassigned synthetic identity cannot redeem an arbitrary token.
  denied := false;
  BEGIN
    PERFORM public.accept_organization_invite(repeat('b',64));
  EXCEPTION WHEN OTHERS THEN
    denied := SQLSTATE = 'P0001' AND SQLERRM IN ('Verified email required','Invitation unavailable');
  END;
  IF NOT denied THEN RAISE EXCEPTION 'SECURITY FAIL: synthetic identity could accept invite'; END IF;
END $$;
RESET ROLE;
ROLLBACK;
-- These are unassigned-user denial tests, NOT a full tenant-isolation certification.
-- Follow up on staging with two real synthetic Auth accounts and memberships.
