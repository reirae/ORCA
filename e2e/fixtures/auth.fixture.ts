import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { AdminLoginPage, ConsultPage, DashboardPage, LoginPage } from "../pages/index.js";

const workerEmail = process.env.WORKER_EMAIL ?? "john@orca.com";
const workerPassword = process.env.WORKER_PASSWORD ?? "WorkerPass123!";
const expertEmail = process.env.EXPERT_EMAIL ?? "bob@orca.com";
const expertPassword = process.env.EXPERT_PASSWORD ?? "ExpertPass123!";
const adminEmail = process.env.ADMIN_EMAIL ?? "admin@orca.com";
const adminPassword = process.env.ADMIN_PASSWORD ?? "AdminPass123!";

/** Revoke the server session via the same API the app uses on sign-out. */
async function logoutViaApi(page: Page) {
  await page.evaluate(async () => {
    const refreshToken = sessionStorage.getItem("orca.refresh");
    const token = sessionStorage.getItem("orca.session");
    if (!refreshToken && !token) return;

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (refreshToken) headers["x-refresh-token"] = refreshToken;

    let csrfToken = sessionStorage.getItem("orca.csrf");
    if (!csrfToken) {
      try {
        const csrfRes = await fetch("/api/csrf-token", {
          credentials: "include",
          headers: refreshToken ? { "x-refresh-token": refreshToken } : {},
        });
        if (csrfRes.ok) {
          const data = await csrfRes.json();
          csrfToken = data.csrfToken ?? null;
        }
      } catch {
        // continue without CSRF — logout may still fail server-side
      }
    }
    if (csrfToken) headers["x-csrf-token"] = csrfToken;

    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify(refreshToken ? { refreshToken } : {}),
      });
    } catch {
      // Best-effort — local cleanup still runs.
    }

    sessionStorage.removeItem("orca.session");
    sessionStorage.removeItem("orca.refresh");
    sessionStorage.removeItem("orca.csrf");
  });
}

type AuthFixtures = {
  loginPage: LoginPage;
  adminLoginPage: AdminLoginPage;
  dashboardPage: DashboardPage;
  consultPage: ConsultPage;
};

export const test = base.extend<AuthFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  adminLoginPage: async ({ page }, use) => {
    await use(new AdminLoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  consultPage: async ({ page }, use) => {
    await use(new ConsultPage(page));
  },
});

// SR-23: closing a Playwright context does not revoke the DB session — logout
// after each test so the next test can sign in as the same seed user.
test.afterEach(async ({ page }) => {
  await logoutViaApi(page);
});

export { expect, workerEmail, workerPassword, expertEmail, expertPassword, adminEmail, adminPassword };

export async function loginAsWorker(page: Page) {
  const login = new LoginPage(page);
  await login.goto();
  await login.login(workerEmail, workerPassword);
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
}

export async function loginAsExpert(page: Page) {
  const login = new LoginPage(page);
  await login.goto();
  await login.login(expertEmail, expertPassword);
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
}

export async function loginAsAdmin(page: Page) {
  const login = new AdminLoginPage(page);
  await login.goto();
  await login.login(adminEmail, adminPassword);
  await expect(page).toHaveURL(/\/adm\/managementDashboard/);
}
