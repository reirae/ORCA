import {
  test,
  expect,
  workerEmail,
  workerPassword,
  expertEmail,
  expertPassword,
  adminEmail,
  adminPassword,
  loginAsWorker,
  loginAsExpert,
  loginAsAdmin,
} from "../fixtures/auth.fixture.js";

test.describe("Authentication", () => {
  test("worker can sign in and reach dashboard", async ({ page, loginPage, dashboardPage }) => {
    await loginPage.goto();
    await loginPage.login(workerEmail, workerPassword);
    await dashboardPage.expectLoaded();
    await expect(page.getByText(/signed in as worker/i)).toBeVisible();
  });

  test("expert can sign in and reach dashboard", async ({ page, loginPage, dashboardPage }) => {
    await loginPage.goto();
    await loginPage.login(expertEmail, expertPassword);
    await dashboardPage.expectLoaded();
    await expect(page.getByText(/signed in as expert/i)).toBeVisible();
  });

  test("admin can sign in via admin portal", async ({ page, adminLoginPage }) => {
    await adminLoginPage.goto();
    await adminLoginPage.login(adminEmail, adminPassword);
    await expect(page).toHaveURL(/\/adm\/managementDashboard/);
    await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible();
  });

  test("invalid credentials show an error", async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login("nobody@orca.com", "WrongPassword123!");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("admin credentials are rejected on public login", async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login(adminEmail, adminPassword);
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("alert")).toBeVisible();
  });
});

test.describe("Role-based navigation", () => {
  test("worker sees consult and expert directory links", async ({ page, dashboardPage }) => {
    await loginAsWorker(page);
    await dashboardPage.expectLoaded();
    await expect(dashboardPage.consultLink()).toBeVisible();
    await expect(dashboardPage.expertsLink()).toBeVisible();
  });

  test("expert sees consult link but not expert directory", async ({ page, dashboardPage }) => {
    await loginAsExpert(page);
    await dashboardPage.expectLoaded();
    await expect(dashboardPage.consultLink()).toBeVisible();
    await expect(page.getByRole("link", { name: /expert directory/i })).toHaveCount(0);
  });
});
