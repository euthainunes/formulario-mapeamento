/**
 * Lê `JWT_SECRET` do ambiente sem nenhum valor padrão. Um fallback fixo
 * (ex: `'dev-secret-change-me'`) permitiria a qualquer pessoa que conheça o
 * código-fonte forjar um JWT válido — com `tenantId`/permissões arbitrários,
 * incluindo acesso de administradora — sempre que o processo subir sem essa
 * variável configurada. Falhar o boot é a única opção segura aqui.
 */
export function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET não está definido. Configure essa variável de ambiente antes de iniciar o backend " +
        "(ver backend/.env.example) — não existe valor padrão, pois um segredo previsível permitiria " +
        "forjar tokens de autenticação para qualquer tenant.",
    );
  }
  return secret;
}
