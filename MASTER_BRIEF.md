# IMBHOLA — CANONICAL PLATFORM BRIEF

This is the single product direction for the existing repository. Earlier V2/V3.x documents are historical source material, not competing projects.

## Original mission
Turn Imbhola's skills development reporting practice into a complete, plain-language, secure multi-company platform. Employers and appointed SDFs should manage workforce data, skills gaps, OFO mappings, training plans, actual training, evidence, consultation, approvals, verified SETA exports, external submission receipts and grant outcomes in one place. Imbhola must also operate paid subscriptions and separately contracted managed reporting services. Never guarantee grant or tax outcomes.

## Locked decisions
- First adapter: **Services SETA** (official current-year templates and rules must be independently verified).
- Commercial model: **hybrid SaaS + optional managed SDF/reporting services**.
- Release order: **public website first, secure controlled pilot second, general availability after acceptance**.
- One repository: `thebiggestkingbob/imbhola-platform`. Preserve draft PR #6 and main.
- Plain-language, mobile-friendly design; Editorial Enterprise direction.

## End-to-end working journey
1. Discover platform and enquire through a lawful consented lead form.
2. Register, verify identity, create employer, invite roles and appoint SDF with expiring authority.
3. Capture company SDL/SETA profile, payroll/levy records and subsidiary relationships.
4. Import workforce with preview, validation, duplicates, error report and audited commit.
5. Map roles to a versioned OFO catalogue, record justified overrides.
6. Identify skills gaps and build budgeted forward-looking WSP plans.
7. Record actual training for ATR, attendance, providers, outcomes, costs and pivotal qualifications.
8. Securely collect certificates, attendance and payment evidence in a private audit-ready vault.
9. Reconcile and validate against approved reporting-year rules, separating warnings and blockers.
10. Consult committee, approve and sign immutable versioned submissions.
11. Generate and independently verify Services SETA-format Excel and PDF outputs.
12. Have an authorised person submit externally; record portal receipt, corrections, decisions and grants.
13. Analyse results and repeat next reporting cycle.

## Workspaces
Public marketing/lead capture; employer (HR, training, finance, management, committee, signatory); appointed SDF multi-client console; Imbhola operations (tenants, consultants, rules, contracts, subscriptions, support and billing); later employee/provider self-service.

## Core safety and data requirements
Company-scoped records and row-level database security; real authentication/MFA and server-side authorisation; least-privilege access; private malware-scanned evidence; immutable signed snapshots; append-only audit history; versioned regulatory source provenance; POPIA privacy and retention review. No employee personal data in public demos, no unverified automatic SETA submission, no grant guarantees.

## Definition of finished
An authorised employer and SDF can complete this journey with real persistent data, verified Services SETA output, tracked external submission, working commercial entitlements, passing tenant/security/workflow tests and pilot sign-off. Prototype pages, draft SQL and a successful build do not count as complete.

## Current status
Vercel serves the public website. The employer, SDF and Imbhola operations workspaces run on SQLite with synthetic accounts and records, both locally and in the isolated private review. The draft Vercel preview hosts the recurring review entry point. Its workspace resumes from a saved snapshot, with 30-day retention for the last snapshot. Local workflows include company onboarding, workforce imports, OFO mapping, WSP/ATR preparation, text evidence, committee review, sign-off, filing status and commercial records. The Cedar Workshop walkthrough exercises the same local reporting workflow using sample data.

The platform remains in development. The pilot requires production authentication and MFA, database row-level security, malware-scanned evidence, live lead ownership and privacy procedures, payments, and independent verification of Services SETA templates, reporting rules and catalogue sources. Official exports remain disabled. Pilot employers and acceptance are still required.

## Delivery rules
One master brief, one backlog, one repository, tested vertical slices. Use PR previews and keep production unchanged until release gates pass. The local unified source package contains this broader consolidated specification and a build-status tracker.
