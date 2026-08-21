import type { NextConfig } from "next";

// Nonce por requisição em script-src exigiria ler headers() no layout raiz
// pra propagar o nonce até os <script> que o próprio Next injeta — e isso
// força renderização dinâmica em todo o app (perde o prerender estático de
// /login, /beezz etc.). Não vale essa troca só pelos headers de proteção;
// por isso script-src leva 'unsafe-inline'. A proteção contra clickjacking
// que motivou essa mudança não depende disso: `frame-ancestors 'none'` (CSP)
// e `X-Frame-Options: DENY` abaixo cobrem isso por completo, com header
// estático mesmo.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'", // Tailwind + estilos inline via style={{}}
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'", // bloqueia o site de ser carregado em iframe de outra origem (clickjacking)
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" }, // reforço para navegadores que ainda não leem frame-ancestors
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
];

const nextConfig: NextConfig = {
  // Permite isolar o build de testes E2E (Playwright) num diretório de saída
  // próprio, para não colidir com o `.next` de uma instância `next dev` já
  // rodando no mesmo diretório do projeto (ver playwright.config.ts).
  distDir: process.env.NEXT_DIST_DIR || ".next",

  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};

export default nextConfig;
