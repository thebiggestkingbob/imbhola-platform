# 07 — Vercel integration and preview runbook

## Source of truth
GitHub: `thebiggestkingbob/imbhola-platform`, default branch `main`. Development code lives in `feature/milestone-1-foundation` until reviewed.

## Current blocker
Several Imbhola-named Vercel integrations issue checks for the same commit. The verified GitHub checks include 403 build-rate-limit failures and an error; the connected Vercel API cannot inspect these projects. See GitHub issue #1. **No successful live URL has been independently verified.**

## Manual Vercel team action
1. Sign into `kingbob-3860` and inspect Imbhola projects.
2. Select one canonical project, record its ID and URL and verify Settings > Git points at this exact GitHub repo.
3. Ensure other projects do not own live domains, then disconnect redundant Git integrations **without deleting unapproved resources**.
4. Confirm framework Next.js, root `./`, no custom output directory, Node runtime supported. Review `vercel.json`.
5. Re-run one deployment only when the team has build capacity; inspect logs.
6. Confirm READY + deployment SHA, publicly navigable paths, `/api/health` response, and no active registration or SETA export.
7. Keep real data and secrets out of preview until security and hosting decisions are approved.

## Vercel acceptance criteria
A canonical project has readable Git settings, exactly one intended deployment connection for the repository, clean build, verified URL, healthy route, no broken public links, no credential collection, and no unverified regulatory behavior.

## When checks fail
Distinguish rate limiting/permissions (Vercel account problem) from Next.js compiler/linter errors (repository problem). Do not create fresh duplicate Vercel projects to fix account access.
