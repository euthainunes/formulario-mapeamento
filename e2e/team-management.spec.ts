import { test, expect } from "@playwright/test";
import { loginAsMock } from "./helpers";

test.describe("Gestão do Time — fumaça do módulo", () => {
  test("Bruna acessa a Visão Geral e o Quadro sem erro", async ({ page }) => {
    await loginAsMock(page, "Bruna de Carvalho");

    await page.getByRole("link", { name: "Gestão do Time" }).click();
    await expect(page.getByRole("heading", { name: "Gestão do Time", exact: true })).toBeVisible();
    await expect(page.getByText("Score operacional")).toBeVisible();
    await expect(page.getByText("Algo deu errado")).toHaveCount(0);

    await page.getByRole("link", { name: "Quadro" }).click();
    await expect(page.getByRole("heading", { name: "Gestão do Time — Quadro" })).toBeVisible();
    await expect(page.getByText("Backlog", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Algo deu errado")).toHaveCount(0);
  });
});
