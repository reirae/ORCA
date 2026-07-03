# ORCA E2E tests (Playwright)

End-to-end tests run in two tiers:

1. **Pre-merge (CI)** — full suite (`smoke`, `auth`, `consult`) against a disposable Docker stack at `http://localhost:8080` (`.github/workflows/ci.yml` → `test-e2e`).
2. **Post-deploy** — smoke-only against live production at `https://orca.freeddns.org` (`.github/workflows/deploy.yml` → `verify-smoke`). `BASE_URL` is set in the workflow, not in a local file.

## Prerequisites

- Node.js 24+
- Docker and Docker Compose

Test login users (`john@orca.com`, etc.) are fixture data in `backend/db/seed.sql` with matching defaults in `e2e/fixtures/auth.fixture.ts`.

## Run locally (full suite)

From the repository root, generate a throwaway stack `.env` first:

**Windows (PowerShell):**

```powershell
node e2e/scripts/generate-e2e-env.mjs .env
docker compose -f docker-compose.e2e.yml up -d --build

cd e2e
npm ci
npx playwright install chromium
npm test
```

**Linux / macOS / Git Bash:**

```bash
bash e2e/scripts/generate-e2e-env.sh .env
docker compose -f docker-compose.e2e.yml up -d --build

cd e2e
npm ci
npx playwright install chromium
npm test
```

Both scripts produce the same `.env` (random infra secrets). CI and EC2 use the bash script; use the Node script on Windows where bash is unavailable.

Open the HTML report after a failure:

```bash
npm run report
```

Stop the stack when finished:

```bash
docker compose -f docker-compose.e2e.yml down -v
```

## CI

The `test-e2e` job runs `generate-e2e-env.sh` on Ubuntu, builds the stack, runs the full Playwright suite, uploads reports, and tears the stack down with `docker compose down -v`.

## Project layout

| Path | Purpose |
|------|---------|
| `playwright.config.ts` | Runner config, reporters, retries |
| `global-setup.ts` | Waits for `/api/health/db` before tests |
| `fixtures/` | Shared test helpers and login utilities |
| `pages/` | Page object models |
| `tests/` | Spec files (smoke, auth, consult) |
| `scripts/generate-e2e-env.sh` | Random infra `.env` (Linux / CI) |
| `scripts/generate-e2e-env.mjs` | Same, for Windows dev machines |

## Auth note

ORCA stores JWTs in **sessionStorage** (per tab), not cookies. Tests sign in through the UI for each browser context rather than relying on Playwright `storageState` alone.
