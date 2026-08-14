import { test, expect } from "@playwright/test";
import { loginAsMock } from "./helpers";

test.describe("Login mockado", () => {
  test("login como Bruna redireciona para o Dashboard Executivo e mostra o selo de ambiente demonstrativo", async ({ page }) => {
    await loginAsMock(page, "Bruna Albuquerque");

    await expect(page.getByRole("heading", { name: "Dashboard Executivo" })).toBeVisible();
    await expect(page.getByText("Ambiente demonstrativo").first()).toBeVisible();
  });
});
