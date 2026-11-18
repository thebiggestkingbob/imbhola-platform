# M3 — Workforce import and snapshot implementation status

## Implemented on development branch
- Dedicated workforce-import route in the authenticated organisation workspace.
- Controlled server-side CSV validation with an explicit opt-in environment gate.
- Header/required column checks, row limits, duplicate employee code checks, OFO-format checks, quoted CSV handling, spreadsheet formula heuristics.
- Fictional sample template at `/templates/workforce-import-template.csv`.
- Audit/history database schema: `workforce_import_batches`, `workforce_snapshot_lines`. Both use RLS with approved-role reads and no client insert/update/delete policies.
- Unit tests run in CI, followed by typecheck, lint, Next.js build and smoke.
- No live employee imports or snapshots committed.

## Required before activation
1. Confirm a lawful purpose, operator agreement, access/retention rules and London-region cross-border transfer requirements under POPIA.
2. Test real CSV/XLSX field mapping against non-sensitive synthetic datasets and payroll exports supplied with explicit permission.
3. Provide virus scan, upload controls, secure evidence handling and retention/data deletion paths.
4. Build an audited, atomic *server-side* snapshot commit with SHA-256 idempotency, duplicate handling and rollback semantics.
5. Introduce verified occupational reference data and reviewer approvals; six-digit formatting alone does not validate an OFO code.
6. Test column mapping, 0-byte input, malformed quoting, encodings, formula injection, over-limit files and two-company isolation.
7. Establish secure staging accounts and full browser user-journey tests.
8. Current project remains production-inactive for personal information; `IMBHOLA_WORKFORCE_PREVIEW_ENABLED` stays **false**.

## Database security advisories
- `organization_invitations` has no public client policy deliberately. See <https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy>.
- `public.accept_organization_invite`, `issue_organization_invite`, `submit_reporting_cycle_for_review`, and `request_reporting_cycle_changes` are callable SECURITY DEFINER functions. Role verification is implemented inside each, but a dedicated privileged-RPC security review, negative invocation test suite and least-privilege assessment remain mandatory before rollout: <https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable>.

## Platform-wide gate
The first SETA is unknown. Official SETA exports remain disabled. Vercel production remains unverified, so no platform launch claim is warranted.
