# IMBHOLA V3.0 — Master instruction for Codex

You are implementing Imbhola, a South African skills-development and reporting platform. This document is the execution guide, not permission to invent regulatory requirements or to claim features are implemented.

## Non-negotiables
1. Follow the user’s Looply social-platform reference. It supersedes Editorial Enterprise: cool grey backgrounds, white feed cards, pink accents, circular profiles, compact typography and app-like navigation. See docs/02_EXPERIENCE_AND_DESIGN.md.
2. Deliver the full public site, authenticated company onboarding and role-specific workspaces. Use secure, invitation-based memberships and explicit tenant boundaries.
3. First supported SETA is **unknown**. Keep official SETA rules, template mappings, production exports, calculations implying eligibility, and portal submission **disabled** until verified signed-off rules/templates have been supplied and tested. No fabricated regulatory claims.
4. Use no real employee or client data in development. Never commit secrets. Apply POPIA-aligned data minimization, authorization, audit logging, secure evidence handling, and MFA for privileged roles.
5. One user may belong to multiple organisations with different roles. Server authorization is mandatory on every request and database row.
6. Do not represent placeholders as functional signup, login, payments, or reporting features.
7. No production deployment without approval, review, CI success, and security verification.

## Stack
Next.js App Router, React, TypeScript; PostgreSQL (tenant-aware schema), an identity provider with verified email/MFA, private object storage for evidence, and background jobs for imports and exports. Choose implementations after checking deployment availability, SA residency and cost.

## Required user roles
Imbhola admin; external SDF with multi-company membership; company admin/executive; HR/training administrator; line manager; committee member; signatory; employee/learner; auditor. Define an explicit permissions matrix; employees only see their own authorized records. Never let self-signup grant access to an existing organisation.

## Original PRD domains
Company & SDL profile; HR imports/snapshots/validation; employee and learner register; OFO mapping; training catalogue and PIVOTAL classification; WSP; ATR; evidence vault; reviews/signatures and SETA-specific preflight checks; reporting packs/dashboards/grant outcomes. Track each requirement ID from the source PRD and note gaps needing original documents.

## Build in reviewed milestones
M0: Repository structure, tooling, CI, design system, accessible navigation and responsive layout. Ensure `npm run build`, typecheck and lint succeed.
M1: Full public marketing site pages with real usable navigation, clear messaging, contact handling implemented only after spam/privacy design, plus signup/login screens accurately marked as inactive until auth is built. Capture screenshot reviews on desktop and mobile.
M2: Authentication, verified company creation, invites, password recovery, multi-org membership, MFA, roles, tenant isolation, audit.
M3: Role dashboards with real query-backed states, tasks, approvals and activity history.
M4: Workforce, OFO, training, evidence, HR imports, reconciliation and error recovery.
M5: Configurable and versioned WSP/ATR rules, validation and approvals; no official export without verified external SETA fixtures; grants distinguish estimates, applications, approvals, receipts and reconciliations.
M6: Billing decisions, managed SDF service, QA, security, backups, staging and pilot handoff.

## Acceptance gates
No dead links/buttons; keyboard and mobile accessibility; smoke tests for all public routes; role-specific authorization tests including cross-tenant access denial; reproducible migrations and seed with synthetic records; import rollback/idempotency; evidence virus scanning, expiring links and audit; report versioning and signoff; honest feature-flag behavior.

## Current state
This repository initially contains a **public web starter**, not an implemented database, reporting engine, login system or secure company dashboard. Start by verifying the project builds and iterating Milestone 0–1. Do not silently mark later milestones complete.

## Developer report at every milestone
Summarize code changed, test/build results, URLs/screenshots, open risks, next work and decisions requiring explicit approval.