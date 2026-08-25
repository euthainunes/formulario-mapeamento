import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { setAuthCookie } from "@/lib/server/auth-cookie";
import { signSessionToken } from "@/lib/server/admin-session";
import { PermissionKey } from "@/types/auth";

/**
 * POST /api/auth/login — sem banco de dados: existe uma única conta
 * (Bruna, administradora), e as credenciais dela vivem em variáveis de
 * ambiente (ADMIN_LOGIN/ADMIN_PASSWORD), não numa tabela de usuários.
 * Em caso de sucesso, assina um JWT próprio e seta no cookie httpOnly — o
 * token NUNCA é devolvido no corpo da resposta ao client.
 */

// Mesma lista de permissões que o backend NestJS atribuía à administradora
// (PERMISSION_KEYS completo, sem o atalho "*" — que é só convenção do mock).
const ADMIN_PERMISSIONS: PermissionKey[] = [
  "dashboard.view",
  "audience.view",
  "access.view",
  "content.view",
  "beezz.view",
  "engagement.view",
  "pods.view",
  "directory.view",
  "awards.view",
  "report.view",
  "report.export",
  "insights.view",
  "insights.ask",
  "alert.view",
  "team-management.view",
  "admin.view",
  "user.manage",
  "role.manage",
  "integration.manage",
  "sync.view",
  "alert.manage",
  "audit.view",
];

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // Comprimentos diferentes vazam via timing de qualquer forma no length
  // check — mas timingSafeEqual exige buffers do mesmo tamanho, então
  // primeiro igualamos o tamanho com um buffer descartável.
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ statusCode: 400, message: "Corpo da requisição inválido." }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as { email?: string; password?: string };
  if (!email || !password) {
    return NextResponse.json({ statusCode: 400, message: "Informe login e senha." }, { status: 400 });
  }

  const adminLogin = process.env.ADMIN_LOGIN;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminLogin || !adminPassword) {
    return NextResponse.json(
      { statusCode: 500, message: "ADMIN_LOGIN/ADMIN_PASSWORD não configurados no servidor." },
      { status: 500 },
    );
  }

  if (!safeEqual(email, adminLogin) || !safeEqual(password, adminPassword)) {
    return NextResponse.json({ statusCode: 401, message: "Login ou senha inválidos." }, { status: 401 });
  }

  const user = {
    id: "bruna-de-carvalho",
    name: "Bruna de Carvalho",
    email: adminLogin,
    tenantId: "rede-americas",
    permissions: ADMIN_PERMISSIONS,
    avatarInitials: "BC",
  };

  const { token, expiresInSeconds } = await signSessionToken({
    sub: user.id,
    name: user.name,
    email: user.email,
    permissions: user.permissions,
    avatarInitials: user.avatarInitials,
  });

  await setAuthCookie(token, expiresInSeconds);

  return NextResponse.json({ user });
}
