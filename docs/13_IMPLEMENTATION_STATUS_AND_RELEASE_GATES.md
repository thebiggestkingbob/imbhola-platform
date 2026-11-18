# IMBHOLA V3 — implementation state and verification gates

This status is intentionally conservative: **working application foundation, not an end-to-end production release**.

## Verified
- Supabase dedicated project `ilgwzqjcydhdxdgjjfwr` (THE BIGGEST HQ, London) is ACTIVE_HEALTHY.
- Migrations identity_tenants, tenant_policy_indexes, reporting_domains, workflow_writes_audit, event_completion, employee_self_service, self_service_security, internal_review_transitions, employer_compliance, audit_pk_compat, verified_onboarding_invites, operator_verification applied.
- Tenant isolation test (synthetic transactional data) confirms verified member sees own org/programmes, unassigned account sees none, cross-org read denied. Test script `supabase/tests/rls_tenant_isolation.sql`.
- Build CI run #80: install/typecheck/lint/build PASS on its commit.
- Build CI run #84: install/typecheck/lint/build/smoke PASS on its commit.
- Public site: Direction 04 refinements, 14-route smoke checks including disabled account gating.
- Backoffice: gated company applications, operator approval, hashed invitations, password auth and recovery scaffolding, MFA page.
- Core workspace: company, levy, workforce, training, events, WSP, ATR, tasks, evidence metadata, grants, review decisions, internal CSV working drafts, reporting readiness, personal learning.

## Important not-yet-complete modules
1. Full verified onboarding pilot with real Supabase Auth/SMTP, MFA and invitation acceptance tests; operator ownership/evidence review.
2. Employee CSV/XLSX import: dry-run, field mapping, duplicate handling, immutable workforce snapshots, privacy controls.
3. Versioned occupational references, reviewable OFO suggestions with override reasons and sources.
4. Private evidence storage, malware scan, signed download permission tests, explicit retention.
5. Full WSP/ATR validation rules, consultation/approval, immutable signed packs, PDF records.
6. Official SETA adapters/export rules: first SETA unknown, **disabled**.
7. Grants eligibility checks and real payment reconciliations: **not enabled**.
8. Billing/payment, email notifications, optional WhatsApp.
9. Comprehensive role-specific workspaces, HR/manager/committee functionality, tests of revoked memberships and elevated MFA.
10. Security: CSRF/session management review, API rate limits, audit tamper strategy, access expiration, backup/restore, POPIA cross-border assessment.
11. Deployment: Vercel named project inaccessible to connector, no READY production URL, no production route verification.
12. CI: passing smoke test does not replace end-to-end browser testing with real identities or security penetration tests.

## Release rules
- Keep `IMBHOLA_AUTH_SIGNIN_ENABLED=false`, `IMBHOLA_AUTH_SIGNUP_ENABLED=false`, `IMBHOLA_COMPANY_APPLICATIONS_ENABLED=false`, `IMBHOLA_INVITATIONS_ENABLED=false`, `IMBHOLA_OPERATOR_APPROVALS_ENABLED=false` in production until the relevant tests pass.
- No real employee/personal records in current project until data transfer/processing review.
- Do not merge the feature branch to `main` without reviewed CI/QA and permissions.
- Do not claim Vercel production READY from GitHub build results.
- Keep regulatory/tax assumptions as unverified placeholders pending official SETA templates.
