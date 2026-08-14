import { NextRequest, NextResponse } from "next/server";
import { callBackend } from "@/lib/server/backend-proxy";
import { setAuthCookie } from "@/lib/server/auth-cookie";

/** Lê o campo `exp` (segundos desde epoch) de um JWT sem validar assinatura — usado apenas para dimensionar o maxAge do cookie httpOnly, nunca para autorizar nada (a validação real acontece no backend a cada chamada). */
function readJwtExpirySeconds(token: string): number | null {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;
    const json = Buffer.from(payloadPart, "base64url").toString("utf-8");
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
}

/**
 * POST /api/auth/login — proxy autenticado para POST /auth/login no backend.
 * Recebe { tenantSlug, email, password }, chama o backend e, em caso de
 * sucesso, seta o JWT em um cookie httpOnly/secure/sameSite=lax. O token
 * NUNCA é devolvido no corpo da resposta ao client — apenas os dados de
 * perfil (usuário + permissões), que não são sensíveis do ponto de vista de
 * autenticação.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ statusCode: 400, message: "Corpo da requisição inválido." }, { status: 400 });
  }

  const backendResponse = await callBackend("/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  }).catch(() => null);

  if (!backendResponse) {
    return NextResponse.json(
      { statusCode: 502, message: "Não foi possível conectar ao backend. Verifique se o serviço está em execução (ver README.md)." },
      { status: 502 },
    );
  }

  const data = await backendResponse.json().catch(() => null);

  if (!backendResponse.ok || !data?.accessToken) {
    return NextResponse.json(data ?? { statusCode: backendResponse.status, message: "Falha no login." }, { status: backendResponse.status || 401 });
  }

  const exp = readJwtExpirySeconds(data.accessToken);
  const maxAge = exp ? Math.max(exp - Math.floor(Date.now() / 1000), 60) : 60 * 60; // fallback: 1h

  await setAuthCookie(data.accessToken, maxAge);

  return NextResponse.json({ user: data.user });
}
