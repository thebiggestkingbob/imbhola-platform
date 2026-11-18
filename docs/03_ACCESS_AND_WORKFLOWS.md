# 03 — Identity, access and workflows

## Identity
Single verified identity, zero or more organization memberships and potentially multiple scoped roles. Required roles: Imbhola admin; SDF/consultant; company admin/executive; HR/training admin; line manager; committee member; authorized signatory; employee/learner; auditor.

## Company verification
Unverified self-signup never grants access to an existing employer by entering a company name, SDL number or email domain. Explicit verified ownership and approved SDF appointment are required. Invitations expire, can be revoked and are matched to authenticated invitee identity.

## Authorisation
Tenant isolation must be enforced on server endpoints, queries, storage, audit streams, background jobs and generated downloads. Do not rely on client-side role-based display. Test cross-tenant denial, revoked membership and session expiry.

## Accountability
Every assigned task has an actor, organization, action, deadline only when verified, status, evidence links, event timestamps, decisions and escalation. Employee self-service in first release includes training acknowledgements, personal achievements, certificates and correction requests; never company-wide payroll or private peer records.

## Approvals
Draft → in review → changes requested → approved/signed → locked → externally submitted (manual confirmation) → accepted/rejected (evidence-backed). Signed versions remain immutable; corrections create new versions.
