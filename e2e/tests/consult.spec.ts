import { test, expect, loginAsWorker, loginAsExpert } from "../fixtures/auth.fixture.js";

test.describe("Consult hub", () => {
  test("worker sees existing conversations and uncontacted experts", async ({ page, consultPage }) => {
    await loginAsWorker(page);
    await consultPage.goto();
    await consultPage.expectWorkerHub();

    await expect(page.getByText("Conversations")).toBeVisible();
    await expect(consultPage.conversationNamed("Bob Chen")).toBeVisible();

    await expect(page.getByText("Experts you haven't contacted")).toBeVisible();
    await expect(consultPage.conversationNamed("Alice Tan")).toBeVisible();
  });

  test("worker can open a conversation thread", async ({ page, consultPage }) => {
    await loginAsWorker(page);
    await consultPage.goto();
    await consultPage.conversationNamed("Bob Chen").click();

    await expect(page.getByRole("heading", { name: "Bob Chen" })).toBeVisible();
    await expect(page.getByText(/beam alignment on level 3/i)).toBeVisible();
    await expect(page.getByPlaceholder("Message…")).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole("button", { name: "Video call" })).toBeDisabled();
  });

  test("expert sees worker conversation inbox", async ({ page, consultPage }) => {
    await loginAsExpert(page);
    await consultPage.goto();
    await consultPage.expectExpertHub();
    await expect(consultPage.conversationNamed("John Doe")).toBeVisible();
  });
});
