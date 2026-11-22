# IMBHOLA V3.3 — Implementation handoff

## Approved product direction
- First compliance adapter: **Services SETA**.
- Commercial model: **hybrid** (self-service SaaS + separately contracted managed reporting services).
- Release order: **public website first**, secure reporting pilot second.
- Preserve Direction 04 — Editorial Enterprise; final design tokens require approval.

## Delivery boundaries
R0 public website: home, employers, SDFs, services, how-it-works, contact, privacy and terms. Enquiry forms require real storage/notification configuration and privacy review before activation.

R1 secure employer and SDF application: verified authentication and MFA, company memberships, appointment expiry, row-level security, workforce import with preview/commit, OFO mapping, immutable snapshots, WSP/ATR records, evidence vault, validation, consultation/sign-off, versioned exports and externally recorded submissions.

R2 hybrid managed services: subscriptions, contracts, consultant assignments, service orders, support SLAs, invoices, operational queues.

R3 later: employee/provider portals, more SETAs, payroll APIs and advanced analytics.

## Security and release blockers
1. Current workspace prototype routes must not be treated as secure. Protect server-side, not only via UI.
2. Never use production employee records or personal documents in public repo, previews or synthetic demos.
3. Obtain official Services SETA templates, current-year rules and approved examples before claiming compliant export.
4. Maintain company-scoped database policies, append-only audit history and versioned reporting snapshots.
5. No automatic SETA portal filing or grant guarantees without independently verified support.
6. Configure separate dev/staging/production projects, backups, secret management and access tests.

## Acceptance gates
- Public website compiles and passes accessibility and responsive checks.
- Authenticated endpoints reject cross-tenant access; expired SDF assignments revoke access.
- Import is previewable, idempotent and reversible before snapshot freeze.
- Approved reporting snapshots remain immutable.
- Official Services SETA export matches source template sheet-by-sheet and passes read-back validation.
- External submission is only marked submitted after human-provided reference/evidence.
- Customer contracts, POPIA processing inventory, information-officer procedures and support runbooks are approved.

## Remaining dependencies
P0: official Services SETA templates/rules; 3–5 pilot employers; lawful sample data; legal/privacy ownership; responsible product/compliance signatories.
P1: commercial prices, architecture/hosting, design tokens, billing provider, service SLAs, operational staffing.

## Source-package note
A V3.3 Next.js starter ZIP was prepared separately in the conversation. Integrate it through code review rather than overwriting existing repository files. The ZIP is not evidence of a successful build or deployment.

## Preview foundation

Public routes use the existing Next.js layout in `src/app`. The middleware redirects
private workspace, dashboard, SDF and admin paths to `/access`. No reporting API,
identity provider, intake form or database connection is active.

The reviewed source schema is in `db/001_foundation.sql`. Apply it as a migration to
an isolated pilot database only. The private `imbhola` schema enables row-level
security on all tables and grants no client access. Tenant-matched constraints
protect references to reporting periods. Database triggers preserve frozen
workforce snapshots, approved submissions and append-only audit events.

Before pilot access, add verified identity mapping and MFA, explicit permissions
for each role, and tests for cross-company access and SDF appointment expiry.
