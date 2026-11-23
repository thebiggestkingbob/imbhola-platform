# IMBHOLA

[MASTER_BRIEF.md](MASTER_BRIEF.md) defines the product scope. The public website is available for preview. The employer, SDF and operations workspaces run locally against SQLite with synthetic data.

## Start the local workspace

Use Node.js 24. From the repository root run:

```sh
npm ci
npm run seed:local
npm run dev:local
```

Open http://127.0.0.1:3000/login. The seed command prints the temporary password for the synthetic `@imbhola.test` accounts. Running the seed again rotates their shared temporary password and ends existing sessions. Local records persist in the ignored `.imbhola-local/` directory.

Use `owner@imbhola.test` for the Atlas workspace, `sdf@imbhola.test` for appointed clients, and `ops@imbhola.test` for tenant and commercial operations. The separate `committee@imbhola.test` and `signatory@imbhola.test` accounts can review and sign Atlas reports. Beacon is a separate test company. Activate a subscription or managed contract from operations before adding Beacon or newly onboarded company records.

Run `npm run dev` instead of `npm run dev:local` to exercise the public-only mode.

## Walk through a reporting cycle

Run `npm run seed:local -- --walkthrough` to add Cedar Workshop with a populated workforce, OFO mapping, skills gap, WSP, ATR, payroll, consultation and a frozen sample report awaiting review. The sample uses the current year. Running the command again preserves work already recorded for Cedar.

1. Sign in as `committee@imbhola.test`, open Cedar Workshop and choose **Reporting and approvals**. Open **Read frozen report** before approving version 1.
2. Sign in as `signatory@imbhola.test` to sign that approved version. Open the same report to read it, download the internal Excel workbook or save an internal PDF via the browser's print dialog.
3. Sign in as `sdf@imbhola.test` to see Cedar on the client list. Open **External receipts and grants** to test recording a synthetic receipt and later outcome.

The printable report is an internal synthetic report. It uses the exact saved version and shows its review history and SHA-256 digest.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

## Release boundaries

Local authentication and database actions run in local development or in the isolated review process. The production website exposes public information. Hosted contact collection still needs approved privacy ownership, retention and lead handling. The review vault accepts synthetic PDF, PNG, JPEG and UTF-8 text attachments up to 2 MB. It checks basic file signatures and confirms the stored digest when downloading. Malware scanning is required before accepting real evidence. Production identity and MFA, database row-level security, scanned storage, commercial payment integrations and pilot acceptance remain separate release gates.

The internal report uses synthetic rules with an explicit year: ATR for that calendar year and WSP for the following year. Its JSON snapshots and frozen Excel workbooks support workflow testing. Administration can record the published source URL, revision and checksum for each reporting year without enabling official exports. Services SETA Excel/PDF outputs require independently verified templates, rules, OFO sources and reconciliation. External portal submission remains an authorised person's responsibility.

## Private interactive review

The isolated review process uses the same SQLite workflows and synthetic fixtures. Its HTTPS entry gate and sample-account sessions both require the review passcode. Use an isolated runtime with a private persistent disk or a named sandbox snapshot, and restrict access to testers. The standard Vercel build continues to serve public information only.

Set `IMBHOLA_REVIEW=1`, `IMBHOLA_REVIEW_HOST` to the isolated HTTPS hostname, and `IMBHOLA_REVIEW_PASSWORD` to a random URL-safe string of at least 24 characters. Supply the passcode through the runtime configuration. Run `npm ci`, `npm run seed:local -- --walkthrough`, `npm run build` and `node scripts/review-server.mjs` in that isolated runtime. The test accounts use the same passcode. Review storage is for synthetic records.

The draft branch can also expose `/private-review` on its Vercel preview. Set the sensitive `IMBHOLA_PREVIEW_REVIEW_PASSWORD` for that preview branch to the isolated review passcode. The launcher checks the passcode before resuming the named `imbhola-private-review` sandbox, and uses project OIDC to start its web process when needed. Review data lives in the sandbox SQLite database and is carried forward by its filesystem snapshots. Keep the snapshot retention aligned with the testing window. This route is disabled outside the draft branch's Vercel preview.

## PostgreSQL production foundation

The PostgreSQL migrations in `db/001_foundation.sql` and `db/002_tenant_access.sql` are intended for a fresh staging database and must run under a migration owner. The runtime role can access a company only within a transaction configured with the actor ID and selected company ID. Resolve the actor from a verified identity-provider issuer and subject. Use transaction-local settings when pooling connections. The application login must hold only the limited runtime role privileges, and no database credentials should be available to clients.

These migrations implement the tenant access foundation. Live identity provisioning, the PostgreSQL workspace adapter, evidence scanning, commercial integrations and approval of official outputs are still required before using production records.

The production workforce API at `/api/workspaces/{companyId}/workforce` is disabled unless the production-only settings in `.env.example` are configured. It verifies the identity provider's issuer, audience, signature, expiry and MFA claim, then uses a TLS database connection and the limited runtime role from `002_tenant_access.sql`. A database operator must link the verified issuer and subject to an internal actor. This endpoint reads the workforce for a selected company. The test workspaces continue to use synthetic SQLite records.

To use Descope, set `IMBHOLA_IDENTITY_MODE=descope` and configure the project's `NEXT_PUBLIC_DESCOPE_PROJECT_ID`. Run a sign-in flow that requires MFA. The backend validates the session for that specific project and checks signed MFA claims. Provision the corresponding internal actor using the issuer key `descope:<project-id>` and the verified Descope user ID as subject.

## Private PostgreSQL pilot slice

The draft branch includes a separate pilot entry point at `/pilot`. It uses a Descope flow with a second verification step, lists companies assigned to the signed-in account, and reads and updates workforce rows in PostgreSQL. Workforce changes automatically add database audit events. The existing synthetic review continues to run on SQLite.

Use an isolated staging database and Descope project. Apply migrations 001 through 003 as the database owner, configure a separate login that can assume `imbhola_runtime`, and provision invited identities by verified provider subject. Configure only the branch-specific preview values in `.env.example`. The pilot route stays closed without all of those values, and it is unavailable in production. The pilot slice is ready for provider-level acceptance once those services are configured.

## Redesign review

The redesign starts from commit `887fdfe` on the existing implementation PR. `MASTER_BRIEF.md` and the current route and role checks define the review scope. The preview branch is `feature/imbhola-redesign` and uses its own isolated sample database.

| Review area | Routes and actions |
| --- | --- |
| Public site | Homepage, platform, solutions, services, reporting process, resources, pricing, company information, readiness, terms, privacy and accessibility |
| Access and onboarding | Workspace access, private review, sign-in, role selection, registration, demo and contact forms |
| Employer and SDF | Dashboards, company and team setup, employee imports and filters, OFO, skills gaps, training, payroll, consultation, evidence and filing receipts |
| Reporting | Year and status filters, draft checks, version history, review, sign-off, frozen JSON and Excel, and PDF printing |
| Administration | Account verification, appointments, billing, enquiries, support and reporting sources |

Use the private review passcode and choose a sample role. Sign out to switch roles. Cedar Workshop has a sample version ready for the committee; Atlas Workshop is useful for adding and importing records. Review data is stored in SQLite and is separate from the original implementation preview. The gated live pilot still requires its existing PostgreSQL and identity configuration.
