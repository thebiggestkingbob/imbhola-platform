# IMBHOLA V3 — Evidence Vault and Production Readiness Audit
Date: 18 November 2026
Environment: dedicated THE BIGGEST HQ Supabase `ilgwzqjcydhdxdgjjfwr`; development branch `feature/milestone-1-foundation`.

## What was built in this milestone
- Evidence metadata extended with category, review status, reviewer, retention-until and file size.
- Read-only Evidence Vault screen lists approved evidence categories and accepted, scan-clean record metadata.
- Evidence category and readiness tests added to GitHub CI.
- RLS now requires an active authorised organisation role and accepted, malware-cleared evidence metadata.
- No public Storage bucket, upload endpoint, document download, signing or review mutation enabled.

## Readiness assessment (engineering judgment, NOT measured acceptance)
Engineering implementation is meaningful, but the platform is closer to **internal alpha** than a production release. An approximate **25–35% production-readiness estimate** captures the missing verified user journeys and deployment, rather than the count of screens or tables. Do not publish this as a product SLA or audited project metric.

| Launch gate | Current evidence | Decision |
|---|---|---|
| Public design and Next.js foundation | Responsive site and CI builds | Mostly implemented; browser QA pending |
| Database tenancy | Dedicated project, RLS and synthetic isolation checks | Foundation implemented, privileged RPC audit pending |
| Auth + verified onboarding | Flagged-off account/application/approval/invitation components | Not pilot-verified |
| Workforce intake | Dry-run CSV and immutable snapshot schema | Cannot commit employee data |
| OFO mapping | Candidate ranking using verified catalogue, no official data loaded | Not usable for official reporting |
| Training, WSP, ATR | Tables and some draft workflows; review transitions | Partial, lacks complete validation and version lock |
| Evidence Vault | Read-only review metadata, no Storage or malware scanning | Not operational for files |
| Signatures and approved submission packs | No complete controlled sign-off / immutable signed PDF | Missing |
| SETA-specific exports | No approved authentic SETA templates or rules | Explicitly disabled |
| Grants/finance | Manual SDL records and grants status models | No verified eligibility or reconciliation |
| Privacy/compliance | RLS guards, audit and safety flags; external data review pending | Not approved for real employee records |
| Reliability/deployment | GitHub CI green on validated commits; intended Vercel project inaccessible | No verified production release |

## Non-negotiable launch blockers
1. Resolve Vercel team/project access, provision correct preview environment, pass real browser end-to-end workflows and verify READY public URL.
2. Sign off POPIA lawful basis, UK cross-border processing, data retention/deletion, DPA and staff roles.
3. Configure and test verified SMTP, authentication, MFA, onboarding, recovery, invitations, brute-force protections and negative role checks.
4. Build atomic, auditable CSV/XLSX importer with deduplication, field mapping and immutable snapshots; test on synthetic data.
5. Supply and verify source OFO occupation catalogue and the first selected SETA's actual 2027 template, rules and example data.
6. Establish **private** evidence Storage, object authorization, malware scanning, rejection/quarantine, signed reads, record linking and retention.
7. Implement per-SETA WSP/ATR validation, approvals, signed immutable versioning, reviewed exports and reconciliation.
8. Perform tenant isolation, privileged RPC negative tests, backup/restore, app security, accessibility and pilot employer acceptance tests.

## Recommended delivery path
- **Gate A / secure staging:** unblock Vercel and environment separation; auth plus operator acceptance, seeded synthetic users, role audits.
- **Gate B / complete report draft:** approved employee importer and OFO source; private evidence flow; end-to-end WSP/ATR training lifecycle.
- **Gate C / verified reporting:** first-seta configuration, validation, dual sign-off, immutable PDF and authentic Excel adapter, grant tracking.
- **Gate D / pilot:** 3–5 approved employers with documented acceptance, privacy, incident/backup and operational support.
- **Gate E / production:** complete release checklist, audit high-risk paths, connect domain, final data migration, monitor rollout.

## Timing guidance, not a commitment
With dedicated engineering, QA and a security/compliance reviewer, and with authentic SETA templates and pilot employers available promptly, a **rough 8–16+ week path** to a limited production pilot is plausible. A solo or intermittently staffed project, slow template sourcing, or regulatory/partner review can make it substantially longer. A broader multi-SETA production SaaS is a later milestone. Refine after counting outstanding backlog tickets and completing pilot discovery.

## Immediately required stakeholder inputs
- First pilot SETA and its officially published, current-period WSP/ATR Excel upload workbook.
- Anonymised/synthetic HR payroll import example and data dictionary.
- App domain and access to the correct Vercel team project.
- POPIA/data controller sign-off for UK-region hosting and intended storage.
- SMTP/mail provider and operator identity/MFA approval.

No real employee data imported; no SETA exports claimed or enabled; no release to `main` or production verified.
