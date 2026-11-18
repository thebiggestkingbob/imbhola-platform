# Supabase activation — IMBHOLA V3

## Provisioning — completed
- Account: THE BIGGEST HQ.
- Dedicated project: `imbhola-platform`.
- Project ref: `ilgwzqjcydhdxdgjjfwr`.
- Region: London (`eu-west-2`).
- Project creation cost quote: USD 0/month; usage/add-ons can incur additional charges.
- Health: ACTIVE_HEALTHY at creation.
- Initial tenant migration and follow-up policy/index migration: applied successfully.

## Verified security baseline
RLS enabled on organizations, organization_memberships, organization_invitations and audit_events. Invitations have no client policies intentionally. All membership and organization mutating operations are still blocked from public clients. RLS performance issues addressed by 202611180002. No live user records imported.

## Environment variables
Set the following separately for *local development* and *Vercel Preview* (do not share Vercel Production until deployment and privacy gates pass):

- NEXT_PUBLIC_SUPABASE_URL=https://ilgwzqjcydhdxdgjjfwr.supabase.co
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<retrieve from Supabase API Keys; publishable, not secret>
- NEXT_PUBLIC_APP_URL=<approved preview URL>
- SETA_OFFICIAL_EXPORTS_ENABLED=false

The publishable key is intended for client use; never use or commit a service_role or secret key. Use password manager/Vercel environment settings for all credentials. Do not store user credentials or employee information in GitHub.

## Important pending gates
- Vercel project access and successful preview build unresolved.
- Email verification, session refresh middleware and recovery redirects not yet configured.
- Verified organization approval/invitation workflows not implemented.
- MFA for privileged users, comprehensive cross-tenant tests, POPIA cross-border transfer and retention review pending.
- User-facing signup/login remain deliberately inactive.
- Initial database is not an approved production environment for real personal data.
