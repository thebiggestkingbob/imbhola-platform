# IMBHOLA — Skills Development Platform

Imbhola is a South African skills-development management and reporting platform in development.

## Status
**Development foundation only.** No real users, live employer data, official SETA exports, or regulatory calculations are production-ready.

## Stack
Next.js 15, React 19, TypeScript, CSS, with a planned PostgreSQL-backed authentication and tenant model. Direction 04 “Editorial Enterprise” is the visual reference.

## Quick start
```bash
npm install
npm run dev
```
Visit http://localhost:3000.

## Scripts
`npm run build`, `npm run typecheck`, `npm run lint`.

## Product scope
Public marketing website, company onboarding, securely invited employees and other company roles, workforce profiles, training plans and evidence, role-specific dashboards, WSP/ATR preparation, and a configurable SETA rules engine. **First SETA is undecided; official submission/export features must remain disabled until actual rules and templates are verified.**

## Development workflow
Read [docs/MASTER_PROMPT_FOR_CODEX.md](docs/MASTER_PROMPT_FOR_CODEX.md), then complete Milestone 0 and Milestone 1 before expanding the backend. Always use fictional demonstration data, validate permissions server-side and do not commit secrets.

## Deployment
Import this repository as a **Next.js** project in Vercel. Root directory: `./`; build command: `npm run build`. Configure separate preview and production settings. No real data or official SETA exports in this foundation.
