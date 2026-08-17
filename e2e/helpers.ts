import { Page, expect } from "@playwright/test";

/**
 * Faz login no modo mock a partir de `/login`, preenchendo o formulário de
 * login/senha de demonstração (só existe uma conta — Bruna, administradora
 * — então não há mais seleção por nome de conta). O parâmetro `accountName`
 * é mantido só por compatibilidade com os chamadores existentes; hoje o
 * login sempre resulta na sessão da Bruna. Espera o redirecionamento para o
 * Dashboard Executivo (rota "/").
 */
export async function loginAsMock(page: Page, _accountName?: string): Promise<void> {
  await page.goto("/login");
  await page.locator("#login").fill("12457832659");
  await page.locator("#password").fill("redeamericas");
  await page.getByRole("button", { name: "Entrar" }).click();
  await expect(page).toHaveURL("/");
}
