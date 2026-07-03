#!/usr/bin/env node
/**
 * Generate a throwaway root .env for docker-compose.e2e.yml.
 * Use on Windows dev machines; CI and Linux use generate-e2e-env.sh instead.
 */
import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import path from "node:path";

const hex = (bytes) => randomBytes(bytes).toString("hex");
const outPath = path.resolve(process.argv[2] ?? ".env");

const contents = `MYSQL_ROOT_PASSWORD=${hex(16)}
MYSQL_DATABASE=orca_db
MYSQL_USER=orca_e2e
MYSQL_PASSWORD=${hex(16)}
DB_HOST=db
DB_PORT=3306
LOKI_URL=http://127.0.0.1:3100
JWT_SECRET=${hex(32)}
TOTP_ENC_KEY=${hex(32)}
CSRF_SECRET=${hex(32)}
APP_URL=http://localhost:8080
`;

writeFileSync(outPath, contents, "utf8");
console.log(`Wrote E2E stack environment to ${outPath}`);
