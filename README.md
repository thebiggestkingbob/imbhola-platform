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

## Walk through a reporting cycle

Run `npm run seed:local -- --walkthrough` to add Cedar Workshop with a populated workforce, OFO mapping, skills gap, WSP, ATR, payroll, consultation and a frozen sample report awaiting review. The sample uses the current year. Running the command again preserves work already recorded for Cedar.

1. Sign in as `committee@imbhola.test`, open Cedar Workshop and choose **Reporting and approvals**. Open **Read frozen report** before approving version 1.
2. Sign in as `signatory@imbhola.test` to sign that approved version. Open the same report to read it or save an internal PDF via the browser's print dialog.
3. Sign in as `sdf@imbhola.test` to see Cedar on the client list. Open **External receipts and grants** to test recording a synthetic receipt and later outcome.

The printable report is an internal synthetic report. It uses the exact saved version and shows its review history and SHA-256 digest.

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

## Private interactive review

The isolated review process uses the same SQLite workflows and synthetic fixtures. Its HTTPS entry gate and sample-account sessions both require the review passcode. Use an isolated runtime with a private persistent disk or a named sandbox snapshot, and restrict access to testers. The standard Vercel build continues to serve public information only.

Set `IMBHOLA_REVIEW=1`, `IMBHOLA_REVIEW_HOST` to the isolated HTTPS hostname, and `IMBHOLA_REVIEW_PASSWORD` to a random URL-safe string of at least 24 characters. Supply the passcode through the runtime configuration. Run `npm ci`, `npm run seed:local -- --walkthrough`, `npm run build` and `node scripts/review-server.mjs` in that isolated runtime. The test accounts use the same passcode. Review storage is for synthetic records.
