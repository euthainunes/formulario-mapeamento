import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

/**
 * Só usa o Chromium pré-instalado do sandbox de desenvolvimento quando ele
 * existe (evita baixar de novo neste ambiente). No CI (GitHub Actions) esse
 * caminho não existe — lá o browser é instalado via `playwright install` no
 * local padrão do Playwright, então deixamos `executablePath` indefinido.
 */
const SANDBOX_CHROMIUM = "/opt/pw-browsers/chromium";
const sandboxExecutablePath = existsSync(SANDBOX_CHROMIUM) ? SANDBOX_CHROMIUM : undefined;

/**
 * Porta dedicada ao servidor Next.js dos testes de fumaça — deliberadamente
 * diferente de 3000 para não colidir com uma instância de desenvolvimento
 * (possivelmente em modo `api`) que já esteja rodando localmente. O
 * Playwright sobe/derruba este servidor sozinho (ver `webServer` abaixo).
 */
const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  timeout: 30_000,

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    launchOptions: sandboxExecutablePath ? { executablePath: sandboxExecutablePath } : {},
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Testes de fumaça rodam sempre contra o modo mock (determinístico, sem
  // depender de Postgres/Redis/backend) — NEXT_PUBLIC_APP_MODE é omitido de
  // propósito, já que "mock" é o padrão (ver src/lib/app-config.ts).
  //
  // Usa build de produção (`next build && next start`), não `next dev`: o
  // Next.js 16 recusa subir um segundo `next dev` no mesmo diretório do
  // projeto ("Another next dev server is already running"), mesmo em porta
  // diferente — o que quebraria a suíte sempre que já houver um `npm run
  // dev` de desenvolvimento ativo (cenário comum neste repo). `next start`
  // não tem essa trava. NEXT_DIST_DIR isola o output (.next-e2e) do `.next`
  // de uma instância de dev já rodando, para os dois convívios não colidirem.
  webServer: {
    command: `npm run build && npm run start -- -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_APP_MODE: "mock",
      NEXT_DIST_DIR: ".next-e2e",
    },
  },
});
