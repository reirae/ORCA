import type { Page } from "@playwright/test";

export class LoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.page.getByLabel("Email").fill(email);
    await this.page.getByLabel("Password").fill(password);
    await this.page.getByRole("button", { name: /sign in/i }).click();
  }
}

export class AdminLoginPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/adm/administratorLogin");
  }

  async login(email: string, password: string) {
    await this.page.getByLabel("Email address").fill(email);
    await this.page.getByLabel("Password", { exact: true }).fill(password);
    await this.page.getByRole("button", { name: /sign in/i }).click();
  }
}

export class DashboardPage {
  constructor(private readonly page: Page) {}

  async expectLoaded() {
    await this.page.waitForURL(/\/dashboard/);
    await this.page.getByRole("heading", { level: 1 }).waitFor();
  }

  consultLink() {
    return this.page.getByRole("link", { name: /consult an expert|worker requests/i });
  }

  expertsLink() {
    return this.page.getByRole("link", { name: /expert directory/i });
  }
}

export class ConsultPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/consult");
  }

  async expectWorkerHub() {
    await this.page.getByRole("heading", { name: "Consult an expert" }).waitFor();
  }

  async expectExpertHub() {
    await this.page.getByRole("heading", { name: "Worker requests" }).waitFor();
  }

  conversationNamed(name: string) {
    return this.page.getByRole("button", { name: new RegExp(name, "i") });
  }
}
