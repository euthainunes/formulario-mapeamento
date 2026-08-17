import { test, expect } from "@playwright/test";
import { loginAsMock } from "./helpers";

test.describe("Login único — apenas Bruna é administradora", () => {
  test("a tela de login é um formulário único de login/senha, sem seleção de conta", async ({ page }) => {
    await page.goto("/login");

    await expect(page.locator("#login")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();

    // As colaboradoras da Comunicação são pessoas rastreadas nos indicadores,
    // não contas do sistema — não devem aparecer como opção de login.
    await expect(page.getByRole("button", { name: "Thainá Nunes" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Mariana Souza" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Camila Duarte" })).toHaveCount(0);

    // Login/senha inválidos mostram erro e não autenticam.
    await page.locator("#login").fill("000");
    await page.locator("#password").fill("errada");
    await page.getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByText("Login ou senha inválidos.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("Bruna (administradora) vê todos os módulos, incluindo Administração", async ({ page }) => {
    await loginAsMock(page, "Bruna Albuquerque");

    await expect(page.getByRole("heading", { name: "Dashboard Executivo" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Relatórios e Exportações" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Administração" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Pessoas e Audiência" })).toBeVisible();
  });
});
