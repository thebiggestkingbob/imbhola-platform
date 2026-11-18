# IMBHOLA — Dedicated Supabase integration plan

**Current status:** No dedicated Imbhola Supabase project exists in either linked account. This repository adds a *review-only* migration; it has not been deployed.

## Account selection and approval
Two connected Supabase accounts are visible (Primary and THE BIGGEST HQ). The actual Imbhola project owner, budget, approved hosting region and retention/legal requirements must be decided before creating a project. Never connect IMBHOLA to an existing website or TAPPED IN database.

## Implementation sequence
1. Approve the new dedicated project (including any monthly cost and hosting region).
2. Set up distinct staging and production environments with separate credentials.
3. Review and test the migration in a **new empty staging project** first.
4. Configure managed Supabase Auth with verified email, protected redirects, MFA for privileged roles and password recovery.
5. Create a server-only organisation verification/onboarding workflow. Self-registration must never automatically grant access to an existing company based on a name, SDL number or email domain.
6. Provide server-only invite issuance using a cryptographically random token and stored hash, bounded expiry, single-use acceptance and email/identity matching.
7. Implement positive/negative RLS tests with two simulated organisations, including revoked/suspended roles.
8. Configure encrypted private evidence buckets and authorized downloads only after identity security tests pass.
9. Wire application routes and actual user-specific dashboards only after the backend is verified.

## Environment variable contract
- `NEXT_PUBLIC_SUPABASE_URL`: public project URL (not secret)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public publishable/anon key (not service_role)
- `SUPABASE_SERVICE_ROLE_KEY`: server-only secret; do not expose or use for browser queries
- `SETA_OFFICIAL_EXPORTS_ENABLED`: must remain false; a flag alone must never enable official exports.

Do not commit .env files containing values. Configure Vercel Preview and Production separately only after Vercel project permissions are confirmed.

## Review risks
The SQL migration defines a minimal tenant boundary; it does **not** implement all signup, invitation, SDF delegation, reconciliation, retention, privacy rights or audit event creation workflows. It deliberately has no client-writable invitation or membership policies. Never claim onboarding is functional merely because the migration is present.
