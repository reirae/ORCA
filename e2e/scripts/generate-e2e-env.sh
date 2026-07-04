#!/usr/bin/env bash
# Generate a throwaway root .env for docker-compose.e2e.yml (CI / Linux).
# Infra secrets are random per run; test login users come from backend/db/seed.sql.
set -eu

OUT="${1:-.env}"

cat > "$OUT" <<EOF
MYSQL_ROOT_PASSWORD=$(openssl rand -hex 16)
MYSQL_DATABASE=orca_db
MYSQL_USER=orca_e2e
MYSQL_PASSWORD=$(openssl rand -hex 16)
DB_HOST=db
DB_PORT=3306
LOKI_URL=http://127.0.0.1:3100
JWT_SECRET=$(openssl rand -hex 32)
TOTP_ENC_KEY=$(openssl rand -hex 32)
CSRF_SECRET=$(openssl rand -hex 32)
APP_URL=http://localhost:8080
EOF

echo "Wrote E2E stack environment to $OUT"
