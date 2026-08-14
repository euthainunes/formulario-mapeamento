import { test, expect } from "@playwright/test";
import { loginAsMock } from "./helpers";

test.describe("Login único — apenas Bruna é administradora", () => {
  test("a tela de login oferece somente a conta da Bruna, sem outras colaboradoras", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("button", { name: "Bruna Albuquerque" })).toBeVisible();

    // As colaboradoras da Comunicação são pessoas rastreadas nos indicadores,
    // não contas do sistema — não devem aparecer como opção de login.
    await expect(page.getByRole("button", { name: "Thainá Nunes" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Mariana Souza" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Camila Duarte" })).toHaveCount(0);
  });

  test("Bruna (administradora) vê todos os módulos, incluindo Administração", async ({ page }) => {
    await loginAsMock(page, "Bruna Albuquerque");

    await expect(page.getByRole("heading", { name: "Dashboard Executivo" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Relatórios e Exportações" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Administração" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Pessoas e Audiência" })).toBeVisible();
  });
});
