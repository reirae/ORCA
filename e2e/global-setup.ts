/**
 * Waits for the ORCA stack to accept traffic before tests run.
 * In CI this follows `docker compose -f docker-compose.e2e.yml up`.
 */
export default async function globalSetup() {
  const baseURL = process.env.BASE_URL ?? "http://localhost:8080";
  const healthUrl = `${baseURL}/api/health/db`;
  const maxAttempts = 45;
  const delayMs = 2_000;

  let lastError = "unknown";

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(healthUrl, { signal: AbortSignal.timeout(5_000) });
      if (res.ok) {
        const body = await res.json();
        if (body.status === "DB connected!") {
          console.log(`[e2e] App ready at ${baseURL} (attempt ${attempt})`);
          return;
        }
        lastError = `unexpected health payload: ${JSON.stringify(body)}`;
      } else {
        lastError = `HTTP ${res.status}`;
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }

    console.log(`[e2e] Waiting for ${healthUrl} (${attempt}/${maxAttempts}): ${lastError}`);
    await new Promise((r) => setTimeout(r, delayMs));
  }

  throw new Error(`E2E global setup timed out waiting for ${healthUrl}. Last error: ${lastError}`);
}
