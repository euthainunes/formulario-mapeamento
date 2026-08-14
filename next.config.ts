import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite isolar o build de testes E2E (Playwright) num diretório de saída
  // próprio, para não colidir com o `.next` de uma instância `next dev` já
  // rodando no mesmo diretório do projeto (ver playwright.config.ts).
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
