# IMBHOLA — OFO mapping and immutable workforce snapshot milestone

## Implemented
- Read-only OFO versions/occupation tables that expose only verified references through Row Level Security.
- Job-title candidate scoring on data already loaded from a verified reference source. Scores are lexical similarity only, not classification confidence and not official verification.
- Authenticated OFO lookup for authorised HR, training, SDF and audit roles.
- Versioned snapshot import batch/line schema with company and reporting-cycle foreign-key constraints.
- Database triggers prohibit modifying/deleting completed workforce batches and snapshot lines.
- Workforce snapshot history route, role-scoped and read-only.
- Automated matching tests run in GitHub Actions alongside workforce parser, typecheck, lint, build and route smoke tests.

## Incomplete: no official OFO library
No actual reference code catalogue has been loaded or authenticated as of 18 November 2026. The first SETA is undecided. The test matcher uses synthetic entries with fictional six-digit codes marked TEST-ONLY; these are never loaded into the database.

## Controls before enabling snapshot commits
1. Confirm lawful processing and UK-hosted data-transfer arrangements under POPIA.
2. Import an authenticated OFO catalogue and preserve the source URL, version, checksum, verification and reviewer evidence.
3. Implement a transactionally atomic, auditable batch importer, including server-owned SHA256 idempotency, duplicate resolution, immutable snapshots and reconciliation against organisation's existing employee list.
4. Ensure every incoming employee record is appropriately protected; never print CSV contents or identity attributes to logs.
5. Test imports with multiple reporting years, failing rows, retry/replay, long values, file limits and two different companies.
6. Never enable official exports until the relevant SETA spreadsheet, reporting year, rule adapter and reviewer acceptance are approved.
7. Review privileged functions, database grants, storage security and operator identity approval.

## Current outcome
Schema applied; forms and read-only views committed. No personal employee record was uploaded. Production activation is intentionally blocked.
