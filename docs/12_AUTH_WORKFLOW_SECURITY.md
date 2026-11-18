# M2 — Sign-in foundation and access requirements

## Committed implementation
- Server action for email/password authentication via Supabase Auth.
- Server-side check of email verification before access.
- Request-scoped cookie-backed Supabase SSR sessions.
- Middleware refreshes sessions on protected routes.
- Protected dashboard checks verified identity and queries memberships using authenticated RLS.
- Sign-out server action and no-cache account-status endpoint.
- **All sign-in controls remain inactive by default** until IMBHOLA_AUTH_SIGNIN_ENABLED=true is explicitly configured on a reviewed environment.

## Features intentionally NOT implemented
Public employer registration, account creation, invitations, password recovery email flow, MFA enrollment, identity account administration, cross-tenant test fixtures, real training records, and official SETA exports.

## Activation checklist
1. Confirm Supabase email verification settings, valid app URLs and callback allowlist.
2. Configure an approved SMTP/email provider and anti-brute-force protections before exposing public sign-in.
3. Apply a strict application-level rate limiting strategy (e.g. edge/WAF and server-side attempts guard). Supabase provider limits alone do not complete the security review.
4. Test sessions across server-rendered routes, refreshed cookies, logout, unverified accounts and permission removal.
5. Create approved test identities only; never bypass employer verification to add company memberships.
6. Prove two-org RLS isolation for read/write and all download paths.
7. Approve POPIA cross-border transfer, storage retention and operator agreements before real personal data.
8. Configure Vercel secrets through dashboard rather than committing them. Activate sign-in only when staging tests and deployment checks pass.

## Guardrail
Even when sign-in is enabled, a valid Supabase user with **zero active memberships sees no company data**. Membership writes cannot be performed by browser users. Never grant organization access by domain, employer name or claimed SDL number alone.
