# IMBHOLA — Skills Development Platform

**Status: development foundation only.** The repository contains a public-site starter and a Codex execution plan, not a live reporting service.

IMBHOLA aims to help South African employers, SDFs and employees manage workforce records, training, evidence, reporting preparation and approvals.

## Run locally
```bash
npm install
npm run dev
```
Open http://localhost:3000.

## Checks
```bash
npm run typecheck
npm run lint
npm run build
```

## Build plan
See [Codex master prompt](docs/MASTER_PROMPT_FOR_CODEX.md), [product scope](docs/01_PRODUCT_SCOPE.md), [roles and access](docs/03_ACCESS_AND_WORKFLOWS.md), and [delivery gates](docs/06_RELEASE_AND_TESTS.md).

**Direction 04 — Editorial Enterprise** is approved conceptually; final color/font tokens need signoff. Login, company signup and dashboards remain placeholders until real verified authentication and organization authorization are implemented.

## Regulatory and privacy notice
The first SETA is **undecided**. No official SETA exports, validated regulatory deadlines, grant guarantees, or portal submissions should be enabled without independently verified source templates and rules. No real employee records or sensitive client documents in this public repository.

## Deployment
Vercel: Next.js framework, root directory `./`, build `npm run build`. Preview before production. Do not add secrets to the repository or enable production data features without a security review.
