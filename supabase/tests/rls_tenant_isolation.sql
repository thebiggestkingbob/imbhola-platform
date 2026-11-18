-- IMBHOLA RLS smoke test: Run only on an isolated empty test database.
-- Synthetic identities, organisations and records are rolled back.
BEGIN;
CREATE TEMP TABLE rls_assertions(label text, observed integer, expected integer);
GRANT SELECT, INSERT ON rls_assertions TO authenticated;
INSERT INTO auth.users(id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at)
VALUES
 ('15151515-1515-4515-8515-151515151515','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test-a@invalid.example','',now(),now(),now()),
 ('26262626-2626-4626-8626-262626262626','00000000-0000-0000-0000-000000000000','authenticated','authenticated','test-b@invalid.example','',now(),now(),now());
INSERT INTO public.organizations(id,legal_name,verified_at)
VALUES('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Synthetic A',now()),
      ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Synthetic B',now());
INSERT INTO public.organization_memberships(organization_id,user_id,role,status,approved_at)
VALUES('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','15151515-1515-4515-8515-151515151515','hr_admin','active',now());
INSERT INTO public.training_programs(organization_id,title,created_by)
VALUES('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Synthetic programme A','15151515-1515-4515-8515-151515151515'),
      ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','Synthetic programme B','26262626-2626-4626-8626-262626262626');
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','15151515-1515-4515-8515-151515151515',true);
INSERT INTO rls_assertions SELECT 'A org read',count(*),1 FROM public.organizations;
INSERT INTO rls_assertions SELECT 'A own programme',count(*),1 FROM public.training_programs WHERE title='Synthetic programme A';
INSERT INTO rls_assertions SELECT 'A cross-org programme',count(*),0 FROM public.training_programs WHERE title='Synthetic programme B';
SELECT set_config('request.jwt.claim.sub','26262626-2626-4626-8626-262626262626',true);
INSERT INTO rls_assertions SELECT 'Unassigned user orgs',count(*),0 FROM public.organizations;
INSERT INTO rls_assertions SELECT 'Unassigned user programmes',count(*),0 FROM public.training_programs;
RESET ROLE;
SELECT label, observed, expected, (observed=expected) AS pass FROM rls_assertions ORDER BY label;
ROLLBACK;
-- Never change the ROLLBACK into COMMIT. Add additional negative-write tests
-- before any production data pilot.
