import { test, expect } from "@playwright/test";
import { loginAsMock } from "./helpers";

test.describe("RBAC básico — perfil Colaborador", () => {
  test("Camila (Colaborador) não vê itens administrativos/relatórios no menu", async ({ page }) => {
    await loginAsMock(page, "Camila Duarte");

    await expect(page.getByRole("heading", { name: "Dashboard Executivo" })).toBeVisible();

    // Itens permitidos ao perfil Colaborador continuam visíveis.
    await expect(page.getByRole("link", { name: "Conteúdos e Notícias" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Pods" })).toBeVisible();

    // Itens que exigem permissões que Colaborador não tem (report.view, admin.view,
    // audience.view, access.view, user.manage, ...) não devem aparecer no menu.
    await expect(page.getByRole("link", { name: "Relatórios e Exportações" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Administração" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Pessoas e Audiência" })).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Acessos", exact: true })).toHaveCount(0);
  });

  test("Camila (Colaborador) acessando /relatorios diretamente vê a tela de acesso restrito", async ({ page }) => {
    await loginAsMock(page, "Camila Duarte");

    await page.goto("/relatorios");

    await expect(page.getByText("Acesso não disponível para o seu perfil")).toBeVisible();
  });
});
