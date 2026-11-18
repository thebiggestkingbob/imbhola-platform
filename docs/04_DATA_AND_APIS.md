# 04 — Data and API architecture (implementation design)

## Proposed storage
PostgreSQL + migrations, managed identity with email verification/MFA, private encrypted object storage for evidence, async job queue for import/export and notification outbox.

## Core entities
User, Organization, Membership, RoleGrant, Invitation, OrganizationVerification, SDFAssignment, ReportingYear, WorkforceSnapshot, Employee, Learner, EmploymentHistory, OFOReferenceVersion, OFOMapping, TrainingProgram, TrainingEvent, Attendance, TrainingPlanLine, ATROutcome, EvidenceFile, EvidenceLink, ReviewFinding, Approval, SignedPack, AuditEvent, SDLRecord, GrantApplication, GrantOutcome, PaymentReconciliation, SETAAdapterVersion, ExportJob, Notification, SupportTicket.

## Invariants
All employer data contains organization ID; unique constraints and authorization must prevent cross-tenant access. Historical snapshots immutable; import is dry-run-first, idempotent and rollback-safe. Evidence uses private signed downloads, scan state and content hash. Report outputs include source snapshot, validation rule version and approval history.

## APIs (proposed; not yet built)
Authenticated /api/organizations, /memberships, /invitations, /workforce/imports, /employees, /ofo, /training, /evidence, /wsp, /atr, /review, /exports, /grants and /audit. Implement handlers only with server-side authorization, schema validation and rate limits. Do not expose fake success responses.

## Integration principles
Never store credentials in source. Prefer file-first HR import in initial release; direct payroll/HR connections require a separate approved discovery and privacy review.
