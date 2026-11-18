# 08 — Implementation queue after first Vercel preview

## M1: Public website and design signoff
Complete cohesive editorial layout, real navigation, mobile menu, substantive public pages and accessible keyboard operation. Keep placeholder service actions explicitly inactive. Never use invented pricing, testimonials or regulatory claims.

## M2: Identity and organization foundation
Choose verified database/identity provider (Supabase proposed but not yet connected). Define migrations, organization identity verification, invitations, multi-org membership, auth lifecycle, MFA, and RLS policies. Include anti-cross-tenant tests. No real company/employee uploads before legal and security review.

## M3: Scoped workspaces
Seven dashboards with actual role-based queries, task engine and audit history. Staff invitations and employee self-service are first-release requirements.

## M4: Workforce/training/evidence
Company profiles, versioned HR file imports, snapshots, OFO mapping, catalogue, training activities, attendance, evidence vault, review states.

## M5: Reports and approvals
WSP and ATR drafts, review/signoff/version lock, generic internal validation, official SETA adapter architecture. First SETA unknown; no official exports or eligibility calculations enabled.

## M6: Grants, ops and pilot
Distinguish estimate/applied/approved/paid/reconciled, audit and notifications, billing only after commercial approval, security/restore testing and monitored pilot.

## Do not mark as complete without tests
All features must have evidence of actual behavior, server authz, tenant isolation, error states and automated acceptance tests.
