# IMBHOLA — Production acceptance gates (living checklist)

**Status:** Internal alpha; no production go-live authorization. The passing build pipeline only verifies compilation and selected smoke/unit tests.

## P0 — Mandatory before any employer data or public launch
- [ ] **Deployment ownership:** Vercel project ID, correct team, GitHub repository, preview URL and environment isolation verified with real API responses. Production branch and domain confirmed. Never infer success from a screenshot alone.
- [ ] **Identity:** real test users across operator, SDF, employer and employee roles; invite expiration/reuse, password recovery, MFA enrollment and enforcement, role revocation, disabled-account and negative-path tests.
- [ ] **Tenant isolation:** automated two-organization tests for all exposed REST/RPC/storage paths, not just positive reads. Audit all four SECURITY DEFINER invitation/review RPCs, including direct authenticated calls by unauthorized roles.
- [ ] **Data protection:** POPIA processing basis, privacy notice, retention schedule, breach handling, consent/authorization where appropriate, London-region cross-border transfer sign-off, access logs and data deletion workflows.
- [ ] **Employee import:** real dry-run mapping, validation, atomic commit/rollback, idempotent re-import and immutable workforce snapshots. No real records before security sign-off.
- [ ] **OFO:** official dated occupation reference, versioned matching, human-reviewed overrides, tests against realistic synthetic data.
- [ ] **Evidence:** private object storage, upload authorization, virus scanning, restricted signed downloads, retention/deletion, cross-tenant access denial.
- [ ] **WSP/ATR:** end-to-end cycle from workforce snapshot to draft, committee consultation, review, approval, immutable signed pack and audit trail.
- [ ] **Services SETA:** inspect original current-period XLSX and code sheet, verify headers/codes/formulas and official dates with SDF, implement adapter with synthetic round-trip fixtures. Official exports stay off until separately approved.
- [ ] **Operations:** encrypted backups, restore drill, alerting, rate limits, rollback procedure, incident response, dependency review and independent security test.
- [ ] **User acceptance:** at least one authorized pilot employer, documented scenarios, signed SDF/HR acceptance and regression tests on staging.

## P1 — Before commercial scaling
- [ ] Billing and payment reconciliation, invoices, cancellation and refund policies.
- [ ] Email notifications and deliverability, optional WhatsApp consent.
- [ ] Multi-SETA adapter strategy, full reporting variants and support runbooks.
- [ ] Accessibility and device/browser testing, performance budgets and load tests.
- [ ] Support desk, operator observability and customer onboarding materials.

## Release decision record
The owner, security reviewer, legal/privacy reviewer, SDF subject-matter reviewer and QA lead must each sign off their scope. A green CI check does **not** substitute for these approvals.

### Safe defaults
The automated `npm run check:release-safety` CI check asserts that regulated features remain hard-disabled in `src/lib/release-gates.ts`. It is a preventive check only; it is not proof of production security or compliance.

**Next technical sequence:** confirm Vercel staging project and preview URL; implement negative authorization tests against dedicated synthetic tenants; inspect official workbooks; build verified adapter; complete evidence storage and WSP/ATR signed review pack; perform full staging UAT.
