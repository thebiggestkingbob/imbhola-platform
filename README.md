# IMBHOLA

[MASTER_BRIEF.md](MASTER_BRIEF.md) defines the product scope. The public website is available for preview. The employer, SDF and operations workspaces run locally against SQLite with synthetic data.

## Start the local workspace

Use Node.js 24. From the repository root run:

```sh
npm ci
npm run seed:local
npm run dev:local
```

Open http://127.0.0.1:3000/login. The seed command prints the temporary password for the synthetic `@imbhola.test` accounts. Running the seed again rotates their shared temporary password and ends existing sessions. Local records persist in the ignored `.imbhola-local/` directory.

Use `owner@imbhola.test` for the Atlas workspace, `sdf@imbhola.test` for appointed clients, and `ops@imbhola.test` for tenant and commercial operations. The separate `committee@imbhola.test` and `signatory@imbhola.test` accounts can review and sign Atlas reports. Beacon is a separate test company. Activate a subscription or managed contract from operations before adding Beacon or newly onboarded company records.

Run `npm run dev` instead of `npm run dev:local` to exercise the public-only mode.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

## Release boundaries

Local authentication and database actions require the explicit local development command. Hosted builds expose public information only. Hosted contact collection still needs approved privacy ownership, retention and lead handling. Use synthetic text evidence locally. Production identity and MFA, database row-level security, scanned storage, commercial payment integrations and pilot acceptance remain separate release gates.

The internal report uses synthetic rules with an explicit year: ATR for that calendar year and WSP for the following year. Its JSON snapshots support workflow testing. Services SETA Excel/PDF outputs require independently verified templates, rules, OFO sources and reconciliation. External portal submission remains an authorised person's responsibility.
