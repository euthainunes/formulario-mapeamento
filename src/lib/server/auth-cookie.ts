import { cookies } from "next/headers";

/**
 * Nome do cookie httpOnly que guarda o JWT do próprio SaaS (emitido pelo
 * backend NestJS em POST /auth/login). Este token NUNCA é exposto a
 * JavaScript do navegador — só é lido aqui, do lado do servidor (Route
 * Handlers), para montar o header `Authorization: Bearer <token>` repassado
 * ao backend. Não confundir com o `beehome-demo-auth` do zustand persist,
 * que guarda apenas o perfil do usuário (sem token) para fins de UI no modo
 * mock e é seguro de manter em localStorage.
 */
export const AUTH_COOKIE_NAME = "beehome_session";

const isProduction = process.env.NODE_ENV === "production";

export async function setAuthCookie(token: string, maxAgeSeconds: number): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE_NAME)?.value;
}
