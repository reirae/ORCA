import { test, expect } from "../fixtures/auth.fixture.js";

test.describe("Smoke", () => {
  test("landing page loads for anonymous visitors", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });

  test("API health reports database connectivity", async ({ request }) => {
    const res = await request.get("/api/health/db");
    expect(res.ok()).toBeTruthy();
    await expect(res.json()).resolves.toMatchObject({ status: "DB connected!" });
  });
});
