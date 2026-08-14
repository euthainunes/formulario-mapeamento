import { test, expect } from "@playwright/test";
import { loginAsMock } from "./helpers";

const MODULES = [
  { label: "Pessoas e Audiência", heading: "Pessoas e Audiência" },
  { label: "Acessos", heading: "Acessos" },
  { label: "Conteúdos e Notícias", heading: "Conteúdos e Notícias" },
  { label: "Pods", heading: "Pods" },
];

test.describe("Navegação entre módulos", () => {
  test("a partir do dashboard, os módulos principais renderizam sem erro via sidebar", async ({ page }) => {
    await loginAsMock(page, "Bruna Albuquerque");

    for (const mod of MODULES) {
      await page.getByRole("link", { name: mod.label }).click();
      await expect(page.getByRole("heading", { name: mod.heading, exact: true })).toBeVisible();
      await expect(page.getByText("Algo deu errado")).toHaveCount(0);
    }
  });
});
