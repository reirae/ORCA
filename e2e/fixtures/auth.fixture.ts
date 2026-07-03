import { test as base, expect } from "@playwright/test";
import { AdminLoginPage, ConsultPage, DashboardPage, LoginPage } from "../pages/index.js";

const workerEmail = process.env.WORKER_EMAIL ?? "john@orca.com";
const workerPassword = process.env.WORKER_PASSWORD ?? "WorkerPass123!";
const expertEmail = process.env.EXPERT_EMAIL ?? "bob@orca.com";
const expertPassword = process.env.EXPERT_PASSWORD ?? "ExpertPass123!";
const adminEmail = process.env.ADMIN_EMAIL ?? "admin@orca.com";
const adminPassword = process.env.ADMIN_PASSWORD ?? "AdminPass123!";

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

export { expect, workerEmail, workerPassword, expertEmail, expertPassword, adminEmail, adminPassword };

export async function loginAsWorker(page: import("@playwright/test").Page) {
  const login = new LoginPage(page);
  await login.goto();
  await login.login(workerEmail, workerPassword);
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function loginAsExpert(page: import("@playwright/test").Page) {
  const login = new LoginPage(page);
  await login.goto();
  await login.login(expertEmail, expertPassword);
  await expect(page).toHaveURL(/\/dashboard/);
}

export async function loginAsAdmin(page: import("@playwright/test").Page) {
  const login = new AdminLoginPage(page);
  await login.goto();
  await login.login(adminEmail, adminPassword);
  await expect(page).toHaveURL(/\/adm\/managementDashboard/);
}
