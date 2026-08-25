import { SignJWT, jwtVerify } from "jose";
import { PermissionKey } from "@/types/auth";
import { getAuthToken } from "./auth-cookie";

/**
 * Sessão sem banco de dados: existe uma única conta administradora (Bruna),
 * cujo login/senha ficam em variáveis de ambiente (ADMIN_LOGIN/ADMIN_PASSWORD)
 * — não há tabela de usuários. O "login" apenas confere essas duas
 * variáveis e assina um JWT próprio (nunca o token da BeeHome, que é
 * usado só internamente para consultar dados) guardado no cookie httpOnly.
 */
export interface AdminSessionClaims {
  sub: string;
  name: string;
  email: string;
  permissions: PermissionKey[];
  avatarInitials: string;
}

function requireJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "JWT_SECRET não está definido. Configure essa variável de ambiente antes de iniciar o app — não existe valor padrão, pois um segredo previsível permitiria forjar sessões.",
    );
  }
  return new TextEncoder().encode(secret);
}

const SESSION_TTL_SECONDS = 60 * 60; // 1h — mesmo padrão usado antes no backend NestJS

export async function signSessionToken(claims: AdminSessionClaims): Promise<{ token: string; expiresInSeconds: number }> {
  const token = await new SignJWT({ ...claims })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(requireJwtSecret());
  return { token, expiresInSeconds: SESSION_TTL_SECONDS };
}

export async function verifySessionToken(token: string): Promise<AdminSessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, requireJwtSecret());
    return payload as unknown as AdminSessionClaims;
  } catch {
    return null;
  }
}

/** Lê o cookie httpOnly da requisição atual e valida a sessão. Retorna `null` se ausente/inválido/expirado — quem chama decide se responde 401. */
export async function getSessionClaims(): Promise<AdminSessionClaims | null> {
  const token = await getAuthToken();
  if (!token) return null;
  return verifySessionToken(token);
}
