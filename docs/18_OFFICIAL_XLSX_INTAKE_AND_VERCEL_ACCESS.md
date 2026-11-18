# IMBHOLA / Services SETA 2026–27 — Authentic XLSX intake procedure

## Current state
The official employee profile template and mandatory-grants code sheet are linked from the [Services SETA employer resources](https://www.serviceseta.org.za/employers/) but have **not been downloaded and structurally inspected** in the working environment. The related guideline is mapped separately in `src/lib/seta/services-guideline.ts`, and it does not establish actual workbook sheet names, formulas, validations or cell positions.

## Next action when official files are obtained
1. Download original current-period .xlsx files via the official employer portal, or request the licensed/authorised files from the pilot SDF.
2. Keep the originals **outside the repository**. Never commit a genuine workbook that includes real employee records or credentials.
3. Run Python 3 locally from the project root:
   ```bash
   python3 scripts/inspect-seta-xlsx.py /secure/originals/employee-template.xlsx /secure/originals/code-sheet.xlsx --out /secure/results/services-seta-structure.json
   ```
4. Review the generated hash, exact worksheet names, dimensions, formula counts, protection and data-validation counts. This tool deliberately excludes raw cell contents and marks `official_format_verified=false`.
5. Have a nominated SDF verify the official source, reporting period, sheet header labels, allowed code values, formulas and protection instructions. Manual content inspection must happen in a secure, access-controlled environment.
6. Create **synthetic** workbook fixtures matching the approved structure, write round-trip and negative tests, and have an SDF sign off the output.
7. Only after completion of privacy, security and official adapter reviews may the SETA export gate be separately considered for approval. **This tool does not enable it.**

The inspector rejects macros, external links, oversized packages and suspicious ZIP paths. It is not a malware scanner, a certification of the workbook, or a substitute for file-scanning infrastructure.

## Staging deployment blocker
The connected Vercel team `kingbob-3860` exposes 13 projects but no Imbhola project. A staging-only create request for `imbhola-staging`, with identity/registration/import/exports disabled, returned HTTP **403 Forbidden: no permission to create the project**. No project or deployment was created.

Required owner step: in the Vercel dashboard confirm your membership has permission to create projects in `kingbob-3860` and the Vercel GitHub integration can access `thebiggestkingbob/imbhola-platform`. Once access is granted, retry a staging-only project; do not merge the draft PR or turn on personal-data collection to work around access.

## Verification
- Synthetic structural parser tests: `python3 scripts/test-seta-xlsx-inspector.py` (also runs in GitHub Actions).
- Standard application tests: `npm run test:services-guideline`, `npm run test:services-seta`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run smoke`.
- None of these verifies actual official workbook compatibility without the source bytes.

All official exports remain **off**, and no real employee data has been imported.
