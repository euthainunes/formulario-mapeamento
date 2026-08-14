import { Page, expect } from "@playwright/test";

/**
 * Faz login no modo mock a partir de `/login`, clicando no card do usuário
 * fictício pelo nome (ex: "Bruna Albuquerque"). Espera o redirecionamento
 * para o Dashboard Executivo (rota "/").
 */
export async function loginAsMock(page: Page, accountName: string): Promise<void> {
  await page.goto("/login");
  await page.getByRole("button", { name: accountName }).click();
  await expect(page).toHaveURL("/");
}
